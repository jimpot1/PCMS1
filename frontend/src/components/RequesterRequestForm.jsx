import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { pcmsApi } from '../services/api.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
}

export default function RequesterRequestForm({ currentUser, onSubmitted, summary }) {
  const requesterName = currentUser?.full_name || [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.email || 'Requester';
  const [documentType, setDocumentType] = useState('request');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [suppliesList, setSuppliesList] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [form, setForm] = useState({
    asset_id: '',
    purpose: '',
    valid_until: '',
    department: currentUser?.department || '',
    unit: '',
    branch: '',
    priority: 'normal',
    date_needed: '',
    destination: '',
    vehicle: '',
    driver: '',
    condition_before: 'good',
    transfer_type: 'permanent',
    requested_by: requesterName,
  });
  const emptyRequestLine = () => ({ qty: '', unit: '', item: '', description: '', estimated_cost: '', remarks: '', particular: '', unitPrice: '', amount: '', type: 'new', source_type: 'new', source_id: '', selectedItem: null, searchResults: [], isSearching: false, preferred_custodian: '', expected_usage: '', location: '', expected_return_date: '' });
  const [lineItems, setLineItems] = useState([emptyRequestLine()]);
  const searchTimers = useRef({});

  useEffect(() => {
    updateField('department', currentUser?.department || '');
  }, [currentUser?.department]);

  useEffect(() => {
    pcmsApi.departments().then(setDepartmentsList).catch(() => {});
    pcmsApi.requesterItemSearch('', { limit: 200 })
      .then((results) => {
        const catalog = results || [];
        setAssetsList(catalog.filter((entry) => entry.item_type === 'asset'));
        setSuppliesList(catalog.filter((entry) => entry.item_type === 'supply'));
      })
      .catch((err) => setError(err.message));
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const addLineItem = () => setLineItems((current) => [...current, emptyRequestLine()]);
  const removeLineItem = (index) => setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const updateLineItem = (index, field, value) => {
    setLineItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, [field]: value };
      if ((field === 'qty' || field === 'unitPrice') && item.selectedItem) {
        const qty = Number(field === 'qty' ? value : next.qty || 0);
        const unitCost = Number(field === 'unitPrice' ? value : next.unitPrice || 0);
        next.amount = qty * unitCost;
        next.estimated_cost = qty * unitCost;
      }
      return next;
    }));
  };

  const searchRequestItems = (index, value) => {
    updateLineItem(index, 'item', value);
    updateLineItem(index, 'particular', value);
    updateLineItem(index, 'selectedItem', null);
    updateLineItem(index, 'source_type', 'new');
    updateLineItem(index, 'source_id', '');
    updateLineItem(index, 'unitPrice', '');
    updateLineItem(index, 'amount', '');
    updateLineItem(index, 'estimated_cost', '');
    clearTimeout(searchTimers.current[index]);
    if (!value.trim()) {
      updateLineItem(index, 'searchResults', []);
      return;
    }
    updateLineItem(index, 'isSearching', true);
    searchTimers.current[index] = setTimeout(async () => {
      try {
        const results = await pcmsApi.requesterItemSearch(value);
        updateLineItem(index, 'searchResults', results);
      } catch {
        updateLineItem(index, 'searchResults', []);
      } finally {
        updateLineItem(index, 'isSearching', false);
      }
    }, 250);
  };

  const selectRequestItem = (index, catalogItem) => {
    const qty = Number(lineItems[index]?.qty || 1);
    const unitCost = Number(catalogItem.unit_cost ?? catalogItem.unit_price ?? 0);
    setLineItems((current) => current.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      item: catalogItem.name,
      particular: catalogItem.name,
      description: catalogItem.description || item.description,
      type: catalogItem.item_type,
      source_type: catalogItem.item_type,
      // backend requesterCatalogRow exposes `id` and `source_ref` — prefer `id`, fallback to `source_id`
      source_id: catalogItem.id ?? catalogItem.source_id ?? '',
      source_ref: catalogItem.source_ref ?? catalogItem.sourceRef ?? null,
      selectedItem: catalogItem,
      searchResults: [],
      unitPrice: unitCost,
      estimated_cost: qty * unitCost,
      amount: qty * unitCost,
    } : item));
  };

  const workflowForLine = (item) => {
    const selected = item.selectedItem;
    const qty = Number(item.qty || 0);
    const available = Number(selected?.available_quantity ?? selected?.current_stock ?? 0);
    if (!selected || selected.item_type === 'new' || available < qty) return 'Purchase Workflow';
    if (selected.item_type === 'asset') return 'Asset Assignment';
    if (selected.item_type === 'supply') return 'Supplies Inventory Release';
    return 'Purchase Workflow';
  };

  const calculateTotal = () => lineItems.reduce((sum, item) => {
    const amount = Number(item.amount || item.estimated_cost || (Number(item.qty || 0) * Number(item.unitPrice || 0)) || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const subtotal = calculateTotal();
  const vat = documentType === 'purchase_order' ? subtotal * 0.12 : 0;
  const grandTotal = subtotal + vat;

  useEffect(() => {
    const next = [];
    lineItems.forEach((item) => {
      const name = item.item || item.particular;
      const selected = item.selectedItem;
      const qty = Number(item.qty || 0);
      const available = Number(selected?.available_quantity ?? selected?.current_stock ?? 0);

      if (selected && qty > available) {
        next.push({ type: 'inventory_limit', severity: 'high', message: `${selected.name} is unavailable in the requested quantity. Purchase Workflow will be initiated.` });
      } else if (qty > 0 && qty >= 100 && selected?.item_type === 'supply') {
        next.push({ type: 'high_quantity', severity: 'medium', message: `${name || 'Item'} quantity is unusually high for a supply request.` });
      }

      if (selected?.item_type === 'asset' && (summary?.assigned_assets || []).some((assignment) => assignment.asset?.name === selected.name)) {
        next.push({ type: 'similar_assigned', severity: 'info', message: `You already have a similar asset assigned: ${selected.name}.` });
      }
    });

    if ((summary?.assigned_assets || []).length > 0 && documentType !== 'gate_pass') {
      next.push({ type: 'assigned_assets', severity: 'info', message: 'Review your assigned assets before requesting new equipment.' });
    }
    setRecommendations(next);
  }, [lineItems, suppliesList, summary, documentType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let response;
      if (documentType === 'gate_pass') {
        response = await pcmsApi.requesterCreateGatePass({
          asset_id: form.asset_id,
          purpose: form.purpose,
          destination: form.destination,
          vehicle: form.vehicle,
          driver: form.driver,
          quantity: lineItems[0]?.qty || 1,
          condition_before: form.condition_before,
          valid_until: form.valid_until,
        });
      } else {
        const payload = {
          request_type: documentType,
          department: form.department,
          unit: form.unit,
          branch: form.branch,
          priority: form.priority,
          date_needed: form.date_needed,
          purpose: form.purpose,
          total_amount: documentType === 'purchase_order' ? grandTotal : subtotal,
          requested_by_name: requesterName,
          line_items: lineItems.filter((item) => item.particular || item.item || item.qty || item.unitPrice || item.estimated_cost).map((item) => ({
            qty: item.qty,
            unit: item.unit,
            particular: item.particular || item.item,
            item: item.item || item.particular,
            description: item.description,
            remarks: item.remarks,
            quantity: item.qty,
            unit_price: item.unitPrice,
            estimated_cost: item.estimated_cost || item.amount,
            amount: item.amount,
            type: item.source_type || item.type,
            source_type: item.source_type || item.type,
            source_id: item.source_id,
            source_ref: item.source_ref ?? null,
            preferred_custodian: item.preferred_custodian,
            expected_usage: item.expected_usage,
            location: item.location,
            expected_return_date: item.expected_return_date,
          })),
        };

        response = await pcmsApi.requesterCreatePurchaseRequest(payload);
      }

      const nextApprover = response?.workflow?.next_approver;
      const nextRole = response?.workflow?.next_approver_role || 'next approver';
      setMessage(nextApprover ? `Submitted and routed to ${nextApprover.name} (${nextRole}).` : `Submitted and routed to ${nextRole}.`);
      setForm({ asset_id: '', purpose: '', valid_until: '', department: currentUser?.department || '', unit: '', branch: '', priority: 'normal', date_needed: '', destination: '', vehicle: '', driver: '', condition_before: 'good', transfer_type: 'permanent', requested_by: requesterName });
      setLineItems([emptyRequestLine()]);
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="requester-panel-card">
      <div className="requester-panel-header">
        <div>
          <h3>Submit Request</h3>
          <p>Create a new request using the requester-safe catalog.</p>
        </div>
      </div>
      {message && <div className="requester-alert success">{message}</div>}
      {error && <div className="requester-alert error">{error}</div>}
      <form className="requester-form" onSubmit={handleSubmit}>
        <div className="requester-form-grid">
          <div className="requester-card">
            <h4>Request Information</h4>
            <div className="requester-field-group">
              <label>Document Type</label>
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                <option value="purchase_order">Purchase Order</option>
                <option value="request">Request Form</option>
                <option value="gate_pass">Gate Pass</option>
              </select>
            </div>
            {documentType === 'gate_pass' ? (
              <>
                <div className="requester-field-group">
                  <label>Asset</label>
                  <select value={form.asset_id} onChange={(event) => updateField('asset_id', event.target.value)} required>
                    <option value="">Select asset</option>
                    {assetsList.map((asset) => <option key={asset.source_id} value={asset.source_id}>{asset.name} / {asset.category}</option>)}
                  </select>
                </div>
                <div className="requester-field-group">
                  <label>Purpose</label>
                  <textarea value={form.purpose} onChange={(event) => updateField('purpose', event.target.value)} rows={3} required />
                </div>
                <div className="requester-field-group">
                  <label>Destination</label>
                  <input value={form.destination} onChange={(event) => updateField('destination', event.target.value)} required />
                </div>
                <div className="requester-field-group">
                  <label>Vehicle</label>
                  <input value={form.vehicle} onChange={(event) => updateField('vehicle', event.target.value)} />
                </div>
                <div className="requester-field-group">
                  <label>Driver</label>
                  <input value={form.driver} onChange={(event) => updateField('driver', event.target.value)} />
                </div>
                <div className="requester-field-group">
                  <label>Expected Return Date</label>
                  <input type="date" value={form.valid_until} onChange={(event) => updateField('valid_until', event.target.value)} required />
                </div>
              </>
            ) : (
              <>
                <div className="requester-field-group">
                  <label>Department</label>
                  <select value={currentUser?.department || form.department} disabled={!currentUser?.department} required>
                    <option value={currentUser?.department || ''}>{currentUser?.department || 'Loading department...'}</option>
                  </select>
                </div>
                <div className="requester-field-group">
                  <label>Branch / Location</label>
                  <input value={form.branch} onChange={(event) => updateField('branch', event.target.value)} placeholder="Branch / location" required />
                </div>
                <div className="requester-field-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="requester-field-group">
                  <label>Date Needed</label>
                  <input type="date" value={form.date_needed} onChange={(event) => updateField('date_needed', event.target.value)} />
                </div>
                <div className="requester-field-group">
                  <label>Requested By</label>
                  <input value={requesterName} disabled />
                </div>
                <div className="requester-field-group">
                  <label>Purpose</label>
                  <textarea value={form.purpose} onChange={(event) => updateField('purpose', event.target.value)} rows={3} placeholder="Describe the request purpose" required />
                </div>
              </>
            )}
          </div>

          <div className="requester-card">
            <div className="requester-card-header">
              <h4>Requested Items</h4>
              <button className="requester-inline-btn" type="button" onClick={addLineItem}><Plus size={14} /> Add Item</button>
            </div>
            <div className="requester-table-wrap">
              <table className="requester-items-table">
                <thead>
                  <tr>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Search Item</th>
                    <th>Description</th>
                    <th>Cost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index}>
                      <td><input value={item.qty} onChange={(event) => updateLineItem(index, 'qty', event.target.value)} /></td>
                      <td><input value={item.unit} onChange={(event) => updateLineItem(index, 'unit', event.target.value)} /></td>
                      <td>
                        <div className="requester-search-cell">
                          <input value={item.item} onChange={(event) => searchRequestItems(index, event.target.value)} placeholder="Search item" />
                          {item.searchResults?.length > 0 && (
                            <div className="requester-search-results">
                              {item.searchResults.map((result) => (
                                <button key={`${result.item_type}-${result.id ?? result.source_id}`} type="button" onClick={() => selectRequestItem(index, result)}>
                                  <strong>{result.name}</strong>
                                  <span>{result.item_type} • {result.category} • {result.status}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td><input value={item.description} onChange={(event) => updateLineItem(index, 'description', event.target.value)} /></td>
                      <td><input type="number" min="0" step="0.01" value={item.estimated_cost || item.amount || ''} onChange={(event) => updateLineItem(index, 'estimated_cost', event.target.value)} readOnly={Boolean(item.selectedItem && item.selectedItem.item_type === 'supply')} /></td>
                      <td><button className="requester-icon-btn" type="button" onClick={() => removeLineItem(index)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="requester-summary-box">
              <div><span>Estimated Total</span><strong>{formatCurrency(subtotal)}</strong></div>
              <div><span>Workflow</span><strong>{lineItems.some((item) => item.item || item.particular) ? 'Approved routing preview' : 'Pending item selection'}</strong></div>
            </div>
            {recommendations.length > 0 && (
              <div className="requester-recommendations">
                {recommendations.map((item, index) => <div key={`${item.type}-${index}`}><span>{item.severity}</span><p>{item.message}</p></div>)}
              </div>
            )}
            <button className="requester-submit-btn" type="submit" disabled={loading}><Upload size={16} /> {loading ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </div>
      </form>
    </section>
  );
}
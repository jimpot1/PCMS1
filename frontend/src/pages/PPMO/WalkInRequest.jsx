import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, FileText, Loader2, PackageCheck, Plus, Search, ShieldCheck, Trash2, UploadCloud, UserPlus, X } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

const documentTypes = [
  { value: 'request', label: 'Request Form', icon: ClipboardList },
  { value: 'purchase_order', label: 'Purchase Order', icon: FileText },
  { value: 'gate_pass', label: 'Gate Pass', icon: PackageCheck },
];

const emptyLineItem = () => ({
  item: '',
  particular: '',
  description: '',
  qty: 1,
  unit: '',
  remarks: '',
  unitPrice: '',
  amount: '',
  type: 'new',
  source_type: 'new',
  source_id: '',
  source_ref: null,
  selectedItem: null,
  searchResults: [],
  isSearching: false,
});

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
}

export default function WalkInRequest() {
  const [hasAccount, setHasAccount] = useState(true);
  const [requesterSearch, setRequesterSearch] = useState('');
  const [requesterOptions, setRequesterOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRequester, setSelectedRequester] = useState(null);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetOptions, setAssetOptions] = useState([]);
  const [selectedGateAsset, setSelectedGateAsset] = useState(null);
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [approvalDocument, setApprovalDocument] = useState(null);
  const [approvalPreviewUrl, setApprovalPreviewUrl] = useState(null);
  const itemSearchTimers = useRef({});

  const [form, setForm] = useState({
    walk_in_requester_name: '',
    walk_in_requester_contact: '',
    walk_in_notes: '',
    department_id: '',
    unit: '',
    branch: '',
    priority: 'normal',
    date_needed: '',
    purpose: '',
    request_type: 'request',
    valid_until: '',
    destination: '',
    vehicle: '',
    driver: '',
    condition_before: 'good',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const subtotal = useMemo(() => lineItems.reduce((sum, line) => {
    const amount = Number(line.amount || (Number(line.qty || 0) * Number(line.unitPrice || 0)) || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0), [lineItems]);
  const vat = form.request_type === 'purchase_order' ? subtotal * 0.12 : 0;
  const grandTotal = subtotal + vat;

  useEffect(() => {
    pcmsApi.departments().then(setDepartmentsList).catch(() => {});
  }, []);

  useEffect(() => {
    if (!approvalDocument) {
      setApprovalPreviewUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(approvalDocument);
    setApprovalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [approvalDocument]);

  useEffect(() => {
    if (!hasAccount) {
      setRequesterOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearching(true);
      pcmsApi.walkInRequesterOptions(requesterSearch)
        .then(setRequesterOptions)
        .catch(() => setRequesterOptions([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [requesterSearch, hasAccount]);

  useEffect(() => {
    if (form.request_type !== 'gate_pass' || !assetSearch.trim()) {
      setAssetOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      pcmsApi.assets({ search: assetSearch, limit: 12 })
        .then((assets) => setAssetOptions(assets || []))
        .catch(() => setAssetOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [assetSearch, form.request_type]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateLineItem = (index, field, value) => {
    setLineItems((current) => current.map((line, i) => {
      if (i !== index) return line;
      const next = { ...line, [field]: value };
      if (field === 'qty' || field === 'unitPrice') {
        const qty = Number(field === 'qty' ? value : next.qty || 0);
        const unitPrice = Number(field === 'unitPrice' ? value : next.unitPrice || 0);
        next.amount = qty * unitPrice;
      }
      return next;
    }));
  };
  const addLineItem = () => setLineItems((current) => [...current, emptyLineItem()]);
  const removeLineItem = (index) => setLineItems((current) => current.filter((_, i) => i !== index));

  const searchLineItems = (index, value) => {
    updateLineItem(index, 'item', value);
    setLineItems((current) => current.map((line, i) => i === index ? {
      ...line,
      particular: value,
      selectedItem: null,
      source_type: 'new',
      source_id: '',
      source_ref: null,
    } : line));

    clearTimeout(itemSearchTimers.current[index]);
    if (!value.trim()) {
      updateLineItem(index, 'searchResults', []);
      return;
    }

    updateLineItem(index, 'isSearching', true);
    itemSearchTimers.current[index] = setTimeout(async () => {
      try {
        const results = await pcmsApi.walkInItemSearch(value);
        updateLineItem(index, 'searchResults', results);
      } catch {
        updateLineItem(index, 'searchResults', []);
      } finally {
        updateLineItem(index, 'isSearching', false);
      }
    }, 250);
  };

  const selectLineItem = (index, catalogItem) => {
    const qty = Number(lineItems[index]?.qty || 1);
    const unitPrice = Number(catalogItem.unit_cost ?? catalogItem.unit_price ?? 0);
    setLineItems((current) => current.map((line, i) => i === index ? {
      ...line,
      item: catalogItem.name,
      particular: catalogItem.name,
      description: catalogItem.description || line.description,
      unit: catalogItem.unit || line.unit || 'unit',
      unitPrice,
      amount: qty * unitPrice,
      type: catalogItem.item_type,
      source_type: catalogItem.item_type,
      source_id: catalogItem.id ?? catalogItem.source_id ?? '',
      source_ref: catalogItem.source_ref ?? null,
      selectedItem: catalogItem,
      searchResults: [],
    } : line));
  };

  const selectGateAsset = (asset) => {
    setSelectedGateAsset(asset);
    setAssetSearch(asset.name || asset.property_number || '');
    setAssetOptions([]);
    if (asset.department_id && !form.department_id) {
      updateField('department_id', asset.department_id);
    }
    setLineItems([{
      ...emptyLineItem(),
      item: asset.name || 'Selected asset',
      particular: asset.name || 'Selected asset',
      description: asset.description || asset.property_number || '',
      qty: 1,
      unit: 'unit',
      unitPrice: Number(asset.purchase_cost || 0),
      amount: Number(asset.purchase_cost || 0),
    }]);
  };

  const resetForm = () => {
    setHasAccount(true);
    setSelectedRequester(null);
    setRequesterSearch('');
    setAssetSearch('');
    setAssetOptions([]);
    setSelectedGateAsset(null);
    setAlreadyApproved(false);
    setApprovalDocument(null);
    setLineItems([emptyLineItem()]);
    setForm({
      walk_in_requester_name: '',
      walk_in_requester_contact: '',
      walk_in_notes: '',
      department_id: '',
      unit: '',
      branch: '',
      priority: 'normal',
      date_needed: '',
      purpose: '',
      request_type: 'request',
      valid_until: '',
      destination: '',
      vehicle: '',
      driver: '',
      condition_before: 'good',
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (hasAccount && !selectedRequester) {
      setError('Select the requester account, or switch to "No account" if they do not have one.');
      return;
    }
    if (!hasAccount && !form.walk_in_requester_name.trim()) {
      setError('Enter the walk-in requester name.');
      return;
    }
    if (form.request_type === 'request' && !form.date_needed) {
      setError('Date needed is required for Request Form submissions.');
      return;
    }
    if (form.request_type === 'gate_pass' && (!selectedGateAsset || !form.valid_until || !form.purpose.trim())) {
      setError('Select an asset, purpose, and expected return date for the Gate Pass.');
      return;
    }
    if (alreadyApproved && form.request_type === 'gate_pass') {
      setError('Already Approved applies to walk-in Request Forms and Purchase Orders. Use the Gate Pass approval workflow for assets going out.');
      return;
    }
    if (alreadyApproved && !approvalDocument) {
      setError('Upload the physical approved request form before submitting an already-approved walk-in request.');
      return;
    }

    const cleanLineItems = lineItems.filter((line) => line.item.trim());
    if (form.request_type !== 'gate_pass' && cleanLineItems.length === 0) {
      setError('Add at least one item.');
      return;
    }

    const common = {
      has_account: hasAccount,
      requester_user_id: hasAccount ? selectedRequester?.id : undefined,
      walk_in_requester_name: hasAccount ? undefined : form.walk_in_requester_name,
      walk_in_requester_contact: form.walk_in_requester_contact || undefined,
      walk_in_notes: form.walk_in_notes || undefined,
      department_id: form.department_id || undefined,
      purpose: form.purpose || undefined,
      already_approved: alreadyApproved,
      approval_document: alreadyApproved ? approvalDocument : undefined,
    };

    try {
      setSubmitting(true);
      let response;
      if (form.request_type === 'gate_pass') {
        response = await pcmsApi.createWalkInGatePass({
          ...common,
          asset_id: selectedGateAsset.id,
          valid_until: form.valid_until,
          destination: form.destination || undefined,
          vehicle: form.vehicle || undefined,
          driver: form.driver || undefined,
          quantity: Number(lineItems[0]?.qty || 1),
          condition_before: form.condition_before,
        });
      } else {
        response = await pcmsApi.createWalkInPurchaseRequest({
          ...common,
          unit: form.unit || undefined,
          branch: form.branch || undefined,
          priority: form.priority,
          date_needed: form.date_needed || undefined,
          request_type: form.request_type,
          total_amount: form.request_type === 'purchase_order' ? grandTotal : subtotal,
          line_items: cleanLineItems.map((line) => ({
            type: line.source_type || line.type || 'new',
            source_type: line.source_type || line.type || 'new',
            source_id: line.source_id || undefined,
            source_ref: line.source_ref || undefined,
            item: line.item,
            particular: line.particular || line.item,
            description: line.description || undefined,
            quantity: Number(line.qty) || 1,
            qty: Number(line.qty) || 1,
            unit: line.unit,
            remarks: line.remarks,
            unit_price: Number(line.unitPrice || 0),
            unitPrice: Number(line.unitPrice || 0),
            estimated_cost: Number(line.amount || 0),
            amount: Number(line.amount || 0),
          })),
        });
      }

      const reference = response?.data?.request_number || response?.data?.gate_pass_number || '';
      setSuccess(`Walk-in ${documentTypes.find((type) => type.value === form.request_type)?.label || 'document'} ${reference} submitted.`);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to submit walk-in document.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeDocument = documentTypes.find((type) => type.value === form.request_type);

  return (
    <div className="walkin-page">
      <section className="walkin-hero">
        <div className="walkin-hero-icon"><UserPlus size={22} /></div>
        <div>
          <h1>Walk-in Request</h1>
          <p>Prepare Request Forms, Purchase Orders, and Gate Passes for people who came directly to the PPMO office.</p>
        </div>
      </section>

      {error && <div className="walkin-alert error"><AlertTriangle size={18} /><p>{error}</p></div>}
      {success && <div className="walkin-alert success"><CheckCircle2 size={18} /><p>{success}</p></div>}

      <form className="walkin-form" onSubmit={handleSubmit}>
        <div className="walkin-document-tabs">
          {documentTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                type="button"
                key={type.value}
                className={form.request_type === type.value ? 'active' : ''}
                onClick={() => {
                  updateField('request_type', type.value);
                  setError(null);
                }}
              >
                <Icon size={16} /> {type.label}
              </button>
            );
          })}
        </div>

        <div className="walkin-form-grid">
          <div className="walkin-card">
            <h4>{activeDocument?.label || 'Document'} Details</h4>

            <div className="walkin-field-group">
              <label>Does this person have a PCMS account?</label>
              <div className="walkin-radio-row">
                <label className="walkin-radio">
                  <input type="radio" name="hasAccount" checked={hasAccount} onChange={() => setHasAccount(true)} />
                  Yes, has an account
                </label>
                <label className="walkin-radio">
                  <input type="radio" name="hasAccount" checked={!hasAccount} onChange={() => setHasAccount(false)} />
                  No account
                </label>
              </div>
            </div>

            {hasAccount ? (
              <div className="walkin-field-group">
                <label htmlFor="requester-search">Find Requester Account</label>
                <div className="walkin-search-cell">
                  <input
                    id="requester-search"
                    type="text"
                    placeholder="Search by name, email, or employee ID"
                    value={selectedRequester ? (selectedRequester.full_name || `${selectedRequester.first_name || ''} ${selectedRequester.last_name || ''}`.trim()) : requesterSearch}
                    onChange={(e) => {
                      setSelectedRequester(null);
                      setRequesterSearch(e.target.value);
                    }}
                  />
                  {searching && <Loader2 size={16} className="spin" />}
                  {!selectedRequester && requesterOptions.length > 0 && (
                    <div className="walkin-search-results">
                      {requesterOptions.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => {
                            setSelectedRequester(option);
                            setRequesterSearch('');
                          }}
                        >
                          <strong>{option.full_name || `${option.first_name || ''} ${option.last_name || ''}`.trim()}</strong>
                          <span>{option.department || 'No department'} - {option.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="walkin-field-row">
                <div className="walkin-field-group">
                  <label htmlFor="walkin-name">Requester Name</label>
                  <input id="walkin-name" type="text" value={form.walk_in_requester_name} onChange={(e) => updateField('walk_in_requester_name', e.target.value)} placeholder="Full name" required />
                </div>
                <div className="walkin-field-group">
                  <label htmlFor="walkin-contact">Contact Number / Email</label>
                  <input id="walkin-contact" type="text" value={form.walk_in_requester_contact} onChange={(e) => updateField('walk_in_requester_contact', e.target.value)} />
                </div>
              </div>
            )}

            <div className="walkin-field-row">
              <div className="walkin-field-group">
                <label htmlFor="walkin-department">Department</label>
                <select id="walkin-department" value={form.department_id} onChange={(e) => updateField('department_id', e.target.value)}>
                  <option value="">Select department</option>
                  {departmentsList.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                </select>
              </div>
              <div className="walkin-field-group">
                <label htmlFor="walkin-branch">Branch / Location</label>
                <input id="walkin-branch" type="text" value={form.branch} onChange={(e) => updateField('branch', e.target.value)} placeholder="e.g. Main Campus" />
              </div>
            </div>

            {form.request_type === 'gate_pass' ? (
              <>
                <div className="walkin-field-group">
                  <label htmlFor="walkin-asset-search">Asset To Take Out</label>
                  <div className="walkin-search-cell">
                    <input
                      id="walkin-asset-search"
                      type="text"
                      value={selectedGateAsset ? `${selectedGateAsset.name} (${selectedGateAsset.property_number || selectedGateAsset.asset_id || 'Asset'})` : assetSearch}
                      onChange={(e) => {
                        setSelectedGateAsset(null);
                        setAssetSearch(e.target.value);
                      }}
                      placeholder="Search asset by name, property no., serial no."
                    />
                    {!selectedGateAsset && assetOptions.length > 0 && (
                      <div className="walkin-search-results">
                        {assetOptions.map((asset) => (
                          <button type="button" key={asset.id} onClick={() => selectGateAsset(asset)}>
                            <strong>{asset.name}</strong>
                            <span>{asset.property_number || asset.asset_id || 'No property no.'} - {asset.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="walkin-field-row">
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-destination">Destination</label>
                    <input id="walkin-destination" value={form.destination} onChange={(e) => updateField('destination', e.target.value)} />
                  </div>
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-valid-until">Expected Return Date</label>
                    <input id="walkin-valid-until" type="date" value={form.valid_until} onChange={(e) => updateField('valid_until', e.target.value)} required />
                  </div>
                </div>
                <div className="walkin-field-row">
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-vehicle">Vehicle</label>
                    <input id="walkin-vehicle" value={form.vehicle} onChange={(e) => updateField('vehicle', e.target.value)} />
                  </div>
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-driver">Driver</label>
                    <input id="walkin-driver" value={form.driver} onChange={(e) => updateField('driver', e.target.value)} />
                  </div>
                </div>
                <div className="walkin-field-group">
                  <label htmlFor="walkin-condition">Condition Before</label>
                  <select id="walkin-condition" value={form.condition_before} onChange={(e) => updateField('condition_before', e.target.value)}>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="walkin-field-row">
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-priority">Priority</label>
                    <select id="walkin-priority" value={form.priority} onChange={(e) => updateField('priority', e.target.value)}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="walkin-field-group">
                    <label htmlFor="walkin-date-needed">Date Needed</label>
                    <input id="walkin-date-needed" type="date" value={form.date_needed} onChange={(e) => updateField('date_needed', e.target.value)} />
                  </div>
                </div>
                <div className="walkin-field-group">
                  <label htmlFor="walkin-unit">Unit</label>
                  <input id="walkin-unit" type="text" value={form.unit} onChange={(e) => updateField('unit', e.target.value)} />
                </div>
              </>
            )}

            <div className="walkin-field-group">
              <label htmlFor="walkin-purpose">Purpose</label>
              <textarea id="walkin-purpose" rows={3} value={form.purpose} onChange={(e) => updateField('purpose', e.target.value)} placeholder="Why is this being requested?" />
            </div>

            {form.request_type !== 'gate_pass' && (
              <div className="walkin-approval-panel">
                <label className="walkin-check">
                  <input
                    type="checkbox"
                    checked={alreadyApproved}
                    onChange={(e) => {
                      setAlreadyApproved(e.target.checked);
                      if (!e.target.checked) setApprovalDocument(null);
                    }}
                  />
                  <span>
                    <strong>Already Approved</strong>
                    <small>Requires an uploaded signed form and manual verification before release.</small>
                  </span>
                </label>

                {alreadyApproved && (
                  <div className="walkin-field-group">
                    <label htmlFor="approval-document">Physical Approved Request Form</label>
                    <div className="walkin-upload-box">
                      <input
                        id="approval-document"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setApprovalDocument(e.target.files?.[0] || null)}
                      />
                      <UploadCloud size={18} />
                      <span>{approvalDocument ? approvalDocument.name : 'Upload PDF or image'}</span>
                      {approvalDocument && (
                        <button type="button" onClick={() => setApprovalDocument(null)} aria-label="Remove approval document">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {approvalPreviewUrl && (
                      <div className="walkin-document-preview">
                        <div className="walkin-document-preview-header">
                          <ShieldCheck size={15} />
                          <strong>Document Preview</strong>
                        </div>
                        {approvalDocument?.type === 'application/pdf' ? (
                          <iframe title="Approval document preview" src={approvalPreviewUrl} />
                        ) : (
                          <img src={approvalPreviewUrl} alt="Approval document preview" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="walkin-card">
            <div className="walkin-card-header">
              <h4>{form.request_type === 'gate_pass' ? 'Gate Pass Item' : 'Items'}</h4>
              {form.request_type !== 'gate_pass' && (
                <button type="button" className="walkin-inline-btn" onClick={addLineItem}>
                  <Plus size={14} /> Add Item
                </button>
              )}
            </div>

            <div className="walkin-table-wrap">
              <table className="walkin-items-table expanded">
                <thead>
                  <tr>
                    <th>Item / Particular</th>
                    <th style={{ width: 82 }}>Qty</th>
                    <th style={{ width: 90 }}>Unit</th>
                    <th style={{ width: 120 }}>Unit Price</th>
                    <th style={{ width: 130 }}>Amount</th>
                    <th>Remarks</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <div className="walkin-search-cell">
                          <input
                            type="text"
                            value={line.item}
                            onChange={(e) => searchLineItems(index, e.target.value)}
                            placeholder={form.request_type === 'gate_pass' ? 'Selected asset' : 'Search item or type new item'}
                            disabled={form.request_type === 'gate_pass'}
                          />
                          {line.isSearching && <Loader2 size={14} className="spin" />}
                          {line.searchResults?.length > 0 && form.request_type !== 'gate_pass' && (
                            <div className="walkin-search-results">
                              {line.searchResults.map((result) => (
                                <button key={`${result.item_type}-${result.id || result.source_id}`} type="button" onClick={() => selectLineItem(index, result)}>
                                  <strong>{result.name}</strong>
                                  <span>{result.item_type} - {result.category || 'No category'} - {result.status} - {formatCurrency(result.unit_price || result.unit_cost)}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td><input type="number" min="1" value={line.qty} onChange={(e) => updateLineItem(index, 'qty', e.target.value)} /></td>
                      <td><input type="text" value={line.unit} onChange={(e) => updateLineItem(index, 'unit', e.target.value)} placeholder="pcs" /></td>
                      <td><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)} /></td>
                      <td><input type="text" value={formatCurrency(line.amount)} readOnly /></td>
                      <td><input type="text" value={line.remarks} onChange={(e) => updateLineItem(index, 'remarks', e.target.value)} /></td>
                      <td>
                        {lineItems.length > 1 && form.request_type !== 'gate_pass' && (
                          <button type="button" className="walkin-remove-btn" onClick={() => removeLineItem(index)}><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="walkin-total-panel">
              <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
              {form.request_type === 'purchase_order' && <div><span>VAT 12%</span><strong>{formatCurrency(vat)}</strong></div>}
              <div><span>Total</span><strong>{formatCurrency(grandTotal)}</strong></div>
            </div>

            <div className="walkin-field-group">
              <label htmlFor="walkin-notes">Staff Notes</label>
              <textarea id="walkin-notes" rows={2} value={form.walk_in_notes} onChange={(e) => updateField('walk_in_notes', e.target.value)} placeholder="ID verified, reason for walk-in, or release instructions" />
            </div>

            <button type="submit" className="walkin-submit-btn" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              {submitting ? 'Submitting...' : `Submit ${activeDocument?.label || 'Document'}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

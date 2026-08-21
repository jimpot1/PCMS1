import React, { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { pcmsApi } from '../services/api.js';

const PRIORITY_OPTIONS = ['low', 'normal', 'urgent', 'critical'];

const emptyLineItem = () => ({
  item: '',
  qty: 1,
  unit: '',
  unit_price: '0',
  amount: '0',
});

function normalizeLineItem(line) {
  const quantity = Number(line?.qty ?? line?.quantity ?? 1) || 1;
  const unitPriceRaw = Number(line?.unit_price ?? line?.unitPrice ?? line?.estimated_cost ?? 0) || 0;
  const unitPrice = line?.unit_price !== undefined || line?.unitPrice !== undefined ? unitPriceRaw : quantity ? (Number(line?.amount ?? line?.estimated_cost ?? 0) / quantity) : 0;
  const amount = Number(line?.amount ?? line?.estimated_cost ?? quantity * unitPrice) || 0;

  return {
    item: line?.item || line?.particular || line?.name || '',
    qty: quantity,
    unit: line?.unit || '',
    unit_price: String(unitPrice),
    amount: String(amount),
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
}

export default function RequestEditModal({ request, departments, onClose, onSaved }) {
  const initialLineItems = Array.isArray(request?.line_items) && request.line_items.length > 0
    ? request.line_items.map(normalizeLineItem)
    : [emptyLineItem()];

  const [form, setForm] = useState({
    department_id: request?.department_id || request?.department?.id || '',
    walk_in_requester_name: request?.walk_in_requester_name || request?.requested_by_name || '',
    walk_in_requester_contact: request?.walk_in_requester_contact || '',
    branch: request?.branch || '',
    priority: request?.priority || 'normal',
    date_needed: request?.date_needed || '',
    unit: request?.unit || '',
    purpose: request?.purpose || '',
    walk_in_notes: request?.walk_in_notes || '',
  });

  const [lineItems, setLineItems] = useState(initialLineItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, line) => {
      const qty = Number(line.qty || 0);
      const unitPrice = Number(line.unit_price || 0);
      const amount = qty * unitPrice;
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0),
    [lineItems],
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateLineItem = (index, field, value) => {
    setLineItems((current) => current.map((line, lineIndex) => {
      if (lineIndex !== index) return line;

      const next = { ...line, [field]: value };
      if (field === 'qty' || field === 'unit_price') {
        const qty = Number(next.qty || 0);
        const unitPrice = Number(next.unit_price || 0);
        next.amount = String(Number.isFinite(qty * unitPrice) ? qty * unitPrice : 0);
      }

      return next;
    }));
  };

  const addLineItem = () => {
    setLineItems((current) => [...current, emptyLineItem()]);
  };

  const removeLineItem = (index) => {
    setLineItems((current) => current.length > 1 ? current.filter((_, lineIndex) => lineIndex !== index) : current);
  };

  const saveEdit = async () => {
    setError(null);
    setSaving(true);

    try {
      const cleanLineItems = lineItems
        .filter((line) => (line.item || '').trim())
        .map((line) => {
          const quantity = Number(line.qty || 1);
          const unitPrice = Number(line.unit_price || 0);
          const amount = Number(line.amount || quantity * unitPrice);

          return {
            item: line.item,
            particular: line.item,
            description: line.item,
            quantity,
            qty: quantity,
            unit: line.unit || null,
            unit_price: unitPrice,
            unitPrice: unitPrice,
            amount,
            estimated_cost: amount,
          };
        });

      if (cleanLineItems.length === 0) {
        setError('Add at least one item to this request.');
        return;
      }

      const payload = {
        department_id: form.department_id || null,
        walk_in_requester_name: form.walk_in_requester_name || null,
        walk_in_requester_contact: form.walk_in_requester_contact || null,
        branch: form.branch || null,
        priority: form.priority || null,
        date_needed: form.date_needed || null,
        unit: form.unit || null,
        purpose: form.purpose || null,
        walk_in_notes: form.walk_in_notes || null,
        total_amount: subtotal,
        line_items: cleanLineItems,
      };

      if (request.is_walk_in) {
        await pcmsApi.updateWalkInDetails(request.id, payload);
      } else {
        await pcmsApi.updatePurchaseRequest(request.id, payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save request changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => (saving ? null : onClose())}>
      <div className="request-edit-modal" onClick={(event) => event.stopPropagation()}>
        <div className="request-edit-header">
          <div>
            <div className="request-edit-eyebrow">Approved Release Queue</div>
            <h3>Edit Request — {request.request_number}</h3>
          </div>
          <button className="request-edit-close" type="button" onClick={onClose} aria-label="Close edit modal" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        <div className="request-edit-body">
          <div className="request-form-section">
            <h4>Request Form Details</h4>

            <div className="request-form-grid">
              <div className="request-field-group">
                <label htmlFor="req-edit-name">Requester Name</label>
                <input
                  id="req-edit-name"
                  type="text"
                  value={form.walk_in_requester_name}
                  disabled={saving}
                  onChange={(event) => updateField('walk_in_requester_name', event.target.value)}
                />
              </div>

              <div className="request-field-group">
                <label htmlFor="req-edit-contact">Requester Contact</label>
                <input
                  id="req-edit-contact"
                  type="text"
                  value={form.walk_in_requester_contact}
                  disabled={saving}
                  onChange={(event) => updateField('walk_in_requester_contact', event.target.value)}
                />
              </div>

              <div className="request-field-group">
                <label htmlFor="req-edit-department">Department</label>
                <select
                  id="req-edit-department"
                  value={form.department_id}
                  disabled={saving}
                  onChange={(event) => updateField('department_id', event.target.value)}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>

              <div className="request-field-group">
                <label htmlFor="req-edit-branch">Branch / Location</label>
                <input
                  id="req-edit-branch"
                  type="text"
                  value={form.branch}
                  disabled={saving}
                  onChange={(event) => updateField('branch', event.target.value)}
                />
              </div>

              <div className="request-field-group">
                <label htmlFor="req-edit-priority">Priority</label>
                <select
                  id="req-edit-priority"
                  value={form.priority}
                  disabled={saving}
                  onChange={(event) => updateField('priority', event.target.value)}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="request-field-group">
                <label htmlFor="req-edit-date-needed">Date Needed</label>
                <input
                  id="req-edit-date-needed"
                  type="date"
                  value={form.date_needed}
                  disabled={saving}
                  onChange={(event) => updateField('date_needed', event.target.value)}
                />
              </div>

              <div className="request-field-group request-field-full">
                <label htmlFor="req-edit-unit">Unit</label>
                <input
                  id="req-edit-unit"
                  type="text"
                  value={form.unit}
                  disabled={saving}
                  onChange={(event) => updateField('unit', event.target.value)}
                />
              </div>

              <div className="request-field-group request-field-full">
                <label htmlFor="req-edit-purpose">Purpose</label>
                <textarea
                  id="req-edit-purpose"
                  rows={3}
                  value={form.purpose}
                  disabled={saving}
                  onChange={(event) => updateField('purpose', event.target.value)}
                />
              </div>

            </div>
          </div>

          <div className="request-form-section">
            <div className="request-section-header">
              <h4>Items</h4>
              <button type="button" className="request-inline-btn" onClick={addLineItem} disabled={saving}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="request-items-table-wrap">
              <table className="request-items-table">
                <thead>
                  <tr>
                    <th>Item / Particular</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((line, index) => (
                    <tr key={`${line.item || 'item'}-${index}`}>
                      <td>
                        <input
                          type="text"
                          value={line.item}
                          disabled={saving}
                          onChange={(event) => updateLineItem(index, 'item', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          disabled={saving}
                          onChange={(event) => updateLineItem(index, 'qty', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={line.unit}
                          disabled={saving}
                          onChange={(event) => updateLineItem(index, 'unit', event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price}
                          disabled={saving}
                          onChange={(event) => updateLineItem(index, 'unit_price', event.target.value)}
                        />
                      </td>
                      <td>
                        <input type="text" value={formatCurrency(line.amount)} readOnly />
                      </td>
                      <td>
                        {lineItems.length > 1 && (
                          <button type="button" className="request-item-remove" onClick={() => removeLineItem(index)} disabled={saving}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="request-total-box">
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </div>
          </div>

          <div className="request-form-section">
            <h4>Staff Notes</h4>
            <textarea
              rows={3}
              value={form.walk_in_notes}
              disabled={saving}
              onChange={(event) => updateField('walk_in_notes', event.target.value)}
              placeholder="ID verified, reason for walk-in, or release instructions"
            />
          </div>

          {error && <div className="form-message error">{error}</div>}
        </div>

        <div className="request-edit-footer">
          <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="primary-button" onClick={saveEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

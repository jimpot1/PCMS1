import React, { useEffect, useState } from 'react';
import { Eye, Filter, Pencil, Printer, RefreshCw, Search, Trash2 } from 'lucide-react';
import { pcmsApi } from '../services/api.js';
import PurchaseRequestDetails from './PurchaseRequestDetails.jsx';
import { WORKFLOW_STAGES } from './PurchaseWorkflowTimeline.jsx';
import RequestEditModal from './RequestEditModal.jsx';

const statuses = [
  ['all', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected'],
  ['revision_requested', 'Revision Requested'], ['released', 'Released'],
];
const displayName = (item) => item?.requester?.full_name || item?.requester?.name || item?.requester?.email || item?.requested_by_name || item?.walk_in_requester_name || '-';
const stageLabel = (stage) => WORKFLOW_STAGES.find((item) => item.key === stage)?.label || stage || '-';
const canModify = (item) => !['released', 'cancelled'].includes(item?.status);

function escapeHtml(value) {
  return String(value ?? '-').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function printPurchaseRequest(request) {
  const printWindow = window.open('', '_blank', 'width=960,height=800');
  if (!printWindow) return;
  const items = Array.isArray(request.line_items) ? request.line_items : [];
  const history = Array.isArray(request.timeline) ? request.timeline : [];
  const rows = items.map((item, index) => `<tr><td>${escapeHtml(item.item || item.particular || item.name || item.description || `Item ${index + 1}`)}</td><td>${escapeHtml(item.qty || item.quantity || 1)}</td><td>PHP ${Number(item.unit_price ?? item.unitPrice ?? 0).toLocaleString()}</td><td>PHP ${Number(item.amount ?? item.estimated_cost ?? 0).toLocaleString()}</td></tr>`).join('');
  const historyRows = history.map((entry) => `<tr><td>${escapeHtml(entry.stage)}</td><td>${escapeHtml(entry.status)}</td><td>${escapeHtml(entry.performed_by_name || entry.approver || entry.processor || '-')}</td><td>${entry.timestamp ? escapeHtml(new Date(entry.timestamp).toLocaleString()) : '-'}</td><td>${escapeHtml(entry.notes || '')}</td></tr>`).join('');
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(request.request_number)} - PCMS</title><style>body{font:13px Arial,sans-serif;color:#172033;margin:36px}h1{font-size:22px;margin:0}h2{font-size:14px;border-bottom:2px solid #d8dee9;padding-bottom:7px;margin-top:26px}header{display:flex;justify-content:space-between;border-bottom:3px solid #172033;padding-bottom:16px}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.meta b{display:block;color:#64748b;font-size:11px;text-transform:uppercase;margin-bottom:4px}p{margin:5px 0}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8dee9;text-align:left;padding:8px}th{background:#f1f5f9;font-size:11px;text-transform:uppercase}.amount{text-align:right;font-size:16px;font-weight:bold}@media print{body{margin:18px}button{display:none}}</style></head><body><header><div><h1>PCMS</h1><p>Purchase Request Workflow Record</p></div><div><strong>${escapeHtml(request.request_number)}</strong><p>Printed ${new Date().toLocaleString()}</p></div></header><section class="meta"><div><b>Requester</b>${escapeHtml(displayName(request))}</div><div><b>Department</b>${escapeHtml(request.department?.name || request.department_name)}</div><div><b>Request Type</b>${escapeHtml(request.request_type)}</div><div><b>Priority</b>${escapeHtml(request.priority)}</div><div><b>Date Needed</b>${escapeHtml(request.date_needed ? new Date(request.date_needed).toLocaleDateString() : '-')}</div><div><b>Status / Stage</b>${escapeHtml(`${request.status || '-'} / ${stageLabel(request.current_stage)}`)}</div></section><h2>Purpose</h2><p>${escapeHtml(request.purpose || 'No purpose recorded.')}</p><h2>Request Items</h2><table><thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No items recorded.</td></tr>'}</tbody></table><p class="amount">Total Amount: PHP ${Number(request.total_amount || 0).toLocaleString()}</p><h2>Approval / Workflow History</h2><table><thead><tr><th>Stage</th><th>Status</th><th>Actor</th><th>Date / Time</th><th>Comment</th></tr></thead><tbody>${historyRows || '<tr><td colspan="5">No workflow history recorded.</td></tr>'}</tbody></table>${request.status === 'released' ? `<h2>Release Information</h2><div class="meta"><div><b>Released By</b>${escapeHtml(request.released_by || '-')}</div><div><b>Released At</b>${escapeHtml(request.released_at ? new Date(request.released_at).toLocaleString() : '-')}</div><div><b>Receipt Number</b>${escapeHtml(request.receipt_number || '-')}</div></div>` : ''}<script>window.onload=()=>window.print();</script></body></html>`);
  printWindow.document.close();
}

export default function PurchaseWorkflowMonitor({ currentUser }) {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', department_id: '', request_type: '', current_stage: '', date_from: '', date_to: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const canDelete = currentUser?.role === 'System Administrator';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = { ...filters };
      if (query.status === 'all') delete query.status;
      const data = await pcmsApi.fetchPurchaseRequests(query);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load purchase workflow monitor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { pcmsApi.departments().then(setDepartments).catch(() => {}); }, []);
  useEffect(() => { load(); }, [filters.status, filters.department_id, filters.request_type, filters.current_stage, filters.date_from, filters.date_to]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const submitSearch = (event) => { event.preventDefault(); load(); };
  const resetFilters = () => setFilters({ status: 'all', department_id: '', request_type: '', current_stage: '', date_from: '', date_to: '', search: '' });
  const refreshAfterAction = async (message) => { setNotice(message); setSelected(null); setEditTarget(null); await load(); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await pcmsApi.deletePurchaseRequest(deleteTarget.id);
      setDeleteTarget(null);
      await refreshAfterAction(`Purchase request ${deleteTarget.request_number} was cancelled.`);
    } catch (err) {
      setError(err.message || 'Unable to delete purchase request.');
    } finally {
      setActionLoading(false);
    }
  };

  const actionButtons = (item) => <div className="workflow-row-actions">
    <button className="workflow-icon-button" type="button" title="View Details" aria-label={`View details for ${item.request_number}`} onClick={() => setSelected(item)}><Eye size={16} /></button>
    <button className="workflow-icon-button" type="button" title="Print Request" aria-label={`Print ${item.request_number}`} onClick={() => printPurchaseRequest(item)}><Printer size={16} /></button>
    {canModify(item) && <button className="workflow-icon-button" type="button" title="Edit Request" aria-label={`Edit ${item.request_number}`} onClick={() => setEditTarget(item)}><Pencil size={16} /></button>}
    {canDelete && canModify(item) && <button className="workflow-icon-button destructive" type="button" title="Delete Request" aria-label={`Delete ${item.request_number}`} onClick={() => setDeleteTarget(item)}><Trash2 size={16} /></button>}
  </div>;

  return (
    <div className="page-container purchase-workflow-page">
      <section className="page-header workflow-page-header"><div><p className="eyebrow">PURCHASE REQUESTS</p><h1>Purchase Workflow Monitor</h1><p>Monitor the shared request workflow and inspect every approval and release record.</p></div><button className="secondary-button" type="button" onClick={load}><RefreshCw size={15} /> Refresh data</button></section>
      {error && <div className="form-message error">{error}</div>}
      {notice && <div className="form-message success">{notice}</div>}
      <div className="panel workflow-filters">
        <div className="filter-tabs" role="tablist" aria-label="Filter by request status">{statuses.map(([value, label]) => <button type="button" role="tab" aria-selected={filters.status === value} key={value} className={filters.status === value ? 'active' : ''} onClick={() => updateFilter('status', value)}>{label}</button>)}</div>
        <form className="workflow-filter-grid" onSubmit={submitSearch}>
          <label>Department<select value={filters.department_id} onChange={(event) => updateFilter('department_id', event.target.value)}><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
          <label>Request Type<select value={filters.request_type} onChange={(event) => updateFilter('request_type', event.target.value)}><option value="">All types</option><option value="purchase_order">Purchase Order</option><option value="request">Request Form</option></select></label>
          <label>Current Stage<select value={filters.current_stage} onChange={(event) => updateFilter('current_stage', event.target.value)}><option value="">All stages</option>{WORKFLOW_STAGES.map((stage) => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label>
          <label>From<input type="date" value={filters.date_from} onChange={(event) => updateFilter('date_from', event.target.value)} /></label>
          <label>To<input type="date" value={filters.date_to} onChange={(event) => updateFilter('date_to', event.target.value)} /></label>
          <label className="workflow-search">Search<div className="search-input"><Search size={15} /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Request number or requester" /></div></label>
          <button className="secondary-button" type="submit"><Search size={15} /> Apply filters</button>
          <button className="secondary-button" type="button" onClick={resetFilters}><Filter size={15} /> Clear</button>
        </form>
      </div>
      <div className="panel workflow-table-panel">
        {loading ? <div className="loading-state">Loading workflow records...</div> : items.length === 0 ? <div className="workflow-empty-state"><div className="workflow-empty-icon"><Search size={20} /></div><h3>No requests found</h3><p>Try changing the filters or search term.</p><button className="secondary-button" type="button" onClick={resetFilters}>Reset filters</button></div> : <div className="table-responsive workflow-table-scroll"><table className="data-table workflow-table"><thead><tr><th>Request Number</th><th>Requester</th><th>Department</th><th>Type</th><th className="numeric">Total Amount</th><th>Current Stage</th><th>Status</th><th>Date Submitted</th><th>Current Approver</th><th className="actions-heading">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className="font-mono">{item.request_number || `PR-${item.id}`}</td><td className="truncate-cell" title={displayName(item)}>{displayName(item)}</td><td className="truncate-cell" title={item.department?.name || item.department_name || '-'}>{item.department?.name || item.department_name || '-'}</td><td>{item.request_type || '-'}</td><td className="numeric">PHP {Number(item.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td><td><span className="stage-badge">{stageLabel(item.current_stage)}</span></td><td><span className={`status-badge status-${item.status || 'pending'}`}>{item.status || '-'}</span></td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td><td className="truncate-cell" title={item.workflow?.next_approver?.name || item.workflow?.next_approver_role || '-'}>{item.workflow?.next_approver?.name || item.workflow?.next_approver_role || '-'}</td><td className="actions-cell">{actionButtons(item)}</td></tr>)}</tbody></table></div>}
      </div>
      {selected && <PurchaseRequestDetails request={selected} onClose={() => setSelected(null)} onPrint={() => printPurchaseRequest(selected)} onEdit={canModify(selected) ? () => { setEditTarget(selected); setSelected(null); } : null} onDelete={canDelete && canModify(selected) ? () => { setDeleteTarget(selected); setSelected(null); } : null} />}
      {editTarget && <RequestEditModal request={editTarget} departments={departments} onClose={() => setEditTarget(null)} onSaved={() => refreshAfterAction('Purchase request updated.')} />}
      {deleteTarget && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-request-title"><div className="confirm-dialog workflow-confirm-dialog"><div className="confirm-dialog-icon"><Trash2 size={20} /></div><h3 id="delete-request-title">Delete Purchase Request?</h3><p>Are you sure you want to delete request <strong>{deleteTarget.request_number}</strong>? This action cannot be undone.</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Cancel</button><button className="danger-button" type="button" onClick={confirmDelete} disabled={actionLoading}><Trash2 size={15} /> {actionLoading ? 'Deleting...' : 'Delete Request'}</button></div></div></div>}
</div>
  );
}

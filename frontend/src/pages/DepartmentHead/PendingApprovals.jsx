import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Eye, Loader2, RotateCcw, X } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function PendingApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pcmsApi.departmentHeadApprovalQueue();
      setItems(data?.purchaseRequests || []);
    } catch (err) {
      console.error('Error loading approval queue:', err);
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleApprove = async (item) => {
    try {
      setActionInProgress(item.id);
      await pcmsApi.departmentHeadApprove('purchase', item.id);
      // refresh queue and notify dashboard
      await loadQueue();
      window.dispatchEvent(new CustomEvent('departmentHeadDataChanged'));
      setSelectedItem(null);
    } catch (err) {
      setError(`Failed to approve: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (item) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionInProgress(item.id);
      await pcmsApi.departmentHeadReject('purchase', item.id, reason);
      await loadQueue();
      window.dispatchEvent(new CustomEvent('departmentHeadDataChanged'));
      setSelectedItem(null);
    } catch (err) {
      setError(`Failed to reject: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevision = async (item) => {
    const reason = prompt('Please provide the revision reason:');
    if (!reason?.trim()) return;

    try {
      setActionInProgress(item.id);
      await pcmsApi.requestPurchaseRevision(item.id, reason.trim());
      await loadQueue();
      window.dispatchEvent(new CustomEvent('departmentHeadDataChanged'));
      setSelectedItem(null);
    } catch (err) {
      setError(`Failed to request revision: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Pending Approval Queue</h3>
          <p>Review the latest requests awaiting your decision.</p>
        </div>
      </div>

      {error && (
        <div className="form-message error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <div className="department-empty-state">
          <CheckCircle2 size={40} />
          <p>No approval requests waiting.</p>
          <p className="text-muted">All pending requests for your department have been processed.</p>
        </div>
      ) : (
        <div className="department-panel-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request Number</th>
                  <th>Requester</th>
                  <th>Department</th>
                  <th>Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="table-loading-row">
                      <Loader2 size={20} className="spin" />
                      <span>Loading pending approvals...</span>
                    </td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.request_number}</strong></td>
                    <td>{item.requester?.email || item.requested_by || '-'}</td>
                    <td>{item.department?.name || '-'}</td>
                    <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.total_amount || 0))}</td>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                    <td><span className={`badge ${item.current_stage === 'department_head' ? 'badge-pending' : ''}`}>{item.current_stage || item.status || 'pending'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          className="workflow-icon-button"
                          type="button"
                          title="Approve request"
                          aria-label={`Approve ${item.request_number}`}
                          onClick={() => handleApprove(item)}
                          disabled={actionInProgress === item.id}
                        >
                          {actionInProgress === item.id ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                        </button>
                        <button
                          className="workflow-icon-button destructive"
                          type="button"
                          title="Reject request"
                          aria-label={`Reject ${item.request_number}`}
                          onClick={() => handleReject(item)}
                          disabled={actionInProgress === item.id}
                        >
                          <X size={16} />
                        </button>
                        <button
                          className="workflow-icon-button"
                          type="button"
                          title="Request revision"
                          aria-label={`Request revision for ${item.request_number}`}
                          onClick={() => handleRevision(item)}
                          disabled={actionInProgress === item.id}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button
                          className="workflow-icon-button"
                          type="button"
                          title="View request details"
                          aria-label={`View details for ${item.request_number}`}
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: 780, width: '90%' }}>
            <div className="modal-header">
              <h3>Request Details</h3>
              <button className="icon-button" onClick={() => setSelectedItem(null)} aria-label="Close">×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="detail-grid">
                <div>
                  <label>Request Number</label>
                  <p className="font-mono">{selectedItem.request_number}</p>
                </div>
                <div>
                  <label>Status</label>
                  <p className="badge">{selectedItem.status}</p>
                </div>
                <div>
                  <label>Current Stage</label>
                  <p>{selectedItem.current_stage}</p>
                </div>
                <div>
                  <label>Amount</label>
                  <p>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(selectedItem.total_amount || 0))}</p>
                </div>
                <div>
                  <label>Requester</label>
                  <p>{selectedItem.requester?.email || selectedItem.requested_by || '-'}</p>
                </div>
                <div>
                  <label>Department</label>
                  <p>{selectedItem.department?.name || selectedItem.department || '-'}</p>
                </div>
              </div>

              {selectedItem.purpose && (
                <div className="detail-section">
                  <label>Purpose</label>
                  <p>{selectedItem.purpose}</p>
                </div>
              )}

              {selectedItem.line_items && (
                <div className="detail-section">
                  <label>Requested Items</label>
                  {Array.isArray(selectedItem.line_items) && selectedItem.line_items.length > 0 ? (
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.line_items.map((li, idx) => (
                          <tr key={idx}>
                            <td>{li.item || li.particular || `Item ${idx + 1}`}</td>
                            <td>{li.qty ?? li.quantity ?? '-'}</td>
                            <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(li.unit_price ?? li.unitPrice ?? li.unit_cost ?? 0))}</td>
                            <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(li.amount ?? li.estimated_cost ?? 0))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">No items listed</p>
                  )}
                </div>
              )}

              <div className="detail-section">
                <label>Workflow</label>
                <ul className="item-list">
                  {selectedItem.timeline ? (
                    selectedItem.timeline.map((t, i) => <li key={i}>{t.stage} — {t.status}</li>)
                  ) : (
                    <li>Workflow details not available.</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="primary-button" onClick={() => { handleApprove(selectedItem); setSelectedItem(null); }}>
                  Approve
                </button>
                <button className="danger-button" onClick={() => { handleReject(selectedItem); setSelectedItem(null); }}>
                  Reject
                </button>
              </div>
              <button className="secondary-button" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

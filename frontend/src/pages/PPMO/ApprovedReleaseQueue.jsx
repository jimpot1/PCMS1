import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, FileText, Loader2, Package, PackageCheck, Pencil, XCircle } from 'lucide-react';
import { assetQrCodeUrl, pcmsApi } from '../../services/api.js';
import RequestEditModal from '../../components/RequestEditModal.jsx';
import { TableSkeleton } from '../../components/TableSkeleton.jsx';

export default function ApprovedReleaseQueue() {
  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [notes, setNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pcmsApi.ppmoReleaseQueue();
      setItems(data?.purchaseRequests || []);
    } catch (err) {
      console.error('Error loading release queue:', err);
      setError('Failed to load approved release queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    pcmsApi.departments().then(setDepartments).catch(() => {});
  }, []);

  const openEdit = (item) => {
    setEditTarget(item);
  };

  const verifyApproval = async (item, decision) => {
    setError(null);
    setMessage(null);
    setProcessingId(item.id);
    try {
      const response = await pcmsApi.verifyWalkInApproval(item.id, {
        decision,
        verification_notes: notes[item.id] || undefined,
      });
      setMessage(response?.message || 'Walk-in approval verification updated.');
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Unable to update walk-in approval verification.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditSaved = async () => {
    setMessage('Request details updated.');
    setEditTarget(null);
    await loadQueue();
  };

  const releaseItem = async (item) => {
    setError(null);
    setMessage(null);
    setReceiptUrl(null);
    setProcessingId(item.id);
    try {
      const response = await pcmsApi.ppmoRelease('purchase', item.id);
      const released = response?.data;
      setMessage(response?.workflow?.message || 'Item released successfully.');
      if (released?.id) {
        const refreshedReceipt = await pcmsApi.fetchReleaseReceipt(released.id);
        const receipt = refreshedReceipt || released;
        if (receipt?.receipt_document_path) setReceiptUrl(pcmsApi.receiptDocumentUrl(released.id));
      }
      await loadQueue();
    } catch (err) {
      setError(err.message || 'Unable to release this item.');
    } finally {
      setProcessingId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="page-container ppmo-release-queue-page">
      <section className="page-header">
        <h1>Approved Release Queue</h1>
        <p>Requests ready for inventory verification and release</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="form-message success">
          {message}
          {receiptUrl && (
            <>
              {' '}
              <a href={receiptUrl} target="_blank" rel="noreferrer">View release receipt</a>
            </>
          )}
        </div>
      )}

      <div className="panel">
        <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request Number</th>
                  <th>Department</th>
                  <th>Requester</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Approval Form</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <TableSkeleton columns={8} /> : items.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state">No approved requests ready for release</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.request_number}</td>
                    <td>{item.department?.name || item.department || '-'}</td>
                    <td>{item.requester?.email || item.requested_by_name || item.walk_in_requester_name || '-'}</td>
                    <td className="text-right">PHP {Number(item.total_amount || 0).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-pending">{item.approval_status === 'pending_verification' ? 'Needs form verification' : item.current_stage || 'Pending'}</span>
                    </td>
                    <td>
                      {item.approval_document_path ? (
                        <a className="link-button" href={assetQrCodeUrl(item.approval_document_path)} target="_blank" rel="noreferrer">
                          <FileText size={14} /> Open
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="text-muted">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="release-action-stack">
                        <button className="staff-action-button" title="View Request" aria-label={`View request ${item.request_number}`} onClick={() => setViewTarget(item)}>
                          <Eye size={16} />
                        </button>
                        {item.is_walk_in && (
                          <button className="staff-action-button" title="Edit Request" aria-label={`Edit request ${item.request_number}`} onClick={() => openEdit(item)}>
                            <Pencil size={16} />
                          </button>
                        )}
                        {item.approval_status === 'pending_verification' || item.approval_status === 'needs_verification' ? (
                          <div className="release-verification-actions">
                            {!item.approval_document_path && (
                              <p className="text-muted verification-hint">
                                Click <strong>Edit</strong> to upload the approved request form before this can be verified.
                              </p>
                            )}
                            <input
                              value={notes[item.id] || ''}
                              onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                              placeholder="Verification notes"
                              disabled={!item.approval_document_path}
                            />
                            <div>
                              <button
                                className="staff-action-button success"
                                disabled={processingId === item.id || !item.approval_document_path}
                                aria-label="Verify approval document"
                                title={!item.approval_document_path ? 'Upload the approved request form first' : 'Verify approval document'}
                                onClick={() => verifyApproval(item, 'verified')}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                className="staff-action-button danger"
                                disabled={processingId === item.id}
                                aria-label="Reject approval document"
                                title="Reject approval document"
                                onClick={() => verifyApproval(item, 'rejected')}
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="staff-action-button primary" disabled={processingId === item.id} title="Process Release" aria-label={`Process release for ${item.request_number}`} onClick={() => setConfirmTarget(item)}>
                            <PackageCheck size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {confirmTarget && (
        <div className="modal-overlay" onClick={() => (processingId ? null : setConfirmTarget(null))}>
          <div className="panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-like-container">
              <div className="modal-header">
                <h3>Confirm Release</h3>
                <button className="close-button" disabled={processingId === confirmTarget.id} onClick={() => setConfirmTarget(null)}>×</button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to release <strong>{confirmTarget.request_number}</strong> to{' '}
                  <strong>{confirmTarget.requester?.email || confirmTarget.requested_by_name || confirmTarget.walk_in_requester_name || 'the requester'}</strong>?
                </p>
                <p className="text-muted">This will mark the request as released, update inventory, and generate a release receipt. This action cannot be undone.</p>

                <div className="modal-footer">
                  <button className="secondary-button" disabled={processingId === confirmTarget.id} onClick={() => setConfirmTarget(null)}>
                    No, cancel
                  </button>
                  <button className="primary-button" disabled={processingId === confirmTarget.id} onClick={() => releaseItem(confirmTarget)}>
                    <PackageCheck size={16} />
                    {processingId === confirmTarget.id ? 'Releasing…' : 'Yes, release it'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {viewTarget && (
        <div className="modal-overlay" onClick={() => setViewTarget(null)}>
          <div className="panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-like-container">
              <div className="modal-header">
                <h3>Order Details — {viewTarget.request_number}</h3>
                <button className="close-button" onClick={() => setViewTarget(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div>
                    <label>Department</label>
                    <p>{viewTarget.department?.name || viewTarget.department_name || '-'}</p>
                  </div>
                  <div>
                    <label>Requester</label>
                    <p>{viewTarget.requester?.email || viewTarget.requested_by_name || viewTarget.requested_by || '-'}</p>
                  </div>
                  <div>
                    <label>Status</label>
                    <p className="badge">{viewTarget.current_stage || viewTarget.status || '-'}</p>
                  </div>
                  <div>
                    <label>Total Amount</label>
                    <p>PHP {Number(viewTarget.total_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label>Date Needed</label>
                    <p>{viewTarget.date_needed ? new Date(viewTarget.date_needed).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <label>Priority</label>
                    <p>{viewTarget.priority || '-'}</p>
                  </div>
                </div>

                {viewTarget.purpose && (
                  <div className="detail-section">
                    <h4>Purpose</h4>
                    <p>{viewTarget.purpose}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Line Items</h4>
                  {Array.isArray(viewTarget.line_items) && viewTarget.line_items.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTarget.line_items.map((line, idx) => (
                          <tr key={idx}>
                            <td>{line.name || line.item || line.particular || line.description || `Item ${idx + 1}`}</td>
                            <td>{line.qty || line.quantity || 1}</td>
                            <td className="text-right">PHP {Number(line.amount ?? line.estimated_cost ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">No line items recorded.</p>
                  )}
                </div>

                {viewTarget.approval_document_path && (
                  <div className="detail-section">
                    <h4>Approval Form</h4>
                    <a className="link-button" href={assetQrCodeUrl(viewTarget.approval_document_path)} target="_blank" rel="noreferrer">
                      <FileText size={14} /> Open Approval Document
                    </a>
                  </div>
                )}

                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setViewTarget(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {editTarget && (
        <RequestEditModal
          request={editTarget}
          departments={departments}
          onClose={() => setEditTarget(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
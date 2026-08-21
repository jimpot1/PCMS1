import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, MessageSquare, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import ApprovalHistory from '../../components/ApprovalHistory.jsx';
import RecommendingApproverDecisionPanel from '../../components/RecommendingApproverDecisionPanel.jsx';
import { pcmsApi } from '../../services/api.js';

export default function ReviewRequest({ requestId: propRequestId, onSuccess, onClose }) {
  const { requestId: routeRequestId } = useParams();
  const requestId = propRequestId || routeRequestId;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pcmsApi.fetchPurchaseRequest(requestId);
      setRequest(data);
    } catch (err) {
      setError(err.message || 'Unable to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    let active = true;

    async function load() {
      if (!active) return;
      await loadRequest();
    }

    load();
    return () => { active = false; };
  }, [requestId]);
  const [showApproveConfirm, setShowApproveConfirm] = React.useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(null);

  const handleApprove = (comments) => {
    if (!request?.id) return;
    setPendingAction({ type: 'approve', comments });
    setShowApproveConfirm(true);
  };

  const performApprove = async () => {
    if (!request?.id) return;
    try {
      setActionLoading(true);
      setError(null);
      await pcmsApi.advancePurchaseRequest(request.id);
      setSuccess('Request recommended and forwarded to the next approval stage.');
      window.dispatchEvent(new CustomEvent('recommendingApproverDataChanged'));
      await loadRequest();
      setShowApproveConfirm(false);
      setPendingAction(null);
      if (typeof onSuccess === 'function') onSuccess({ action: 'approve', requestId: request.id });
    } catch (err) {
      setError(err.message || 'Unable to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (reason) => {
    if (!request?.id) return;
    if (!reason || !reason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    setPendingAction({ type: 'reject', reason });
    setShowRejectConfirm(true);
  };

  const performReject = async () => {
    if (!request?.id || !pendingAction) return;
    try {
      setActionLoading(true);
      setError(null);
      await pcmsApi.rejectPurchaseRequest(request.id, { reason: pendingAction.reason });
      setSuccess('Request rejected and the requester has been notified.');
      window.dispatchEvent(new CustomEvent('recommendingApproverDataChanged'));
      await loadRequest();
      setShowRejectConfirm(false);
      setPendingAction(null);
      if (typeof onSuccess === 'function') onSuccess({ action: 'reject', requestId: request.id });
    } catch (err) {
      setError(err.message || 'Unable to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (reason) => {
    if (!reason?.trim()) {
      setError('Please provide a revision reason.');
      return;
    }
    try {
      setActionLoading(true);
      await pcmsApi.requestPurchaseRevision(request.id, reason.trim());
      setSuccess('Revision requested and the requester has been notified.');
      window.dispatchEvent(new CustomEvent('recommendingApproverDataChanged'));
      if (typeof onSuccess === 'function') onSuccess({ action: 'revision', requestId: request.id });
    } catch (err) {
      setError(err.message || 'Unable to request revision.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!requestId) {
    return <div className="recommending-empty-state">Select a request to review.</div>;
  }

  if (loading) {
    return <div className="loading-card">Loading request details…</div>;
  }

  if (error && !request) {
    const isAuth = String(error).toLowerCase().includes('unauthorized') || String(error).toLowerCase().includes('auth');
    return (
      <div className="request-error-state">
        <div className="form-message error">{isAuth ? 'Session expired or you are not authorized. Please sign in again.' : (error || 'Unable to load request details.')}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="secondary-button" onClick={loadRequest}>Try Again</button>
          <button type="button" className="secondary-button" onClick={() => { if (typeof onClose === 'function') onClose(); }}>{isAuth ? 'Close' : 'Close'}</button>
        </div>
      </div>
    );
  }

  const summary = [
    { label: 'Request Number', value: request.request_number },
    { label: 'Requester', value: request.requester?.email || request.requester?.name || 'Requester' },
    { label: 'Department', value: request.department?.name || request.department_name || 'Department' },
    { label: 'Branch / Location', value: request.branch || request.unit || 'N/A' },
    { label: 'Date Submitted', value: request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A' },
    { label: 'Priority', value: request.priority || 'normal' },
    { label: 'Purpose', value: request.purpose || 'N/A' },
    { label: 'Current Status', value: request.status || 'pending' }
  ];

  return (
    <div className="recommending-review-request">
      <section className="recommending-panel-card">
        <div className="recommending-panel-header">
          <div>
            <h3>Request Summary</h3>
            <p>Complete request and validation information for review.</p>
          </div>
        </div>
        <div className="recommending-summary-grid">
          {summary.map((item) => (
            <div key={item.label} className="recommending-summary-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="recommending-panel-card">
        <div className="recommending-panel-header">
          <div>
            <h3>Requested Items</h3>
            <p>Items, availability, quantity, and cost details.</p>
          </div>
        </div>
        <div className="recommending-items-table-wrap">
          <table className="recommending-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Availability</th>
                <th>Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {(request.line_items || []).map((item, index) => (
                <tr key={index}>
                  <td>{item.item || item.particular || item.source_ref || 'Item'}</td>
                  <td>{item.category || item.source_type || 'N/A'}</td>
                  <td>{item.qty || item.quantity || '–'}</td>
                  <td>{item.unit || 'pcs'}</td>
                  <td>{item.description || item.remarks || '–'}</td>
                  <td>{item.available_quantity ? `${item.available_quantity} available` : 'Unknown'}</td>
                  <td>{item.estimated_cost ? `PHP ${Number(item.estimated_cost).toLocaleString()}` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {success && <div className="form-message success">{success}</div>}
      {error && <div className="form-message error">{error}</div>}

      <div className="recommending-review-bottom-grid">
        <div className="recommending-panel-card">
          <ApprovalHistory history={request.timeline || []} />
        </div>
      </div>

      {request.current_stage === 'recommending_approver' && request.status === 'pending' && (
        <RecommendingApproverDecisionPanel
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
          disabled={actionLoading}
        />
      )}

      {(request.current_stage !== 'recommending_approver' || request.status !== 'pending') && (
        <div className="recommending-empty-state">
          This request is not currently pending recommending approval.
        </div>
      )}

      {showApproveConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Recommendation</h3>
              <button className="icon-button" type="button" onClick={() => setShowApproveConfirm(false)} aria-label="Close">×</button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to recommend this request for the next approval stage?</p>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => { setShowApproveConfirm(false); setPendingAction(null); }}>Cancel</button>
                <button type="button" className="primary-button" onClick={performApprove} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Confirm'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Rejection</h3>
              <button className="icon-button" type="button" onClick={() => setShowRejectConfirm(false)} aria-label="Close">×</button>
            </div>
            <div className="confirm-dialog-body">
              <p>Rejecting will return the request to the requester. This action cannot be undone.</p>
              <p><strong>Reason:</strong> {pendingAction?.reason}</p>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => { setShowRejectConfirm(false); setPendingAction(null); }}>Cancel</button>
                <button type="button" className="danger-button" onClick={performReject} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Confirm Rejection'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

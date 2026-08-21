import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Eraser, X } from 'lucide-react';
import ReviewQueue from '../../components/ReviewQueue.jsx';
import ReviewRequest from './ReviewRequest.jsx';
import { pcmsApi } from '../../services/api.js';

export default function RecommendingApproverReviewQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pcmsApi.recommendingReviewQueue();
      const data = Array.isArray(response) ? response : response?.data || [];
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Unable to load review queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadQueue();
    const onDataChanged = () => { if (active) loadQueue(); };
    window.addEventListener('recommendingApproverDataChanged', onDataChanged);
    return () => { active = false; window.removeEventListener('recommendingApproverDataChanged', onDataChanged); };
  }, [loadQueue]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);
  const [bulkSuccess, setBulkSuccess] = useState(null);
  const [bulkConfirm, setBulkConfirm] = useState(null); // 'approve' | 'reject' | null
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  const eligibleRequests = useMemo(
    () => requests.filter((r) => r.current_stage === 'recommending_approver' && r.status === 'pending'),
    [requests]
  );

  useEffect(() => {
    // Drop any selected ids that are no longer present/eligible after a refresh
    setSelectedIds((prev) => prev.filter((id) => eligibleRequests.some((r) => r.id === id)));
  }, [eligibleRequests]);

  const handleToggleSelect = (request, checked) => {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(request.id) ? prev : [...prev, request.id];
      return prev.filter((id) => id !== request.id);
    });
  };

  const handleToggleSelectAll = (checked) => {
    setSelectedIds(checked ? eligibleRequests.map((r) => r.id) : []);
  };

  const clearSelection = () => setSelectedIds([]);

  const openBulkApprove = () => {
    if (!selectedIds.length) return;
    setBulkError(null);
    setBulkConfirm('approve');
  };

  const openBulkReject = () => {
    if (!selectedIds.length) return;
    setBulkError(null);
    setBulkRejectReason('');
    setBulkConfirm('reject');
  };

  const closeBulkConfirm = () => {
    setBulkConfirm(null);
    setBulkRejectReason('');
  };

  const performBulkApprove = async () => {
    setBulkActionLoading(true);
    setBulkError(null);
    setBulkSuccess(null);
    const failures = [];
    for (const id of selectedIds) {
      try {
        await pcmsApi.advancePurchaseRequest(id);
      } catch (err) {
        failures.push({ id, message: err.message || 'Failed to approve.' });
      }
    }
    setBulkActionLoading(false);
    setBulkConfirm(null);
    clearSelection();
    await loadQueue();
    window.dispatchEvent(new CustomEvent('recommendingApproverDataChanged'));
    if (failures.length) {
      setBulkError(`${failures.length} of ${selectedIds.length} request(s) could not be approved.`);
    } else {
      setBulkSuccess(`${selectedIds.length} request(s) recommended and forwarded to the next approval stage.`);
    }
  };

  const performBulkReject = async () => {
    if (!bulkRejectReason.trim()) {
      setBulkError('Please provide a reason for rejection.');
      return;
    }
    setBulkActionLoading(true);
    setBulkError(null);
    setBulkSuccess(null);
    const failures = [];
    for (const id of selectedIds) {
      try {
        await pcmsApi.rejectPurchaseRequest(id, { reason: bulkRejectReason });
      } catch (err) {
        failures.push({ id, message: err.message || 'Failed to reject.' });
      }
    }
    setBulkActionLoading(false);
    setBulkConfirm(null);
    clearSelection();
    await loadQueue();
    window.dispatchEvent(new CustomEvent('recommendingApproverDataChanged'));
    if (failures.length) {
      setBulkError(`${failures.length} of ${selectedIds.length} request(s) could not be rejected.`);
    } else {
      setBulkSuccess(`${selectedIds.length} request(s) rejected and requesters notified.`);
    }
  };

  useEffect(() => {
    if (!modalOpen) return;

    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalBodyOverflow || '';
    };
  }, [modalOpen]);

  const handleView = (request) => {
    setSelectedRequestId(request.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequestId(null);
  };

  const handleSuccess = async () => {
    // refresh queue and close modal
    await loadQueue();
    setModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <div className="recommending-review-queue-page">
      <section className="recommending-panel-card">
        <div className="recommending-panel-header">
          <div>
            <h3>Review Queue</h3>
            <p>Requests assigned for your recommendation review.</p>
          </div>
          <div className="bulk-actions-toolbar">
            <span className="bulk-selected-count">{selectedIds.length} selected</span>
            <button type="button" className="workflow-icon-button" title="Bulk approve selected requests" aria-label="Bulk approve selected requests" onClick={openBulkApprove} disabled={bulkActionLoading || selectedIds.length === 0}>
              <Check size={16} />
            </button>
            <button type="button" className="workflow-icon-button destructive" title="Bulk reject selected requests" aria-label="Bulk reject selected requests" onClick={openBulkReject} disabled={bulkActionLoading || selectedIds.length === 0}>
              <X size={16} />
            </button>
            <button type="button" className="workflow-icon-button" title="Clear selection" aria-label="Clear selection" onClick={clearSelection} disabled={bulkActionLoading || selectedIds.length === 0}>
              <Eraser size={16} />
            </button>
          </div>
        
        </div>

        {bulkSuccess && <div className="form-message success">{bulkSuccess}</div>}
        {bulkError && <div className="form-message error">{bulkError}</div>}

        {error ? (
          <div className="form-message error">{error}</div>
        ) : (
          <ReviewQueue
            requests={requests}
            onView={handleView}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            loading={loading}
          />
        )}
        {modalOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeModal} tabIndex={-1}>
            <div className="modal-card large-review-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Review Request</h3>
                  <p>Review this request before making a recommendation.</p>
                </div>
                <button className="icon-button" type="button" aria-label="Close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <ReviewRequest requestId={selectedRequestId} onSuccess={handleSuccess} onClose={closeModal} />
              </div>
            </div>
          </div>
        )}

        {bulkConfirm === 'approve' && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Bulk Approval</h3>
                <button className="icon-button" type="button" onClick={closeBulkConfirm} aria-label="Close">×</button>
              </div>
              <div className="confirm-dialog-body">
                <p>Are you sure you want to recommend {selectedIds.length} request(s) for the next approval stage?</p>
                {bulkError && <div className="form-message error">{bulkError}</div>}
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={closeBulkConfirm} disabled={bulkActionLoading}>Cancel</button>
                  <button type="button" className="primary-button" onClick={performBulkApprove} disabled={bulkActionLoading}>
                    {bulkActionLoading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {bulkConfirm === 'reject' && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Bulk Rejection</h3>
                <button className="icon-button" type="button" onClick={closeBulkConfirm} aria-label="Close">×</button>
              </div>
              <div className="confirm-dialog-body">
                <p>Rejecting will return {selectedIds.length} request(s) to their requesters. This action cannot be undone.</p>
                <label htmlFor="bulk-reject-reason" style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Reason for rejection
                </label>
                <textarea
                  id="bulk-reject-reason"
                  rows={3}
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Explain why these requests are being rejected..."
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', padding: 10, fontFamily: 'inherit', fontSize: 14 }}
                />
                {bulkError && <div className="form-message error">{bulkError}</div>}
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={closeBulkConfirm} disabled={bulkActionLoading}>Cancel</button>
                  <button type="button" className="danger-button" onClick={performBulkReject} disabled={bulkActionLoading}>
                    {bulkActionLoading ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
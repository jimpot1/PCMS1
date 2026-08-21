import React, { useEffect, useState } from 'react';
import { pcmsApi } from '../services/api.js';
import ExecutiveApprovalCard from './ExecutiveApprovalCard.jsx';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ExecutiveApprovalQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkInProgress, setBulkInProgress] = useState(false);

  const getItemId = (item) => item.id || item.request_number || item.purchase_request_id;

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pcmsApi.pendingApprovals();
      setItems(data?.data || data || []);
    } catch (err) {
      console.error('Error loading approval queue:', err);
      setError('Failed to load pending approvals. ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load();
  }, []);

  // Drop selections for items that are no longer in the queue (e.g. after a refresh)
  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => items.some((it) => getItemId(it) === id)));
  }, [items]);

  const toggleSelect = (item) => {
    const itemId = getItemId(item);
    setSelectedIds((current) => (
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    ));
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : items.map(getItemId));
  };

  const handleApprove = async (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      setError('Cannot identify request to approve');
      return;
    }

    try {
      setActionInProgress(itemId);
      setError(null);
      await pcmsApi.advancePurchaseRequest(itemId);
      setSuccessMessage(`Request ${item.request_number} approved and forwarded to the next stage.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await load();
    } catch (err) {
      console.error('Error approving request:', err);
      setError(`Failed to approve request: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      setError('Cannot identify request to reject');
      return;
    }

    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionInProgress(itemId);
      setError(null);
      await pcmsApi.rejectPurchaseRequest(itemId, { reason });
      setSuccessMessage(`Request ${item.request_number} has been rejected.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await load();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(`Failed to reject request: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRevision = async (item) => {
    const itemId = getItemId(item);
    const reason = prompt('Please provide a revision reason:');
    if (!reason?.trim()) return;
    try {
      setActionInProgress(itemId);
      await pcmsApi.requestPurchaseRevision(itemId, reason.trim());
      setSuccessMessage(`Revision requested for ${item.request_number}.`);
      await load();
    } catch (err) {
      setError(`Failed to request revision: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const runBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    let reason = null;
    if (action === 'reject') {
      reason = prompt(`Please provide a reason for rejecting ${selectedIds.length} request(s):`);
      if (!reason) return;
    } else if (!confirm(`Approve ${selectedIds.length} selected request(s)?`)) {
      return;
    }

    setBulkInProgress(true);
    setError(null);

    const selectedItems = items.filter((it) => selectedIds.includes(getItemId(it)));
    const results = await Promise.allSettled(
      selectedItems.map((it) => (
        action === 'approve'
          ? pcmsApi.advancePurchaseRequest(getItemId(it))
          : pcmsApi.rejectPurchaseRequest(getItemId(it), { reason })
      ))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    const succeeded = results.length - failed.length;

    if (succeeded > 0) {
      setSuccessMessage(`${succeeded} request(s) ${action === 'approve' ? 'approved' : 'rejected'} successfully.` + (failed.length ? ` ${failed.length} failed.` : ''));
      setTimeout(() => setSuccessMessage(null), 6000);
    }
    if (failed.length > 0 && succeeded === 0) {
      setError(`Failed to ${action} ${failed.length} request(s). Please try again.`);
    }

    setSelectedIds([]);
    setBulkInProgress(false);
    await load();
  };

  return (
    <section className="exec-queue">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Pending Executive Approvals</h3>
            <p>Requests approved by Department Heads are shown here for executive review.</p>
          </div>
          {items.length > 0 && (
            <label className="select-all-toggle">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              Select all
            </label>
          )}
        </div>

        {items.length > 0 && (
          <div className={`bulk-action-bar ${selectedIds.length === 0 ? 'empty' : ''}`}>
            <span>{selectedIds.length > 0 ? `${selectedIds.length} selected` : 'No requests selected'}</span>
            <div className="bulk-action-buttons">
              <button className="primary-button" disabled={bulkInProgress || selectedIds.length === 0} onClick={() => runBulkAction('approve')}>
                {bulkInProgress ? <Loader2 size={16} className="spin" /> : null}
                Bulk Approve
              </button>
              <button className="danger-button" disabled={bulkInProgress || selectedIds.length === 0} onClick={() => runBulkAction('reject')}>
                {bulkInProgress ? <Loader2 size={16} className="spin" /> : null}
                Bulk Reject
              </button>
              <button className="muted-button" disabled={bulkInProgress || selectedIds.length === 0} onClick={() => setSelectedIds([])}>
                Clear
              </button>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="form-message success">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="form-message error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading-card">
            <div className="spinner"></div>
            Loading pending approvals...
          </div>
        ) : (
          <div className="approval-list">
            {items.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={48} />
                <p>No executive approvals waiting.</p>
                <p className="text-muted">All pending requests have been reviewed.</p>
              </div>
            ) : (
              items.map((it) => (
                <ExecutiveApprovalCard 
                  key={getItemId(it)} 
                  item={it}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onRevision={handleRevision}
                  isLoading={actionInProgress === getItemId(it) || bulkInProgress}
                  selected={selectedIds.includes(getItemId(it))}
                  onToggleSelect={toggleSelect}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
import React, { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

export default function RecommendingApproverDecisionPanel({ onApprove, onReject, onRequestRevision, disabled = false }) {
  const [reason, setReason] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);

  const handleAction = (action) => {
    setSelectedAction(action);
    if (action === 'approve') return onApprove?.();
    if (action === 'reject') return onReject?.(reason);
    if (action === 'revision') return onRequestRevision?.(revisionReason);
    return null;
  };

  return (
    <section className="recommending-panel-card decision-panel">
      <div className="recommending-panel-header">
        <div>
          <h3>Review Actions</h3>
          <p className="muted">Submit your recommendation after reviewing the request details and previous approval.</p>
          <p className="muted small">This request has been approved by the Department Head and is awaiting your recommendation.</p>
        </div>
      </div>

      <div className="decision-actions-wrap">
        <div className="decision-actions-grid sticky-actions" role="group" aria-label="Recommendation actions">
          <button className={`workflow-icon-button ${selectedAction === 'approve' ? 'action-selected' : ''}`} type="button" title="Approve recommendation" aria-label="Approve recommendation" onClick={() => handleAction('approve')} disabled={disabled}>
            <Check size={17} />
          </button>
          <button className={`workflow-icon-button destructive ${selectedAction === 'reject' ? 'action-selected' : ''}`} type="button" title="Reject request" aria-label="Reject request" onClick={() => handleAction('reject')} disabled={disabled}>
            <X size={17} />
          </button>
          <button className={`workflow-icon-button ${selectedAction === 'revision' ? 'action-selected' : ''}`} type="button" title="Request revision" aria-label="Request revision" onClick={() => handleAction('revision')} disabled={disabled}>
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="actions-divider" aria-hidden="true" />

        <div className="recommending-decision-fields">
          <label>
            Rejection Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="State why this request is rejected." />
          </label>
          <label>
            Revision Reason
            <textarea value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} placeholder="State what needs to be revised." />
          </label>
        </div>
      </div>
    </section>
  );
}

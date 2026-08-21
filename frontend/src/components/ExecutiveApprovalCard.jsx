import React from 'react';

export default function ExecutiveApprovalCard({ item, onApprove, onReject, onRevision, isLoading, selected, onToggleSelect }) {
  return (
    <article className={`exec-approval-card ${selected ? 'selected' : ''}`}>
      <div className="card-select">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect && onToggleSelect(item)}
          aria-label="Select request for bulk action"
        />
      </div>
      <div className="card-left">
        <strong>{item.ref || item.request_number || 'Request'}</strong>
        <p>{item.label || item.document_type || item.type}</p>
        <div className="meta">Requester: {item.requester?.email || item.requester?.name || 'Unknown'}</div>
        <div className="meta">Department: {item.department?.name || item.requester?.department || 'N/A'}</div>
        <div className="meta">Submitted: {item.created_at || item.submitted_at || 'Unknown'}</div>
      </div>
      <div className="card-right">
        <div className="amount">{item.total_amount ? `PHP ${Number(item.total_amount).toLocaleString()}` : item.estimated_cost ? `PHP ${Number(item.estimated_cost).toLocaleString()}` : '-'}</div>
        <div className="actions">
          <button className="primary-button" disabled={isLoading} onClick={() => onApprove && onApprove(item)}>{isLoading ? 'Working…' : 'Approve'}</button>
          <button className="danger-button" disabled={isLoading} onClick={() => onReject && onReject(item)}>Reject</button>
          <button className="warning-button" disabled={isLoading} onClick={() => onRevision && onRevision(item)}>Revision</button>
        </div>
      </div>
    </article>
  );
}
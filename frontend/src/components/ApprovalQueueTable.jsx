import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';

export default function ApprovalQueueTable({ queue = [], onReview, onApprove }) {
  if (!queue.length) {
    return <div className="department-empty-state">No approval requests waiting.</div>;
  }

  return (
    <div className="department-table-wrap">
      <table className="department-queue-table">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Request Type</th>
            <th>Priority</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((item) => (
            <tr key={`${item.type}-${item.id}`}>
              <td><strong>{item.ref}</strong></td>
              <td>{item.requester?.email || item.requester?.name || 'Recorded requester'}</td>
              <td>{item.department?.name || item.requester?.department || 'Department'}</td>
              <td>{item.label}</td>
              <td><span className={`department-priority ${String(item.priority || '').toLowerCase()}`}>{item.priority || 'normal'}</span></td>
              <td>{item.created_at || item.updated_at || 'Pending'}</td>
              <td><span className="department-status pending">Pending</span></td>
              <td>
                <div className="department-inline-actions">
                  <button className="department-action-btn" type="button" onClick={() => onReview(item)}><Eye size={14} /> View</button>
                  <button className="department-action-btn primary" type="button" onClick={() => onApprove(item)}><CheckCircle2 size={14} /> Review</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

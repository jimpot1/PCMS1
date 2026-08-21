import React from 'react';

export default function ApprovalHistory({ history = [] }) {
  if (!history.length) {
    return <div className="recommending-empty-state">No approval history available.</div>;
  }

  return (
    <div className="recommending-history-panel">
      <h4>Approval History</h4>
      <div className="recommending-history-list">
        {history.map((entry, index) => (
          <div key={`${entry.stage}-${index}`} className="recommending-history-item">
            <div>
              <strong>{entry.role || entry.stage || 'Unknown'}</strong>
              <p>{entry.user || entry.person || 'System'}</p>
            </div>
            <div>
              <span className={`status-pill ${entry.status === 'approved' ? 'success' : entry.status === 'rejected' ? 'danger' : entry.status === 'pending' ? 'warning' : 'info'}`}>{entry.status?.replace('_', ' ') || 'Pending'}</span>
              <p>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Pending'}</p>
            </div>
            {entry.comments && <p className="recommending-history-comments">{entry.comments}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
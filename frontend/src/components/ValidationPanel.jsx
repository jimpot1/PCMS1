import React from 'react';

const statusLabels = {
  pending: { label: 'Pending', tone: 'info' },
  passed: { label: 'Passed', tone: 'success' },
  requires_attention: { label: 'Requires Attention', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  not_applicable: { label: 'Not Applicable', tone: 'info' }
};

export default function ValidationPanel({ validations = [] }) {
  return (
    <div className="recommending-validation-panel">
      <h4>Validation Panel</h4>
      <div className="recommending-validation-grid">
        {validations.map((item) => {
          const meta = statusLabels[item.status] || statusLabels.pending;
          return (
            <article key={item.id || item.name} className="recommending-validation-card">
              <div className="recommending-validation-header">
                <h5>{item.name}</h5>
                <span className={`status-pill ${meta.tone}`}>{meta.label}</span>
              </div>
              <p>{item.notes || 'No validation notes provided.'}</p>
              {item.evidence && <small>{item.evidence}</small>}
              {item.timestamp && <small>{new Date(item.timestamp).toLocaleString()}</small>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

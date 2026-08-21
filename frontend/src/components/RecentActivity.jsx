import React from 'react';

export default function RecentActivity({ recentActivity = [] }) {
  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Recent Activity</h3>
          <p>Latest approval events for your department.</p>
        </div>
      </div>
      <div className="department-activity-list">
        {recentActivity.length === 0 ? (
          <div className="department-activity-item text-muted">No recent activity.</div>
        ) : (
          recentActivity.map((act, idx) => (
            <div key={idx} className="department-activity-item">
              <span className="department-activity-dot" />
              <p>{act.action} — {act.payload['request_number'] ?? act.payload['request_number'] ?? ''} <span className="text-muted">{act.created_at}</span></p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

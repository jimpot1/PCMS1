import React from 'react';

export default function NotificationPanel({ notifications = [] }) {
  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Notifications</h3>
          <p>Approval reminders and updates.</p>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="department-empty-state">No new notifications.</div>
      ) : (
        <div className="department-notification-list">
          {notifications.map((item, index) => (
            <article key={index} className="department-notification-card">
              <strong>{item.title || 'Approval update'}</strong>
              <p>{item.message || item.body || 'New activity in the approval queue.'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

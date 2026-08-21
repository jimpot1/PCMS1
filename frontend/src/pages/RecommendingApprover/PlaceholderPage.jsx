import React from 'react';

export default function RecommendingApproverPlaceholder({ title = 'Page', caption = 'This page is under development for the recommending approver workflow.' }) {
  return (
    <div className="recommending-placeholder-page">
      <section className="recommending-panel-card">
        <div className="recommending-panel-header">
          <div>
            <h3>{title}</h3>
            <p>{caption}</p>
          </div>
        </div>
        <div className="recommending-placeholder-body">
          <p>This section has been scaffolded for future recommending approver features, including review worklists, validation flags, and audit records.</p>
        </div>
      </section>
    </div>
  );
}

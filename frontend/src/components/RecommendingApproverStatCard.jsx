import React from 'react';

export default function RecommendingApproverStatCard({ icon: Icon, label, value, description, tone = 'blue', onClick }) {
  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyPress={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
      className={`recommending-stat-card ${tone} ${onClick ? 'clickable' : ''}`}
    >
      <div className="recommending-stat-icon"><Icon size={20} /></div>
      <div>
        <p>{label}</p>
        <strong>{value ?? '—'}</strong>
        {description && <small>{description}</small>}
      </div>
    </article>
  );
}

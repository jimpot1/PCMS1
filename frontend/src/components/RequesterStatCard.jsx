import React from 'react';

export default function RequesterStatCard({ icon: Icon, label, value, description }) {
  return (
    <article className="requester-stat-card">
      <div className="requester-stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <span>{description}</span>
      </div>
    </article>
  );
}

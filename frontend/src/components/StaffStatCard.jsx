import React from 'react';

export default function StaffStatCard({ icon: Icon, label, value, tone = 'blue' }) {
  return (
    <article className={`staff-stat-card ${tone}`}>
      <div className="staff-stat-icon"><Icon size={20} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

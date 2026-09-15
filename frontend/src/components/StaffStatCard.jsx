import React from 'react';

export default function StaffStatCard({ icon: Icon, label, value, tone = 'blue', onClick }) {
  return (
    <button
      type="button"
      className={`staff-stat-card ${tone} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <div className="staff-stat-icon"><Icon size={20} /></div>
      <div className="staff-stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </button>
  );
}

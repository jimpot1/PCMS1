import React from 'react';

export default function ExecutiveStatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="exec-stat-card">
      <div className="stat-left">
        {Icon && <Icon size={22} />}
      </div>
      <div className="stat-right">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </div>
  );
}

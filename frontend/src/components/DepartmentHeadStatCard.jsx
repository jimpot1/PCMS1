import React from 'react';

export default function DepartmentHeadStatCard({ icon: Icon, label, value, description }) {
  return (
    <article className="department-stat-card">
      <div className="stat-icon-wrapper">
        <div className="stat-icon-bg"><Icon size={18} /></div>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className="stat-desc">{description}</div>
      </div>
    </article>
  );
}

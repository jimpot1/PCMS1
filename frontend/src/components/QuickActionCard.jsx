import React from 'react';

export default function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <button className="department-action-card" type="button" onClick={onClick}>
      <div className="department-action-icon"><Icon size={18} /></div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </button>
  );
}

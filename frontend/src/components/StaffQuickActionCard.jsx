import React from 'react';

export default function StaffQuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <button className="staff-quick-action-card" type="button" onClick={onClick}>
      <div className="staff-quick-action-icon"><Icon size={18} /></div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </button>
  );
}

import React from 'react';
import { Menu } from 'lucide-react';
import HeaderActions from './HeaderActions.jsx';

export default function RequesterHeader({ title, subtitle, currentUser, onLogout, sidebarCollapsed, onToggleSidebar, onOpenMobile }) {
  const displayName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.full_name || currentUser?.email || 'Requester';
  const handleSidebarToggle = () => {
    if (window.matchMedia('(max-width: 980px)').matches) {
      onOpenMobile?.();
      return;
    }
    onToggleSidebar?.();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" type="button" onClick={handleSidebarToggle} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div>
          <div className="breadcrumb">PCMS / Requester</div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

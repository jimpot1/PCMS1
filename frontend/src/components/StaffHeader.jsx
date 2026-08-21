import React from 'react';
import { ChevronRight, Menu } from 'lucide-react';
import HeaderActions from './HeaderActions.jsx';

export default function StaffHeader({ currentUser, onLogout, sidebarCollapsed, onToggleSidebar, onOpenMobile }) {
  const displayName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.full_name || currentUser?.email || 'PPMO Staff';
  const handleSidebarButton = () => {
    if (window.matchMedia('(max-width: 980px)').matches) {
      onOpenMobile();
      return;
    }
    onToggleSidebar();
  };

  return (
    <header className="staff-header">
      <div className="staff-header-left">
        <button className="staff-icon-btn staff-sidebar-toggle" type="button" onClick={handleSidebarButton} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div>
          <div className="staff-breadcrumb">PCMS / PPMO <ChevronRight size={14} /> Dashboard</div>
          <h1>Dashboard</h1>
          <p>Overview of your operations and approvals.</p>
        </div>
      </div>
      <div className="staff-header-right">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

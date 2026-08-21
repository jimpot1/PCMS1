import React from 'react';
import { Menu } from 'lucide-react';
import HeaderActions from './HeaderActions.jsx';

export default function RecommendingApproverHeader({ currentUser, onLogout, sidebarCollapsed, onToggleSidebar, onOpenMobile }) {
  const displayName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.full_name || currentUser?.email || 'Recommending Approver';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-button" type="button" onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>
        <div>
          <div className="breadcrumb">PCMS / Recommending Approver</div>
          <h1>Dashboard</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

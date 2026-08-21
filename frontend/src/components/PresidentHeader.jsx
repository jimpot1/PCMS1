import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import HeaderActions from './HeaderActions.jsx';

const meta = {
  '/president/dashboard': { title: 'Dashboard', subtitle: 'Review institution-wide purchase orders awaiting executive approval.' },
  '/president/approvals': { title: 'Purchase Order Approvals', subtitle: 'Review purchase orders approved by Department Heads.' },
  '/president/history': { title: 'Approval History', subtitle: 'Executive approval history and audit.' },
  '/president/analytics': { title: 'Executive Analytics', subtitle: 'Executive reports and KPIs.' },
  '/president/notifications': { title: 'Notifications', subtitle: 'Approval notifications and messages.' },
};

export default function PresidentHeader({ currentUser, onLogout, onToggleSidebar }) {
  const loc = useLocation();
  const route = meta[loc.pathname] || meta['/president/dashboard'];

  return (
    <header className="president-header">
      <div className="president-header-left">
        <button className="icon-btn" type="button" onClick={onToggleSidebar} title="Toggle sidebar"><Menu size={18} /></button>
        <div className="breadcrumb">PCMS / President / CEO <span className="sep">›</span> {route.title}</div>
      </div>
      <div className="president-header-center" />
      <div className="president-header-right">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}
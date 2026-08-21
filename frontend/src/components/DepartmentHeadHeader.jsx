import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import HeaderActions from './HeaderActions.jsx';

const routeMeta = {
  '/department-head/dashboard': { title: 'Dashboard', subtitle: 'Review department approvals with a focused approval workspace.' },
  '/department-head/pending-approvals': { title: 'Pending Approvals', subtitle: 'Review the latest requests awaiting your decision.' },
  '/department-head/pending': { title: 'Pending Approvals', subtitle: 'Review the latest requests awaiting your decision.' },
  '/department-head/queue': { title: 'Approval Queue', subtitle: 'All requests assigned to you.' },
  '/department-head/history': { title: 'Approval History', subtitle: 'Approved, rejected and returned requests.' },
  '/department-head/analytics': { title: 'Department Analytics', subtitle: 'Charts and performance metrics for your department.' },
  '/department-head/notifications': { title: 'Notifications', subtitle: 'Approval reminders and updates.' }
};

export default function DepartmentHeadHeader({ currentUser, onLogout, sidebarCollapsed, onToggleSidebar, onOpenMobile }) {
  const location = useLocation();
  const meta = routeMeta[location.pathname] || routeMeta['/department-head/dashboard'];
  const title = meta.title;
  const subtitle = meta.subtitle;

  const displayName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.full_name || currentUser?.email || 'Department Head';
  return (
    <header className="department-header">
      <div className="department-header-left">
        <button className="department-icon-btn department-mobile-toggle" type="button" onClick={onOpenMobile}><Menu size={18} /></button>
        <button className="department-icon-btn department-desktop-toggle" type="button" onClick={onToggleSidebar}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
        <div>
          <div className="department-breadcrumb">PCMS / Department Head <ChevronRight size={14} /> {title}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="department-header-right">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

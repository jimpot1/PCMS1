import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  ClipboardList,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Bell,
  LogOut,
  UserCircle,
  Sparkles
} from 'lucide-react';

const sidebarSections = [
  {
    title: 'RECOMMENDING APPROVER MENU',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/recommending-approver/dashboard' }
    ]
  },
      {
    title: 'Approval / Review',
    items: [
      { id: 'review-queue', label: 'Review Queue', icon: ClipboardList, to: '/recommending-approver/review-queue' },
      { id: 'conditional-approvals', label: 'Conditional Approvals', icon: ShieldCheck, to: '/recommending-approver/conditional-approvals' },
      { id: 'information-requests', label: 'Information Requests', icon: AlertTriangle, to: '/recommending-approver/information-requests' },
      { id: 'review-history', label: 'Review History', icon: FileText, to: '/recommending-approver/review-history' }
    ]
  },
  {
    title: 'Monitoring',
    items: [
      { id: 'validation-anomalies', label: 'Validation / Anomalies', icon: AlertTriangle, to: '/recommending-approver/validation-anomalies' },
      { id: 'audit-trail', label: 'Request Audit Trail', icon: FileText, to: '/recommending-approver/audit-trail' }
    ]
  },
  {
    title: 'Communication',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, to: '/recommending-approver/notifications' }
    ]
  }
];

export default function RecommendingApproverSidebar({ currentUser, onLogout, collapsed, mobileOpen, onCloseMobile }) {
  const content = (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-icon"><Sparkles size={18} /></div>
        {!collapsed && (
          <div>
            <strong>PCMS System</strong>
            <span>Recommending Approver</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-list">
          {sidebarSections.map((section) => (
            <div className="sidebar-section" key={section.title}>
              {!collapsed && <div className="nav-section-label">{section.title}</div>}
              <div className="nav-items">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => onCloseMobile?.()}
                    >
                      <span className="nav-link-icon"><Icon size={18} /></span>
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="avatar">{(currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'R').toUpperCase()}</div>
          {!collapsed && (
            <div>
              <strong>{[currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || 'Recommending Approver'}</strong>
              <span>Recommending Approver Account</span>
            </div>
          )}
        </div>
        <button className="logout-btn" type="button" onClick={onLogout}>
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {mobileOpen && <div className="overlay" onClick={onCloseMobile} />}
      {content}
    </>
  );
}

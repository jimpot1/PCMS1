import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, History, BarChart3, Bell, User } from 'lucide-react';

const menus = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/president/dashboard' },
  { id: 'approvals', label: 'Purchase Order Approvals', icon: FileText, to: '/president/approvals' },
  { id: 'history', label: 'Approval History', icon: History, to: '/president/history' },
  { id: 'analytics', label: 'Executive Analytics', icon: BarChart3, to: '/president/analytics' },
  { id: 'notifications', label: 'Notifications', icon: Bell, to: '/president/notifications' },
];

export default function PresidentSidebar({ currentUser, onLogout, collapsed, mobileOpen, onCloseMobile }) {
  return (
    <aside className={`president-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="president-brand">
        <div className="president-brand-icon">PC</div>
        {!collapsed && (
          <div>
            <strong>PCMS System</strong>
            <p>Property Custodian Management System</p>
          </div>
        )}
      </div>

      {!collapsed && <div className="president-section-title">PRESIDENT / CEO MENU</div>}
      <nav className="president-nav">
        {menus.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.id}
              to={m.to}
              className={({ isActive }) => `president-nav-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              title={collapsed ? m.label : undefined}
            >
              <span className="president-nav-icon"><Icon size={18} /></span>
              {!collapsed && <span>{m.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="president-sidebar-footer">
        <div className="president-profile">
          <div className="avatar">{(currentUser?.first_name?.[0] || 'P').toUpperCase()}</div>
          {!collapsed && (
            <div>
              <strong>{currentUser?.first_name || 'President'}</strong>
              <p>President / CEO</p>
            </div>
          )}
        </div>
        <button className="logout-btn" type="button" onClick={onLogout} title={collapsed ? 'Logout' : undefined}>
          <User size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {mobileOpen && <div className="president-backdrop" onClick={onCloseMobile} />}
    </aside>
  );
}
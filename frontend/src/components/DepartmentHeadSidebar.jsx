import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardCheck, Layers, FileText, BarChart3, Bell, LogOut, Sparkles } from 'lucide-react';

const departmentMenus = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/department-head/dashboard' },
  { id: 'pending-approvals', label: 'Pending Approvals', icon: ClipboardCheck, to: '/department-head/pending-approvals' },
  { id: 'queue', label: 'Approval Queue', icon: Layers, to: '/department-head/queue' },
  { id: 'history', label: 'Approval History', icon: FileText, to: '/department-head/history' },
  { id: 'analytics', label: 'Department Analytics', icon: BarChart3, to: '/department-head/analytics' },
  { id: 'notifications', label: 'Notifications', icon: Bell, to: '/department-head/notifications' },
];

export default function DepartmentHeadSidebar({ currentUser, onLogout, collapsed, mobileOpen, onCloseMobile }) {
  const content = (
    <aside className={`department-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="department-sidebar-inner">
        <div className="department-brand">
          <div className="department-brand-icon"><Sparkles size={18} /></div>
          {!collapsed && (
            <div>
              <h3>PCMS System</h3>
              <p>Property Custodian Management System</p>
            </div>
          )}
        </div>

        <div className="department-sidebar-section">
          <div className="department-section-title">Department Head Menu</div>
          <nav className="department-nav-list">
            {departmentMenus.map((item) => {
              const Icon = item.icon;
              const to = item.to || `/department-head/${item.id === 'dashboard' ? 'dashboard' : item.id.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <NavLink key={item.id} to={to} className={({ isActive }) => `department-nav-item ${isActive ? 'active' : ''}`}>
                  <span className="department-nav-icon"><Icon size={18} /></span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="department-sidebar-footer">
          <div className="department-profile-card">
            <div className="department-avatar">{(currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'D').toUpperCase()}</div>
            {!collapsed && (
              <div>
                <strong>{currentUser?.first_name || 'Department'} {currentUser?.last_name || 'Head'}</strong>
                <p>Department Head Account</p>
              </div>
            )}
          </div>
          <button className="department-logout-btn" type="button" onClick={onLogout}>
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {mobileOpen && <div className="department-sidebar-backdrop" onClick={onCloseMobile} />}
      {content}
    </>
  );
}

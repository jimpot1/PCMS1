import React from 'react';
import { Home, FileText, Download, PackageCheck, Bell, LogOut, Sparkles } from 'lucide-react';

const requesterMenus = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'submit', label: 'Submit Request', icon: FileText },
  { id: 'status', label: 'Request Status', icon: FileText },
  { id: 'history', label: 'Request History', icon: FileText },
  { id: 'downloads', label: 'Download Documents', icon: Download },
  { id: 'receive', label: 'Receive Released Items', icon: PackageCheck },
  { id: 'assets', label: 'My Assigned Assets', icon: PackageCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function RequesterSidebar({ currentUser, onLogout, activeView, onNavigate, collapsed, mobileOpen, onCloseMobile }) {
  const menuClassName = (view) => `nav-link ${activeView === view ? 'active' : ''}`;
  const content = (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-icon"><Sparkles size={18} /></div>
        {!collapsed && (
          <div>
            <strong>PCMS System</strong>
            <span>Requester</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-list">
          <div className="sidebar-section">
            {!collapsed && <div className="nav-section-label">Requester Menu</div>}
            <div className="nav-items">
              {requesterMenus.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} type="button" className={menuClassName(item.id)} onClick={() => { onNavigate(item.id); onCloseMobile?.(); }}>
                    <span className="nav-link-icon"><Icon size={18} /></span>
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="avatar">{(currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'U').toUpperCase()}</div>
          {!collapsed && (
            <div>
              <strong>{currentUser?.first_name || 'Requester'} {currentUser?.last_name || ''}</strong>
              <span>Requester Account</span>
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

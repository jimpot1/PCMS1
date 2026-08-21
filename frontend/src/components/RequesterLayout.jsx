import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import RequesterSidebar from './RequesterSidebar.jsx';
import RequesterHeader from './RequesterHeader.jsx';

export default function RequesterLayout({ currentUser, onLogout, activeView, onNavigate, title, subtitle, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (view) => {
    onNavigate?.(view);
    setMobileOpen(false);
  };

  const handleOpenMobile = () => {
    setSidebarCollapsed(false);
    setMobileOpen(true);
  };

  return (
    <div className={`sms-app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <RequesterSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        activeView={activeView}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="main">
        <RequesterHeader
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          onLogout={onLogout}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          onOpenMobile={handleOpenMobile}
        />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import PresidentSidebar from './PresidentSidebar.jsx';
import PresidentHeader from './PresidentHeader.jsx';

export default function PresidentLayout({ currentUser, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('pcms_president_sidebar_collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 981px)').matches);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 981px)');
    const handleChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('pcms_president_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const effectiveCollapsed = sidebarCollapsed && isDesktop;

  // On desktop, the header button collapses/expands the sidebar.
  // On mobile/tablet, the sidebar is off-canvas, so the same button opens/closes the drawer instead.
  const handleToggle = () => {
    if (isDesktop) {
      setSidebarCollapsed((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  };

  return (
    <div className={`president-shell ${effectiveCollapsed ? 'collapsed' : ''}`}>
      <PresidentSidebar
        currentUser={currentUser}
        onLogout={onLogout}
        collapsed={effectiveCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="president-main">
        <PresidentHeader currentUser={currentUser} onLogout={onLogout} onToggleSidebar={handleToggle} />
        <main className="president-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
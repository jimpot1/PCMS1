import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import StaffSidebar from './StaffSidebar.jsx';
import StaffHeader from './StaffHeader.jsx';

export default function StaffLayout({ currentUser, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeLogoutConfirm = () => setShowLogoutConfirm(false);

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await onLogout();
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {showLogoutConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeLogoutConfirm}>
          <div className="modal-card confirm-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Logout</h3>
              <button className="icon-button" type="button" onClick={closeLogoutConfirm} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to logout?</p>
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeLogoutConfirm}>Cancel</button>
                <button type="button" className="primary-button danger" onClick={handleConfirmLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`staff-shell ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <StaffSidebar
          currentUser={currentUser}
          onLogout={handleLogoutRequest}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="staff-main">
          <StaffHeader
            currentUser={currentUser}
            onLogout={handleLogoutRequest}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
            onOpenMobile={() => setMobileOpen(true)}
          />
          <main className="staff-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

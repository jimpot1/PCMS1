import React, { useEffect, useState, useRef } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pcmsApi } from '../services/api.js';
import { ROLES, getRoleDisplayName } from '../services/roles.js';

function getNotificationsPath(role) {
  switch (role) {
    case ROLES.DEPARTMENT_HEAD:
      return '/department-head/notifications';
    case ROLES.DEPARTMENT_REQUESTER:
      return '/requester/notifications';
    case ROLES.OIC:
      return '/oic/notifications';
    case ROLES.PPMO_STAFF:
      return '/ppmo/notifications';
    case ROLES.PRESIDENT_CEO:
      return '/president/notifications';
    case ROLES.RECOMMENDING_APPROVER:
      return '/recommending-approver/notifications';
    default:
      return '/';
  }
}

export default function HeaderActions({ currentUser, onLogout }) {
  const [notifData, setNotifData] = useState({ data: [], unread_count: 0 });
  const [loading, setLoading] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef(null);
  const notifButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const isSystemAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN;
    if (isSystemAdmin) {
      setNotifData({ data: [], unread_count: 0 });
      return undefined;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await pcmsApi.notifications();
        if (!mounted) return;
        setNotifData(data || { data: [], unread_count: 0 });
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    function onAppDataChanged() {
      // refresh notifications as soon as any workflow action happens anywhere in the app
      load();
    }
    const intv = setInterval(load, 15000);
    window.addEventListener('recommendingApproverDataChanged', onAppDataChanged);
    window.addEventListener('pcms:dataChanged', onAppDataChanged);
    window.addEventListener('focus', onAppDataChanged);
    return () => {
      mounted = false;
      clearInterval(intv);
      window.removeEventListener('recommendingApproverDataChanged', onAppDataChanged);
      window.removeEventListener('pcms:dataChanged', onAppDataChanged);
      window.removeEventListener('focus', onAppDataChanged);
    };
  }, [currentUser?.role]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target) && notifButtonRef.current && !notifButtonRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target) && profileButtonRef.current && !profileButtonRef.current.contains(e.target)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onNotificationClick = async (n) => {
    if (n && !n.read && n.source && n.id) {
      try {
        await pcmsApi.markNotificationRead(n.source, n.id);
        setNotifData((prev) => ({
          ...prev,
          data: (prev.data || []).map((item) => item.id === n.id && item.source === n.source ? { ...item, read: true } : item),
          unread_count: Math.max(0, (prev.unread_count || 0) - 1),
        }));
      } catch (error) {
        // ignore read update failure and continue navigation
      }
    }

    setShowNotifDropdown(false);
    if (n?.url) {
      navigate(n.url);
      return;
    }
    navigate(getNotificationsPath(currentUser?.role));
  };

  const displayName = (currentUser?.first_name || currentUser?.email || 'User');
  const roleLabel = getRoleDisplayName(currentUser?.role) || currentUser?.department || 'User';
  const isSystemAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {!isSystemAdmin && (
      <div style={{ position: 'relative' }}>
        <button ref={notifButtonRef} className="icon-button" type="button" aria-haspopup="true" aria-expanded={showNotifDropdown} onClick={() => { setShowNotifDropdown((v) => !v); setShowProfileMenu(false); }}>
          <Bell size={18} />
          {notifData?.unread_count > 0 && <span className="header-badge">{notifData.unread_count}</span>}
        </button>
        {showNotifDropdown && (
          <div ref={notifRef} className="dropdown notification-dropdown">
            <div className="dropdown-header">Notifications</div>
            <div className="dropdown-body">
              {loading ? <div className="dropdown-empty">Loading...</div> : (
                (notifData?.data || []).length === 0 ? <div className="dropdown-empty">No new notifications</div> : (
                  (notifData.data || []).slice(0, 6).map((n, idx) => (
                    <button key={idx} type="button" className={`notification-item ${n.read ? 'read' : 'unread'}`} onClick={() => onNotificationClick(n)}>
                      <div className="notification-title">{n.title || n.message || 'Notification'}</div>
                      {n.message && <div className="notification-message">{n.message}</div>}
                      <div className="notification-meta">{n.created_at}</div>
                    </button>
                  ))
                )
              )}
            </div>
            <div className="dropdown-footer">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="link-button" type="button" onClick={async () => {
                  try {
                    await pcmsApi.markAllNotificationsRead();
                    setNotifData((d) => ({
                      ...d,
                      data: (d.data || []).map((item) => ({ ...item, read: true })),
                      unread_count: 0,
                    }));
                  } catch (error) {
                    // ignore mark-all failure
                  }
                }}>Mark all as read</button>
                <button className="link-button" type="button" onClick={() => { setShowNotifDropdown(false); navigate(getNotificationsPath(currentUser?.role)); }}>View all notifications</button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      <div style={{ position: 'relative' }}>
        <button ref={profileButtonRef} className="profile-button" type="button" aria-haspopup="true" aria-expanded={showProfileMenu} onClick={() => { setShowProfileMenu((v) => !v); setShowNotifDropdown(false); }}>
          <div className="avatar">{displayName?.[0]?.toUpperCase() || 'U'}</div>
          <div className="profile-text">
            <div className="profile-name">{displayName}</div>
            <div className="profile-role">{roleLabel}</div>
          </div>
          <ChevronDown size={14} />
        </button>
        {showProfileMenu && (
          <div ref={profileMenuRef} className="dropdown profile-dropdown">
            <div className="dropdown-list">
              <button type="button" className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>Profile</button>
              <button type="button" className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate('/account-settings'); }}>Account Settings</button>
              {!isSystemAdmin && (
                <button type="button" className="dropdown-item" onClick={() => { setShowProfileMenu(false); navigate(getNotificationsPath(currentUser?.role)); }}>Notifications</button>
              )}
            </div>
            <div className="dropdown-footer">
              <button className="link-button" type="button" onClick={() => { setShowProfileMenu(false); onLogout?.(); }}>Logout</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
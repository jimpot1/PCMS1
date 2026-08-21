import React, { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { pcmsApi } from '../services/api.js';

export default function UserNotificationsPage({ title = 'Notifications', subtitle = 'Your notifications.' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    pcmsApi.notifications()
      .then((response) => {
        if (mounted) setItems(response?.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Unable to load notifications.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    if (marking || items.length === 0) {
      return;
    }

    setMarking(true);
    try {
      await pcmsApi.markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      // ignore failure; keep current UI state
    } finally {
      setMarking(false);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item?.read && item?.source && item?.id) {
      try {
        await pcmsApi.markNotificationRead(item.source, item.id);
        setItems((prev) => prev.map((notice) => (
          notice.id === item.id && notice.source === item.source ? { ...notice, read: true } : notice
        )));
      } catch {
        // keep navigation available even if read-state update fails
      }
    }

    if (item?.url) {
      navigate(item.url);
    }
  };

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="secondary-button" onClick={handleMarkAllRead} disabled={marking || items.length === 0}>
          <Bell size={14} /> Mark all as read
        </button>
      </div>

      {error && <div className="form-message error">{error}</div>}

      {loading ? (
        <div className="notification-list" aria-busy="true">
          <div className="notification-card read">
            <Loader2 size={18} className="spin" />
            <div>
              <strong>Loading notifications...</strong>
              <p>Fetching approval reminders and messages.</p>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="department-empty-state">No notifications.</div>
      ) : (
        <div className="notification-list">
          {items.map((item) => (
            <button key={`${item.source}-${item.id}`} type="button" className={`notification-card ${item.read ? 'read' : 'unread'}`} onClick={() => handleNotificationClick(item)}>
              <div>
                <strong>{item.title || 'Notification'}</strong>
                <p>{item.message || 'No details available.'}</p>
              </div>
              <span>{item.time || item.created_at}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

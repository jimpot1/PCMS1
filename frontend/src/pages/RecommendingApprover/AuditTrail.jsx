import React, { useEffect, useState } from 'react';
import { Activity, Loader2, AlertTriangle } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadLogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.activityLogs({ limit: 200 });
        if (!mounted) return;
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load audit trail.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadLogs();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Request Audit Trail</h3>
          <p>Recent workflow and audit activity from the purchase request system.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : logs.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <AlertTriangle size={40} />
          <p>No audit events were found.</p>
          <p className="recommending-muted">Workflow activity and notifications appear here when available.</p>
        </div>
      ) : (
        <div className="recommending-queue-table-wrap">
          <table className="recommending-queue-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>User</th>
                <th>Description</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-loading-row">Loading audit trail...</td>
                </tr>
              ) : logs.map((item) => (
                <tr key={item.id}>
                  <td>{item.time ? new Date(item.time).toLocaleString() : 'N/A'}</td>
                  <td>{item.action || 'Audit'}</td>
                  <td>{item.user || 'System'}</td>
                  <td>{item.text || item.message || 'No details available.'}</td>
                  <td>{item.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

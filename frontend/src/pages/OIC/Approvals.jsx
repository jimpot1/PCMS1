import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function OicApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    pcmsApi.fetchReleasedRequests({ limit: 200 })
      .then(setItems)
      .catch((err) => setError(err.message || 'Unable to load release history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="oic-page-shell">
      <section className="oic-panel">
        <div className="panel-header">
          <div>
            <h3>Release History</h3>
            <p>Review completed release actions and approval history in one place.</p>
          </div>
        </div>
        {error ? <div className="form-message error"><AlertTriangle size={18} /> {error}</div> : items.length === 0 && !loading ? (
          <div className="empty-state"><CheckCircle2 size={32} /> No release history available.</div>
        ) : (
          <div className="table-responsive"><table className="data-table"><thead><tr><th>Request Number</th><th>Requester</th><th>Department</th><th>Status</th><th>Released At</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="table-loading-row"><Loader2 size={20} className="spin" /> Loading release history...</td></tr> : items.map((item) => <tr key={item.id}><td className="font-mono">{item.request_number}</td><td>{item.requester?.email || item.requested_by_name || '-'}</td><td>{item.department?.name || item.department_name || '-'}</td><td><span className="status success">{item.status || 'released'}</span></td><td>{item.released_at ? new Date(item.released_at).toLocaleString() : '-'}</td></tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}

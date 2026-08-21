import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function ReviewHistory() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const allRequests = await pcmsApi.recommendingApproverHistory();
        if (!mounted) return;
        const requests = Array.isArray(allRequests) ? allRequests : [];
        const filtered = requests.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

        setHistoryItems(filtered);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load review history.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Review History</h3>
          <p>Completed and historical recommendations for the recommending approver stage.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : historyItems.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <AlertTriangle size={40} />
          <p>No review history available.</p>
          <p className="recommending-muted">Completed approvals and rejections for your role will appear here.</p>
        </div>
      ) : (
        <div className="recommending-queue-table-wrap">
          <table className="recommending-queue-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Requester</th>
                <th>Department</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Amount</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-loading-row">Loading history...</td>
                </tr>
              ) : historyItems.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.request_number}</strong></td>
                  <td>{request.requester?.email || request.requester?.name || 'Requester'}</td>
                  <td>{request.department?.name || request.department_name || 'Department'}</td>
                  <td><span className={`status-pill ${request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'info'}`}>{request.status || 'pending'}</span></td>
                  <td>{request.current_stage?.replace('_', ' ') || 'N/A'}</td>
                  <td>{request.total_amount ? `PHP ${Number(request.total_amount).toLocaleString()}` : '—'}</td>
                  <td>{request.updated_at ? new Date(request.updated_at).toLocaleString() : request.created_at ? new Date(request.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function ApprovalHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const allRequests = await pcmsApi.purchaseRequests({ limit: 200 });
        const records = Array.isArray(allRequests) ? allRequests : allRequests?.data || [];
        if (mounted) {
          setRequests(records);
        }
      } catch (err) {
        console.error('Error loading approval history:', err);
        if (mounted) setError('Failed to load approval history.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const historyItems = requests
    .filter((request) => {
      return request.status !== 'pending' || request.current_stage !== 'president';
    })
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Approval History</h2>
          <p>Review your past decisions and completed purchase request transactions.</p>
        </div>
      </div>

      {loading && (
        <div className="loading-card">
          <Loader2 size={18} className="spin" />
          Loading approval history...
        </div>
      )}

      {error && <div className="form-message error">{error}</div>}

      {!loading && !error && historyItems.length === 0 && (
        <div className="empty-state">No approval history available yet.</div>
      )}

      {!loading && !error && historyItems.length > 0 && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Department</th>
                <th>Requester</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.map((item) => (
                <tr key={item.id || item.request_number}>
                  <td>{item.request_number || item.id}</td>
                  <td>{item.department_name || item.department || item.requester?.department || 'N/A'}</td>
                  <td>{item.requester?.email || item.requester?.name || item.requested_by_name || 'Unknown'}</td>
                  <td>{item.total_amount ? `PHP ${Number(item.total_amount).toLocaleString()}` : '—'}</td>
                  <td>{item.status?.replace('_', ' ') || item.current_stage || 'Unknown'}</td>
                  <td>{item.updated_at ? new Date(item.updated_at).toLocaleString() : item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
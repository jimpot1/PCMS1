import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function ApprovalHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const items = await pcmsApi.departmentHeadApprovalHistory();
        if (!mounted) return;
        setHistory(items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
      } catch (err) {
        console.error('Error loading approval history:', err);
        if (!mounted) return;
        setError('Failed to load approval history.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Approval History</h3>
          <p>Approved, rejected and returned requests for your department.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : history.length === 0 && !loading ? (
        <div className="department-empty-state">
          <FileText size={40} />
          <p>No history yet.</p>
          <p className="text-muted">Processed approvals and rejections will appear here once your department handles them.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Current Stage</th>
                <th>Amount</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="table-loading-row">
                      <Loader2 size={20} className="spin" />
                      <span>Loading approval history...</span>
                    </td>
                  </tr>
                ) : history.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono font-semibold">{item.request_number}</td>
                  <td>{item.requester?.email || item.requested_by || '-'}</td>
                  <td>
                    <span className={`badge badge-${item.status || 'secondary'}`}>
                      {item.status || 'unknown'}
                    </span>
                  </td>
                  <td>{item.current_stage || '-'}</td>
                  <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(item.total_amount || 0))}</td>
                  <td>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Loader2, AlertTriangle } from 'lucide-react';
import { Eye } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function PendingReviews() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadPendingReviews() {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.purchaseRequests({ current_stage: 'recommending_approver', status: 'pending', limit: 200 });
        if (!mounted) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load pending reviews.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPendingReviews();
    const onDataChanged = () => { if (mounted) loadPendingReviews(); };
    window.addEventListener('recommendingApproverDataChanged', onDataChanged);

    return () => { mounted = false; window.removeEventListener('recommendingApproverDataChanged', onDataChanged); };
  }, []);

  const handleView = (request) => {
    navigate(`/recommending-approver/review/${request.id}`);
  };

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Pending Reviews</h3>
          <p>Current requests awaiting recommendation by your role.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : requests.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <AlertTriangle size={40} />
          <p>No pending reviews were found.</p>
          <p className="recommending-muted">Requests assigned to the recommending approver will appear here when they become available.</p>
        </div>
      ) : (
        <div className="recommending-pending-list">
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Request No.</th>
                  <th>Requester</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Days Pending</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="table-loading-row">Loading pending reviews...</td>
                  </tr>
                ) : requests.map((r) => {
                  const created = r.created_at ? new Date(r.created_at) : null;
                  const daysPending = created ? Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) : '-';
                  return (
                    <tr key={r.id}>
                      <td className="font-mono">{r.request_number}</td>
                      <td>{r.requester?.email || r.requester?.name || '-'}</td>
                      <td>{r.department?.name || r.department_name || '-'}</td>
                      <td>{(r.request_type || '').replace('_', ' ') || 'Purchase'}</td>
                      <td>{created ? created.toLocaleDateString() : '-'}</td>
                      <td>{typeof daysPending === 'number' ? `${daysPending} day${daysPending !== 1 ? 's' : ''}` : '-'}</td>
                      <td>{r.current_stage?.replace('_', ' ') || '-'}</td>
                      <td><span className={`status-pill ${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'info'}`}>{r.status || 'pending'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button className="workflow-icon-button" type="button" title="Open review" aria-label={`Open review for ${r.request_number}`} onClick={() => handleView(r)}><Eye size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

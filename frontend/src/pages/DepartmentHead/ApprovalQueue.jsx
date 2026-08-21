import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function ApprovalQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const loadQueue = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all department requests
        const data = await pcmsApi.departmentHeadApprovalQueue();
        setRequests(data?.purchaseRequests || []);
      } catch (err) {
        console.error('Error loading approval queue:', err);
        setError('Failed to load approval queue');
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, []);

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Approval Queue</h3>
          <p>All requests currently assigned to your department for review.</p>
        </div>
      </div>

      {error && (
        <div className="form-message error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="filter-bar">
        <label>Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filteredRequests.length === 0 && !loading ? (
        <div className="department-empty-state">
          <CheckCircle2 size={40} />
          <p>No requests assigned.</p>
          <p className="text-muted">
            {filterStatus === 'all' 
              ? 'No requests are currently in your queue.'
              : `No ${filterStatus} requests in your queue.`}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Requester</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Stage</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="table-loading-row">
                    <Loader2 size={20} className="spin" />
                    <span>Loading approval queue...</span>
                  </td>
                </tr>
              ) : filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="font-mono font-semibold">{request.request_number}</td>
                  <td>{request.requester?.email || request.requested_by || '-'}</td>
                  <td className="text-right">PHP {Number(request.total_amount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${request.status}`}>{request.status}</span>
                  </td>
                  <td>{request.current_stage || '-'}</td>
                  <td className="text-muted">{request.created_at ? new Date(request.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="link-button">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DepartmentHeadStatCard from '../../components/DepartmentHeadStatCard.jsx';
import QuickActionCard from '../../components/QuickActionCard.jsx';
import DepartmentAnalytics from '../../components/DepartmentAnalytics.jsx';
import RecentActivity from '../../components/RecentActivity.jsx';
import { pcmsApi } from '../../services/api.js';
import { CheckCircle2, Clock, Inbox, Loader2, RotateCw } from 'lucide-react';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await pcmsApi.departmentHeadDashboard();
      setData(resp || {});
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const onChange = () => loadDashboard();
    window.addEventListener('departmentHeadDataChanged', onChange);
    const poll = setInterval(() => loadDashboard(), 30000);
    return () => { window.removeEventListener('departmentHeadDataChanged', onChange); clearInterval(poll); };
  }, [loadDashboard]);

  return (
    <>
      <section className="department-hero-card">
        <div>
          <p className="department-eyebrow">Welcome back</p>
          <h2>Welcome back, Department Head!</h2>
          <p>Review procurement and department requests awaiting your approval.</p>
        </div>
        <div className="department-hero-actions">
          <button className="department-submit-btn" type="button" onClick={() => navigate('/department-head/pending-approvals')}>Review Approvals</button>
          <button className="department-secondary-btn" type="button" onClick={() => navigate('/department-head/history')}>Approval History</button>
        </div>
      </section>

      <section className="department-stats-grid">
        <DepartmentHeadStatCard icon={Inbox} label="Pending Approvals" value={data.pending_approvals ?? '-'} description="Waiting for review" />
        <DepartmentHeadStatCard icon={CheckCircle2} label="Approved Today" value={data.approved_today ?? '-'} description="Approved requests today" />
        <DepartmentHeadStatCard icon={RotateCw} label="Returned for Revision" value={data.returned_for_revision ?? '-'} description="Awaiting requester updates" />
        <DepartmentHeadStatCard icon={Clock} label="Average Review Time" value={data.average_review_time_hours ? `${data.average_review_time_hours} hrs` : '—'} description="Average processing duration" />
      </section>

      <section className="department-panel-card">
        <div className="department-panel-header">
          <div>
            <h3>Pending Approval Queue</h3>
            <p>Review the latest requests awaiting your decision.</p>
          </div>
        </div>
        <div className="department-panel-body">
          {error ? (
            <div className="form-message error">{error}</div>
          ) : loading || (data.pending_requests && data.pending_requests.length > 0) ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request Number</th>
                    <th>Requester</th>
                    <th>Department</th>
                    <th>Purpose</th>
                    <th>Amount</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="table-loading-row">
                        <Loader2 size={20} className="spin" />
                        <span>Loading pending requests...</span>
                      </td>
                    </tr>
                  ) : data.pending_requests.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.request_number}</strong></td>
                      <td>{item.requester?.email || item.requested_by || '-'}</td>
                      <td>{item.department?.name || '-'}</td>
                      <td>{item.purpose || '-'}</td>
                      <td>{formatCurrency(item.total_amount)}</td>
                      <td>{item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="link-button" type="button" onClick={() => navigate('/department-head/pending-approvals')}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="department-empty-state">No approval requests waiting.</div>
          )}
        </div>
      </section>

      <section className="department-grid-two">
        <QuickActionCard icon={() => null} title="Quick Actions" description="Jump into the queue and recent approvals" />
        <DepartmentAnalytics analytics={data.analytics || {}} />
      </section>

      <section className="department-grid-two">
        <RecentActivity recentActivity={data.recent_activity || []} />
      </section>
    </>
  );
}

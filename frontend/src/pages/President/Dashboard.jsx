import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Loader2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExecutiveStatCard from '../../components/ExecutiveStatCard.jsx';
import ExecutiveAnalytics from '../../components/ExecutiveAnalytics.jsx';
import ExecutiveApprovalQueue from '../../components/ExecutiveApprovalQueue.jsx';
import { pcmsApi } from '../../services/api.js';

export default function PresidentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    modified: 0,
    rejected: 0,
    waiting_release: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const pending = await pcmsApi.pendingApprovals();
        const pendingCount = Array.isArray(pending) ? pending.length : pending?.data?.length || 0;

        const allRequests = await pcmsApi.purchaseRequests({ limit: 200 });
        const requests = Array.isArray(allRequests) ? allRequests : allRequests?.data || [];

        const approved = requests.filter((r) => ['approved', 'released'].includes(r.status)).length;
        const modified = requests.filter((r) => r.status === 'pending' && r.current_stage === 'recommending_approver').length;
        const rejected = requests.filter((r) => r.status === 'rejected').length;
        const waitingRelease = requests.filter((r) => r.current_stage === 'property_custodian' && r.status === 'pending').length;
        const completed = requests.filter((r) => r.status === 'released' || r.current_stage === 'released').length;

        setStats({
          pending: pendingCount,
          approved,
          modified,
          rejected,
          waiting_release: waitingRelease,
          completed
        });
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError('Failed to load executive dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="president-dashboard loading-state">
        <div className="loading-container">
          <Loader2 size={40} className="spin" />
          <p>Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="president-dashboard">
      <section className="president-hero">
        <div>
          <p className="eyebrow">Welcome back, President / CEO!</p>
          <h2>Review purchase requests awaiting your executive action.</h2>
          <p>
            {stats.pending > 0
              ? `${stats.pending} request${stats.pending !== 1 ? 's' : ''} are awaiting your review.`
              : 'There are no pending executive approval requests at this time.'}
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate('/president/approvals')} disabled={stats.pending === 0}>
            {stats.pending > 0 ? `Review ${stats.pending} Request${stats.pending !== 1 ? 's' : ''}` : 'No Pending Reviews'}
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <ExecutiveStatCard
          icon={Clock}
          label="Pending Executive Approvals"
          value={stats.pending}
          description={stats.pending > 0 ? 'Awaiting your decision' : 'No requests at this stage'}
        />
        <ExecutiveStatCard
          icon={CheckCircle2}
          label="Approved Requests"
          value={stats.approved}
          description="Approved and routed for processing"
        />
        <ExecutiveStatCard
          icon={AlertTriangle}
          label="Requests Returned for Change"
          value={stats.modified}
          description="Awaiting revisions from requesters"
        />
        <ExecutiveStatCard
          icon={AlertTriangle}
          label="Rejected Requests"
          value={stats.rejected}
          description="Executive rejections"
        />
        <ExecutiveStatCard
          icon={TrendingUp}
          label="Requests Waiting Release"
          value={stats.waiting_release}
          description="Approved, pending inventory release"
        />
        <ExecutiveStatCard
          icon={CheckCircle2}
          label="Released Requests"
          value={stats.completed}
          description="Completed and released"
        />
      </section>

      {error && (
        <section className="panel error-panel">
          <p className="error-message">{error}</p>
        </section>
      )}

      <section className="quick-actions">
        <button className="secondary-button" onClick={() => navigate('/president/approvals')}>
          View Pending Approvals
        </button>
        <button className="secondary-button" onClick={() => navigate('/president/history')}>
          View Approval History
        </button>
        <button className="secondary-button" onClick={() => navigate('/president/analytics')}>
          View Analytics
        </button>
      </section>

      <section className="panel">
        <ExecutiveApprovalQueue />
      </section>

      <section className="panel">
        <ExecutiveAnalytics />
      </section>
    </div>
  );
}
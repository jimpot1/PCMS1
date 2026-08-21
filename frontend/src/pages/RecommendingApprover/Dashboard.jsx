import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import RecommendingApproverStatCard from '../../components/RecommendingApproverStatCard.jsx';
import ReviewQueue from '../../components/ReviewQueue.jsx';
import { pcmsApi } from '../../services/api.js';

export default function RecommendingApproverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedRecommendations: 0,
    rejectedRequests: 0,
    informationRequired: 0,
    conditionalApprovals: 0,
    validationIssues: 0,
  });
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await pcmsApi.recommendingApproverDashboard();
        if (!active) return;

        const stats = response?.stats || {};
        const queueData = Array.isArray(response?.queue) ? response.queue : [];

        setQueue(queueData);
        setStats({
          pendingReviews: stats.pending ?? 0,
          approvedRecommendations: stats.approved ?? 0,
          rejectedRequests: stats.rejected ?? 0,
          informationRequired: stats.information_required ?? 0,
          conditionalApprovals: stats.conditional_approvals ?? 0,
          validationIssues: stats.validation_issues ?? 0,
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Unable to load recommending approver dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const onDataChanged = () => { if (active) load(); };
    window.addEventListener('recommendingApproverDataChanged', onDataChanged);

    return () => { active = false; window.removeEventListener('recommendingApproverDataChanged', onDataChanged); };
  }, []);

  const handleView = (request) => {
    navigate(`/recommending-approver/review/${request.id}`);
  };

  return (
    <div className="recommending-dashboard">
      <section className="recommending-hero-card">
        <div>
          <p>Welcome, Recommending Approver</p>
          <h2>Review requests, validate findings, and move approvals forward.</h2>
          <p className="recommending-muted">This workspace supports the recommending approver stage for purchase request workflow.</p>
        </div>
      </section>

      <section className="recommending-stats-grid">
        <RecommendingApproverStatCard icon={ClipboardList} label="Pending Reviews" value={stats.pendingReviews} description="Requests waiting for recommendation." tone="blue" onClick={() => navigate('/recommending-approver/review-queue')} />
        <RecommendingApproverStatCard icon={CheckCircle2} label="Approved Recommendations" value={stats.approvedRecommendations} description="Requests recommended for next stage." tone="success" onClick={() => navigate('/recommending-approver/review-history')} />
        <RecommendingApproverStatCard icon={XCircle} label="Rejected Requests" value={stats.rejectedRequests} description="Requests returned to requester." tone="danger" onClick={() => navigate('/recommending-approver/review-history')} />
        <RecommendingApproverStatCard icon={AlertTriangle} label="Information Required" value={stats.informationRequired} description="Requests paused for more data." tone="warning" onClick={() => navigate('/recommending-approver/information-requests')} />
        <RecommendingApproverStatCard icon={ShieldCheck} label="Conditional Approvals" value={stats.conditionalApprovals} description="Requests approved with conditions." tone="purple" onClick={() => navigate('/recommending-approver/conditional-approvals')} />
        <RecommendingApproverStatCard icon={FileText} label="Validation Issues" value={stats.validationIssues} description="Requests requiring attention." tone="orange" onClick={() => navigate('/recommending-approver/validation-anomalies')} />
      </section>

      <section className="recommending-panel-card">
        <div className="recommending-panel-header">
          <div>
            <h3>Pending Review Queue</h3>
            <p>Requests assigned to the recommending approver for validation.</p>
          </div>
        </div>
        {error ? (
          <div className="form-message error">{error}</div>
        ) : (
          <ReviewQueue requests={queue} onView={handleView} loading={loading} />
        )}
      </section>
    </div>
  );
}

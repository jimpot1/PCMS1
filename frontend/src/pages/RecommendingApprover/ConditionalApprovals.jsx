import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import ReviewQueue from '../../components/ReviewQueue.jsx';
import { pcmsApi } from '../../services/api.js';

export default function ConditionalApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadConditionalApprovals() {
      try {
        setLoading(true);
        setError(null);
        const allRequests = await pcmsApi.purchaseRequests({ current_stage: 'recommending_approver', limit: 200 });
        if (!mounted) return;
        const source = Array.isArray(allRequests) ? allRequests : [];
        const conditionalRequests = source.filter((request) => {
          const status = String(request.status || '').toLowerCase();
          return status === 'conditionally_approved'
            || status === 'conditional_approval'
            || Boolean(request.conditional_notes)
            || Boolean(request.conditions)
            || Boolean(request.condition_notes);
        });
        setRequests(conditionalRequests);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load conditional approvals.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadConditionalApprovals();
    return () => { mounted = false; };
  }, []);

  const handleView = (request) => {
    navigate(`/recommending-approver/review/${request.id}`);
  };

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Conditional Approvals</h3>
          <p>Requests approved with conditions or additional review requirements.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : requests.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <ShieldCheck size={40} />
          <p>No conditional approvals were found.</p>
          <p className="recommending-muted">This data is derived from request records. If your workflow captures conditional approval flags, they will appear here.</p>
        </div>
      ) : (
        <ReviewQueue requests={requests} onView={handleView} loading={loading} />
      )}
    </section>
  );
}

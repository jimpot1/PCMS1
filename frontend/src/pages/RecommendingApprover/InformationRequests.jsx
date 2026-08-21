import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import ReviewQueue from '../../components/ReviewQueue.jsx';
import { pcmsApi } from '../../services/api.js';

export default function InformationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function loadInformationRequests() {
      try {
        setLoading(true);
        setError(null);
        const allRequests = await pcmsApi.purchaseRequests({ current_stage: 'recommending_approver', limit: 200 });
        if (!mounted) return;
        const source = Array.isArray(allRequests) ? allRequests : [];
        const infoRequests = source.filter((request) => {
          const status = String(request.status || '').toLowerCase();
          return status === 'information_required'
            || status === 'needs_information'
            || status === 'more_info_requested'
            || Boolean(request.information_requested)
            || Boolean(request.more_information_requested)
            || Boolean(request.request_information)
            || Boolean(request.request_information_reason);
        });
        setRequests(infoRequests);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load information requests.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInformationRequests();
    return () => { mounted = false; };
  }, []);

  const handleView = (request) => {
    navigate(`/recommending-approver/review/${request.id}`);
  };

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Information Requests</h3>
          <p>Requests that require additional clarification or documentation.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : requests.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <AlertTriangle size={40} />
          <p>No information requests were found.</p>
          <p className="recommending-muted">If your workflow uses an information request status, those requests will appear here.</p>
        </div>
      ) : (
        <ReviewQueue requests={requests} onView={handleView} loading={loading} />
      )}
    </section>
  );
}

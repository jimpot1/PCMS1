import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import ReviewQueue from '../../components/ReviewQueue.jsx';
import { pcmsApi } from '../../services/api.js';

export default function ValidationAnomalies() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnomalies() {
      try {
        setLoading(true);
        setError(null);
        const allRequests = await pcmsApi.purchaseRequests({ limit: 200 });
        if (!mounted) return;
        const source = Array.isArray(allRequests) ? allRequests : [];
        const anomalies = source.filter((request) => {
          const validationStatus = String(request.validation_status || '').toLowerCase();
          const budgetStatus = String(request.budget_validation_status || '').toLowerCase();
          const anomalyStatus = String(request.anomaly_status || '').toLowerCase();
          const technicalStatus = String(request.technical_status || '').toLowerCase();

          return [validationStatus, budgetStatus, anomalyStatus, technicalStatus].some((status) =>
            status && status !== 'passed' && status !== 'approved' && status !== 'not_applicable'
          );
        });

        setRequests(anomalies);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load validation anomalies.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnomalies();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="recommending-panel-card">
      <div className="recommending-panel-header">
        <div>
          <h3>Validation / Anomalies</h3>
          <p>Purchase requests with validation concerns or anomaly flags.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">{error}</div>
      ) : requests.length === 0 && !loading ? (
        <div className="recommending-empty-state">
          <ShieldCheck size={40} />
          <p>No validation anomalies were detected.</p>
          <p className="recommending-muted">Requests with non-passing validation states will appear here.</p>
        </div>
      ) : (
        <ReviewQueue requests={requests} onView={(request) => window.location.assign(`/recommending-approver/review/${request.id}`)} loading={loading} />
      )}
    </section>
  );
}

import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function DepartmentAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.departmentHeadDashboard();
        if (!mounted) return;
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        if (!mounted) return;
        setError('Failed to load analytics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => { mounted = false; };
  }, []);

  const formatCurrency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Department Analytics</h3>
          <p>Approval trends and performance metrics for your department.</p>
        </div>
      </div>

      {error ? (
        <div className="form-message error">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : !analytics && !loading ? (
        <div className="department-empty-state">
          <p>No analytics available yet.</p>
        </div>
      ) : (
        <div className="department-analytics-grid">
          <div className="department-analytics-card">
            <div className="analytics-card-header">
              <BarChart3 size={18} />
              <span>Monthly Approvals</span>
            </div>
            <div className="analytics-card-value">{loading ? <Loader2 size={24} className="spin" /> : analytics.analytics?.monthly_approvals ?? 0}</div>
            <p className="analytics-card-note">Total approved requests this month.</p>
          </div>

          <div className="department-analytics-card">
            <div className="analytics-card-header">
              <Clock size={18} />
              <span>Average Review Time</span>
            </div>
            <div className="analytics-card-value">{loading ? <Loader2 size={24} className="spin" /> : analytics.average_review_time_hours ? `${analytics.average_review_time_hours} hrs` : '—'}</div>
            <p className="analytics-card-note">Average time to review department requests.</p>
          </div>

          <div className="department-analytics-card">
            <div className="analytics-card-header">
              <BarChart3 size={18} />
              <span>Pending Approvals</span>
            </div>
            <div className="analytics-card-value">{loading ? <Loader2 size={24} className="spin" /> : analytics.pending_approvals ?? 0}</div>
            <p className="analytics-card-note">Requests awaiting your review.</p>
          </div>

          <div className="department-analytics-card">
            <div className="analytics-card-header">
              <BarChart3 size={18} />
              <span>Returned for Revision</span>
            </div>
            <div className="analytics-card-value">{loading ? <Loader2 size={24} className="spin" /> : analytics.returned_for_revision ?? 0}</div>
            <p className="analytics-card-note">Requests sent back to requesters for updates.</p>
          </div>
        </div>
      )}
    </section>
  );
}

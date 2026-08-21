import React, { useEffect, useState } from 'react';
import { pcmsApi } from '../services/api.js';
import { Loader2, BarChart3, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

const formatCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) return 'PHP 0';
  return `PHP ${Number(value).toLocaleString()}`;
};

export default function ExecutiveAnalytics() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    waitingRelease: 0,
    released: 0,
    totalRequests: 0
  });
  const [topDepartments, setTopDepartments] = useState([]);
  const [latestApprovals, setLatestApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [pendingResponse, requestsResponse] = await Promise.all([
          pcmsApi.pendingApprovals(),
          pcmsApi.purchaseRequests({ limit: 200 })
        ]);

        const pendingCount = Array.isArray(pendingResponse)
          ? pendingResponse.length
          : pendingResponse?.data?.length || 0;

        const requests = Array.isArray(requestsResponse)
          ? requestsResponse
          : requestsResponse?.data || [];

        const approved = requests.filter((r) => r.status === 'approved').length;
        const rejected = requests.filter((r) => r.status === 'rejected').length;
        const waitingRelease = requests.filter((r) => r.current_stage === 'property_custodian' && r.status === 'pending').length;
        const released = requests.filter((r) => r.status === 'released').length;

        const departmentCounts = requests.reduce((acc, request) => {
          const department = request.department_name || request.department || 'Unknown';
          acc[department] = (acc[department] || 0) + 1;
          return acc;
        }, {});

        const topDepartmentsData = Object.entries(departmentCounts)
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        const latest = requests
          .filter((r) => r.status === 'approved' || r.status === 'rejected' || r.status === 'released')
          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
          .slice(0, 5);

        if (mounted) {
          setStats({
            pending: pendingCount,
            approved,
            rejected,
            waitingRelease,
            released,
            totalRequests: requests.length
          });
          setTopDepartments(topDepartmentsData);
          setLatestApprovals(latest);
        }
      } catch (err) {
        console.error('Error loading executive analytics:', err);
        if (mounted) setError('Unable to load analytics data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="exec-analytics">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Executive Analytics</h3>
            <p>Data-driven insights for President / CEO approval workflows.</p>
          </div>
        </div>

        {loading && (
          <div className="loading-card">
            <Loader2 size={18} className="spin" />
            Loading analytics...
          </div>
        )}

        {error && <div className="form-message error">{error}</div>}

        {!loading && !error && (
          <div className="exec-analytics-grid">
            <div className="exec-stat-card">
              <div className="stat-left"><Clock size={22} /></div>
              <div className="stat-right">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending executive approvals</div>
                <div className="stat-desc">Requests awaiting your decision.</div>
              </div>
            </div>
            <div className="exec-stat-card">
              <div className="stat-left"><CheckCircle2 size={22} /></div>
              <div className="stat-right">
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Approved this period</div>
                <div className="stat-desc">Requests moved to procurement stage.</div>
              </div>
            </div>
            <div className="exec-stat-card">
              <div className="stat-left"><TrendingUp size={22} /></div>
              <div className="stat-right">
                <div className="stat-value">{stats.waitingRelease}</div>
                <div className="stat-label">Waiting for release</div>
                <div className="stat-desc">Approved requests pending inventory processing.</div>
              </div>
            </div>
            <div className="exec-stat-card">
              <div className="stat-left"><BarChart3 size={22} /></div>
              <div className="stat-right">
                <div className="stat-value">{stats.totalRequests}</div>
                <div className="stat-label">Total executive requests</div>
                <div className="stat-desc">All requests in your approval scope.</div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="analytics-section">
            <div className="analytics-block">
              <h4>Top departments by request volume</h4>
              {topDepartments.length === 0 ? (
                <div className="analytics-empty">No department activity yet.</div>
              ) : (
                <div className="analytics-list">
                  {topDepartments.map((department) => (
                    <div key={department.department} className="analytics-row">
                      <span>{department.department}</span>
                      <div className="analytics-bar-wrap">
                        <div className="analytics-bar" style={{ width: `${Math.max(10, Math.min(100, department.count * 15))}%` }} />
                      </div>
                      <strong>{department.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="analytics-block">
              <h4>Recent executive actions</h4>
              {latestApprovals.length === 0 ? (
                <div className="analytics-empty">No recent approvals or rejections.</div>
              ) : (
                <div className="analytics-list analytics-actions">
                  {latestApprovals.map((request) => (
                    <div key={request.id || request.request_number} className="analytics-row">
                      <span>{request.request_number || 'Request'}</span>
                      <span>{request.status?.replace('_', ' ') || 'Updated'}</span>
                      <span>{request.updated_at ? new Date(request.updated_at).toLocaleDateString() : new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

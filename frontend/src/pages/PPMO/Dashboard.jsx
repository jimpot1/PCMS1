import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, ClipboardCheck, PackageCheck, RefreshCw, RotateCcw, Truck } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

function formatDashboardDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatStage(value) {
  return String(value || 'Awaiting receipt').replace(/_/g, ' ');
}

function getActivityStatusTone(status) {
  if (status === 'Resolved' || status === 'QC passed' || status === 'Completed') return 'success';
  if (status === 'QC failed') return 'danger';
  if (status === 'QC on hold' || status === 'Partial release') return 'warning';
  return '';
}

export default function PPMODashboard() {
  const navigate = useNavigate();
  const [releaseQueue, setReleaseQueue] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [queueError, setQueueError] = useState(null);
  const [metricsError, setMetricsError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let active = true;
    let requestInFlight = false;

    const loadDashboard = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      if (!hasLoaded.current) setLoading(true);
      else setRefreshing(true);

      const [queueResult, metricsResult] = await Promise.allSettled([
        pcmsApi.ppmoReleaseQueue(),
        pcmsApi.ppmoMetrics(),
      ]);

      if (active) {
        if (queueResult.status === 'fulfilled') {
          setReleaseQueue({
            purchaseRequests: Array.isArray(queueResult.value?.purchaseRequests) ? queueResult.value.purchaseRequests : [],
            gatePasses: Array.isArray(queueResult.value?.gatePasses) ? queueResult.value.gatePasses : [],
          });
          setQueueError(null);
        } else {
          setQueueError(queueResult.reason?.message || 'Unable to load the release queue.');
        }

        if (metricsResult.status === 'fulfilled') {
          setMetrics(metricsResult.value || {});
          setMetricsError(null);
        } else {
          setMetricsError(metricsResult.reason?.message || 'Unable to load dashboard metrics.');
        }

        hasLoaded.current = true;
        setLoading(false);
        setRefreshing(false);
      }

      requestInFlight = false;
    };

    loadDashboard();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadDashboard();
    }, 20000);
    window.addEventListener('pcms:dataChanged', loadDashboard);
    window.addEventListener('pcms:anomaly-data-changed', loadDashboard);
    window.addEventListener('focus', loadDashboard);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('pcms:dataChanged', loadDashboard);
      window.removeEventListener('pcms:anomaly-data-changed', loadDashboard);
      window.removeEventListener('focus', loadDashboard);
    };
  }, [refreshNonce]);

  const purchaseRequests = releaseQueue?.purchaseRequests || [];
  const gatePasses = releaseQueue?.gatePasses || [];
  const releaseItems = [];
  const seenReleaseItems = new Set();

  for (const item of purchaseRequests) {
    const key = `purchase-${item.id}`;
    if (!seenReleaseItems.has(key)) {
      seenReleaseItems.add(key);
      releaseItems.push({
        id: key,
        reference: item.request_number || `Request ${item.id}`,
        type: 'Purchase request',
        department: item.department?.name || item.department_name || 'Department not assigned',
        detail: item.requester?.email || item.requested_by_name || 'Requester not available',
      });
    }
  }

  for (const item of gatePasses) {
    const key = `gate-pass-${item.id}`;
    if (!seenReleaseItems.has(key)) {
      seenReleaseItems.add(key);
      releaseItems.push({
        id: key,
        reference: item.gate_pass_number || `Gate pass ${item.id}`,
        type: 'Gate pass',
        department: item.department?.name || item.department_name || 'Department not assigned',
        detail: item.requester?.email || 'Requester not available',
      });
    }
  }

  const receivingActions = Array.isArray(metrics?.receiving_actions) ? metrics.receiving_actions : [];
  const recentOperations = Array.isArray(metrics?.recent_operations) ? metrics.recent_operations : [];
  const releaseActivity = Array.isArray(metrics?.release_activity)
    ? metrics.release_activity.map((item) => ({
      ...item,
      label: item.date
        ? new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : item.label,
    }))
    : [];
  const weeklyReleaseCount = releaseActivity.reduce((total, item) => total + Number(item.releases || 0), 0);
  const overdueReturns = Number(metrics?.overdue_returns || 0);
  const returnsDue = Number(metrics?.returns_due || 0);
  const openAnomalies = Number(metrics?.open_anomaly_alerts || 0);
  const retry = () => setRefreshNonce((current) => current + 1);

  const cards = [
    { label: 'Ready for release', value: releaseQueue ? releaseItems.length : '—', detail: 'Approved items awaiting processing', icon: PackageCheck, tone: 'blue', route: '/ppmo/approved-release-queue' },
    { label: 'Receiving & QC', value: metrics ? Number(metrics.receiving_action_count || 0) : '—', detail: 'Purchase orders needing receipt or QC', icon: Truck, tone: 'teal', route: '/ppmo/receive-deliveries' },
    { label: 'Returns due in 7 days', value: metrics ? returnsDue : '—', detail: `${overdueReturns} overdue`, icon: RotateCcw, tone: 'orange', route: '/ppmo/returns' },
    { label: 'Overdue returns', value: metrics ? overdueReturns : '—', detail: 'Active assignments past due', icon: ClipboardCheck, tone: 'indigo', route: '/ppmo/returns' },
    { label: 'Open anomaly alerts', value: metrics ? openAnomalies : '—', detail: 'Unresolved inventory alerts', icon: AlertTriangle, tone: 'red', route: '/ppmo/monitoring' },
  ];

  return (
    <div className="ppmo-dashboard-page">
      <header className="ppmo-dashboard-header">
        <div>
          <p className="ppmo-dashboard-eyebrow">Property operations</p>
          <h2>PPMO Dashboard</h2>
          <p>Review work ready for processing, upcoming returns, and inventory alerts.</p>
        </div>
        <div className="ppmo-dashboard-header-actions">
          <button className="staff-icon-btn" type="button" onClick={retry} disabled={refreshing} aria-label="Refresh dashboard" title="Refresh dashboard">
            <RefreshCw size={16} className={refreshing ? 'is-spinning' : ''} />
          </button>
          <button className="primary-button" type="button" onClick={() => navigate('/ppmo/approved-release-queue')}>
            <PackageCheck size={16} /> Review release queue <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <section className="ppmo-dashboard-stat-grid" aria-label="Operational summary">
        {loading && !hasLoaded.current ? cards.map(({ label, icon: Icon }) => (
          <div className="ppmo-dashboard-stat-skeleton" key={label} aria-label={`Loading ${label}`}>
            <span className="ppmo-dashboard-skeleton-icon"><Icon size={18} /></span>
            <span className="ppmo-dashboard-skeleton-line" />
            <span className="ppmo-dashboard-skeleton-value" />
          </div>
        )) : cards.map(({ icon: Icon, label, value, detail, tone, route }) => (
          <button key={label} className={`ppmo-dashboard-stat ${tone}`} type="button" onClick={() => navigate(route)}>
            <span className="ppmo-dashboard-stat-icon"><Icon size={18} /></span>
            <span className="ppmo-dashboard-stat-label">{label}</span>
            <strong>{value}</strong>
            <span className="ppmo-dashboard-stat-detail">{detail}</span>
          </button>
        ))}
      </section>

      <section className="ppmo-dashboard-primary-grid">
        <section className="staff-panel ppmo-dashboard-panel ppmo-action-panel">
          <div className="ppmo-dashboard-panel-header">
            <div>
              <h3>Action required</h3>
              <p>Queues and records that need PPMO processing.</p>
            </div>
          </div>

          <div className="ppmo-dashboard-action-group">
            <div className="ppmo-dashboard-group-heading">
              <h4>Ready for release</h4>
              <button type="button" className="ppmo-dashboard-text-link" onClick={() => navigate('/ppmo/approved-release-queue')}>View queue</button>
            </div>
            {queueError ? (
              <div className="ppmo-dashboard-inline-error" role="alert">
                <span>{queueError}</span>
                <button type="button" onClick={retry}>Retry</button>
              </div>
            ) : loading && !releaseQueue ? (
              <div className="ppmo-dashboard-empty">Loading release queue...</div>
            ) : releaseItems.length === 0 ? (
              <div className="ppmo-dashboard-empty">No approved items are waiting for release.</div>
            ) : (
              <div className="ppmo-dashboard-action-list">
                {releaseItems.slice(0, 4).map((item) => (
                  <button key={item.id} type="button" className="ppmo-dashboard-action-row" onClick={() => navigate('/ppmo/approved-release-queue')}>
                    <span className="ppmo-dashboard-action-copy">
                      <strong>{item.reference}</strong>
                      <small>{item.type} · {item.department} · {item.detail}</small>
                    </span>
                    <span className="ppmo-dashboard-tag">Ready</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ppmo-dashboard-action-group">
            <div className="ppmo-dashboard-group-heading">
              <h4>Receiving & quality control</h4>
              <button type="button" className="ppmo-dashboard-text-link" onClick={() => navigate('/ppmo/receive-deliveries')}>View receiving</button>
            </div>
            {metricsError ? (
              <div className="ppmo-dashboard-inline-error" role="alert">
                <span>{metricsError}</span>
                <button type="button" onClick={retry}>Retry</button>
              </div>
            ) : loading && !metrics ? (
              <div className="ppmo-dashboard-empty">Loading receiving work...</div>
            ) : receivingActions.length === 0 ? (
              <div className="ppmo-dashboard-empty">No purchase orders are waiting for receipt or quality control.</div>
            ) : (
              <div className="ppmo-dashboard-action-list">
                {receivingActions.slice(0, 4).map((item) => {
                  const receivingState = item.qc_status && item.qc_status !== 'pending'
                    ? `QC ${formatStage(item.qc_status)}`
                    : item.procurement_status === 'received' ? 'QC pending' : 'Receipt pending';
                  return (
                    <button key={item.id} type="button" className="ppmo-dashboard-action-row" onClick={() => navigate('/ppmo/receive-deliveries')}>
                      <span className="ppmo-dashboard-action-copy">
                        <strong>{item.request_number || `Purchase order ${item.id}`}</strong>
                        <small>{item.department || 'Department not assigned'} · Updated {formatDashboardDate(item.updated_at)}</small>
                      </span>
                      <span className="ppmo-dashboard-tag warning">{receivingState}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {(returnsDue > 0 || overdueReturns > 0 || openAnomalies > 0) && !metricsError && (
            <div className="ppmo-dashboard-alert-links">
              {(returnsDue > 0 || overdueReturns > 0) && (
                <button type="button" className="ppmo-dashboard-alert-link" onClick={() => navigate('/ppmo/returns')}>
                  <RotateCcw size={15} /> {overdueReturns > 0 ? `${overdueReturns} overdue return${overdueReturns === 1 ? '' : 's'}` : `${returnsDue} return${returnsDue === 1 ? '' : 's'} due this week`}
                </button>
              )}
              {openAnomalies > 0 && (
                <button type="button" className="ppmo-dashboard-alert-link danger" onClick={() => navigate('/ppmo/monitoring')}>
                  <AlertTriangle size={15} /> {openAnomalies} unresolved anomaly alert{openAnomalies === 1 ? '' : 's'}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="staff-panel ppmo-dashboard-panel ppmo-dashboard-chart-panel">
          <div className="ppmo-dashboard-panel-header">
            <div>
              <h3>Release activity</h3>
              <p>Recorded purchase, supply, and gate-pass releases over the last 7 days.</p>
            </div>
            {!metricsError && metrics && <strong className="ppmo-dashboard-chart-total">{weeklyReleaseCount} total</strong>}
          </div>
          {metricsError ? (
            <div className="ppmo-dashboard-inline-error" role="alert">
              <span>{metricsError}</span>
              <button type="button" onClick={retry}>Retry</button>
            </div>
          ) : loading && !metrics ? (
            <div className="ppmo-dashboard-chart-skeleton" aria-label="Loading release activity" />
          ) : weeklyReleaseCount === 0 ? (
            <div className="ppmo-dashboard-chart-empty">No release activity recorded for this period.</div>
          ) : (
            <div className="ppmo-dashboard-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={releaseActivity} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--text-light)', fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={36} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-light)', fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="releases" name="Completed releases" stroke="#4f91e8" strokeWidth={2} fill="rgba(79, 145, 232, 0.16)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </section>

      <section className="staff-panel ppmo-dashboard-panel ppmo-dashboard-recent-panel">
        <div className="ppmo-dashboard-panel-header">
          <div>
            <h3>Recent operational activity</h3>
            <p>Latest recorded releases, returns, receiving, QC, and anomaly resolutions.</p>
          </div>
        </div>
        {metricsError ? (
          <div className="ppmo-dashboard-inline-error" role="alert">
            <span>{metricsError}</span>
            <button type="button" onClick={retry}>Retry</button>
          </div>
        ) : loading && !metrics ? (
          <div className="ppmo-dashboard-empty">Loading recent activity...</div>
        ) : recentOperations.length === 0 ? (
          <div className="ppmo-dashboard-empty">No recent PPMO operational activity recorded.</div>
        ) : (
          <ul className="ppmo-dashboard-activity-list">
            {recentOperations.map((item) => (
              <li key={item.id}>
                <span className="ppmo-dashboard-activity-marker" />
                <span className="ppmo-dashboard-activity-copy">
                  <strong>{item.text || formatStage(item.action)}</strong>
                  <small>{formatDashboardDate(item.time)}</small>
                </span>
                {item.status && <span className={`ppmo-dashboard-tag ${getActivityStatusTone(item.status)}`}>{item.status}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
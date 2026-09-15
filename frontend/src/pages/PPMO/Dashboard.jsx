import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PackageCheck, Boxes, Truck, RotateCcw, ClipboardList, Printer, QrCode, Barcode, FileText, CheckCircle2, Bell } from 'lucide-react';
import StaffStatCard from '../../components/StaffStatCard.jsx';
import { pcmsApi } from '../../services/api.js';

export default function PPMODashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [receiving, setReceiving] = useState([]);
  const [verification, setVerification] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [queueResponse, receivingResponse, metricsResponse] = await Promise.all([
          pcmsApi.ppmoReleaseQueue(),
          pcmsApi.fetchGatePasses({ limit: 10 }),
          pcmsApi.ppmoMetrics()
        ]);

        if (!mounted) return;

        setQueue([
          ...queueResponse.purchaseRequests.slice(0, 5).map((item) => ({ id: item.id, type: 'Purchase Request', reference: item.request_number, requester: item.requester?.email || 'Unknown', department: item.department?.name || item.department_name || 'Unknown', status: item.status || 'Approved', preparedBy: item.prepared_by || 'PPMO', releaseDate: item.updated_at || item.created_at || 'TBD' })),
          ...queueResponse.gatePasses.slice(0, 5).map((item) => ({ id: item.id, type: 'Gate Pass', reference: item.gate_pass_number, requester: item.requester?.email || 'Unknown', department: item.department?.name || item.department_name || 'Unknown', status: item.status || 'Approved', preparedBy: item.prepared_by || 'PPMO', releaseDate: item.updated_at || item.created_at || 'TBD' }))
        ]);

        setReceiving(receivingResponse.slice(0, 5).map((item) => ({ id: item.id, supplier: item.supplier_name || 'Supplier', purchaseOrder: item.purchase_order_number || item.id, items: item.items_count || 0, arrivalTime: item.arrival_time || item.updated_at || '', status: item.status || 'Pending' })));
        setVerification([{ id: 1, label: 'Stock verification needed', details: 'Select items pending physical verification.' }]);
        const currentMetrics = metricsResponse?.weekly_summary?.current || {};

        setStats({
          approvedReleases: queueResponse.purchaseRequests.length + queueResponse.gatePasses.length,
          itemsReady: queueResponse.purchaseRequests.length + queueResponse.gatePasses.length,
          todaysDeliveries: receivingResponse.length,
          pendingReturns: currentMetrics.pending_returns ?? metricsResponse?.pending_returns ?? 0,
          stockCountTasks: currentMetrics.stock_count_tasks ?? metricsResponse?.stock_count_tasks ?? 0,
          documentsPendingPrint: currentMetrics.documents_pending_print ?? metricsResponse?.documents_pending_print ?? 0
        });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        if (!mounted) setLoading(false);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false };
  }, []);

  if (error) {
    return <div className="staff-panel"><div className="form-message error">{error}</div></div>;
  }

  const handleQuickAction = (route) => navigate(route);
  const statCards = [
    { icon: PackageCheck, label: 'Approved Releases This Week', value: stats?.approvedReleases ?? '—', tone: 'blue', route: '/ppmo/approved-release-queue' },
    { icon: RotateCcw, label: 'Pending Returns This Week', value: stats?.pendingReturns ?? '—', tone: 'orange', route: '/ppmo/returns' },
    { icon: Printer, label: 'Documents Pending Print This Week', value: stats?.documentsPendingPrint ?? '—', tone: 'indigo', route: '/ppmo/purchase-order-documents' }
  ];

  const releaseTrendData = [
    { day: 'Mon', approved: 0, released: 0 },
    { day: 'Tue', approved: 0, released: 0 },
    { day: 'Wed', approved: 0, released: 0 },
    { day: 'Thu', approved: 0, released: 0 },
    { day: 'Fri', approved: 0, released: 0 },
    { day: 'Sat', approved: 0, released: 0 }
  ];

  const operationalLoadData = [
    { name: 'Release', value: 0 },
    { name: 'Receiving', value: 0 },
    { name: 'Audit', value: 0 },
    { name: 'Returns', value: 0 }
  ];

  const quickActions = [
    { label: 'Prepare Release', icon: PackageCheck, route: '/ppmo/release-receipt-preparation' },
    { label: 'Print Gate Pass', icon: FileText, route: '/ppmo/gate-pass-preparation' },
    { label: 'Supplies Inventory', icon: Boxes, route: '/ppmo/supplies' },
    { label: 'OCR Asset Tagging', icon: QrCode, route: '/ppmo/ocr' }
  ];

  return (
    <div className="staff-dashboard-page">
      <section className="staff-hero-card">
        <div className="staff-hero-copy">
          <p>Operations overview</p>
          <h2>Assist in inventory operations, releases, receiving, and documentation.</h2>
        </div>
        <div className="staff-hero-actions">
          <button className="primary-button" type="button" onClick={() => handleQuickAction('/ppmo/release-receipt-preparation')}>Prepare Release</button>
          <button className="secondary-button" type="button" onClick={() => handleQuickAction('/ppmo/supplies')}>Supplies Inventory</button>
        </div>
      </section>

      <section className="staff-stats-grid">
        {statCards.map(({ icon, label, value, tone, route }) => (
          <StaffStatCard key={label} icon={icon} label={label} value={value} tone={tone} onClick={() => handleQuickAction(route)} />
        ))}
      </section>

      <section className="staff-analytics-grid">
        <div className="staff-panel staff-chart-panel">
          <div className="staff-panel-header">
            <div>
              <h3>Release Trend</h3>
              <p>Approved vs released items across the week.</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={releaseTrendData}>
                <defs>
                  <linearGradient id="approvedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="releasedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="approved" stroke="#2563eb" strokeWidth={2.5} fill="url(#approvedFill)" />
                <Area type="monotone" dataKey="released" stroke="#14b8a6" strokeWidth={2.5} fill="url(#releasedFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="staff-panel staff-chart-panel">
          <div className="staff-panel-header">
            <div>
              <h3>Operational Load</h3>
              <p>Current workload mix across workflow areas.</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={operationalLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="staff-dashboard-grid">
        <div className="staff-panel">
          <div className="staff-panel-header">
            <div>
              <h3>Approved Release Queue</h3>
              <p>Shows approved requests assigned by Property Custodian.</p>
            </div>
          </div>
          {loading ? <div className="loading-card">Loading approved releases…</div> : (
            <div className="staff-table-scroll">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Requester</th>
                    <th>Department</th>
                    <th>Release Status</th>
                    <th>Prepared By</th>
                    <th>Release Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr><td colSpan="7" className="empty-state">No approved requests assigned.</td></tr>
                  ) : queue.map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>{item.reference}</td>
                      <td>{item.requester}</td>
                      <td>{item.department}</td>
                      <td><span className="status success">{item.status}</span></td>
                      <td>{item.preparedBy}</td>
                      <td>{item.releaseDate}</td>
                      <td><button className="secondary-button" type="button">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="staff-panel">
          <div className="staff-panel-header">
            <div>
              <h3>Today's Receiving</h3>
              <p>Incoming deliveries.</p>
            </div>
          </div>
          {loading ? <div className="loading-card">Loading deliveries…</div> : (
            <div className="staff-table-scroll">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Purchase Order</th>
                    <th>Items</th>
                    <th>Arrival Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receiving.length === 0 ? (
                    <tr><td colSpan="5" className="empty-state">No deliveries scheduled today.</td></tr>
                  ) : receiving.map((item) => (
                    <tr key={item.id}>
                      <td>{item.supplier}</td>
                      <td>{item.purchaseOrder}</td>
                      <td>{item.items}</td>
                      <td>{item.arrivalTime}</td>
                      <td><span className={`status ${item.status === 'Pending' ? 'warning' : 'success'}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="staff-panel">
          <div className="staff-panel-header">
            <div>
              <h3>Stock Verification</h3>
              <p>Shows inventory requiring verification.</p>
            </div>
          </div>
          <div className="staff-panel-content">
            {verification.map((item) => (
              <div key={item.id} className="staff-block-item">
                <strong>{item.label}</strong>
                <p>{item.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="staff-panel">
        <div className="staff-panel-header">
          <div>
            <h3>Quick Actions</h3>
            <p>Common operational workflows for PPMO staff.</p>
          </div>
        </div>
        <div className="staff-quick-grid">
          {quickActions.map(({ label, icon: Icon, route }) => (
            <button key={label} className="staff-quick-action" type="button" onClick={() => handleQuickAction(route)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { PackageCheck, Boxes, Truck, RotateCcw, ClipboardList, Printer, QrCode, Barcode, FileText, CheckCircle2, Bell } from 'lucide-react';
import StaffStatCard from '../../components/StaffStatCard.jsx';
import StaffQuickActionCard from '../../components/StaffQuickActionCard.jsx';
import { pcmsApi } from '../../services/api.js';

export default function PPMODashboard() {
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
        setStats({
          approvedReleases: queueResponse.purchaseRequests.length + queueResponse.gatePasses.length,
          itemsReady: queueResponse.purchaseRequests.length + queueResponse.gatePasses.length,
          todaysDeliveries: receivingResponse.length,
          pendingReturns: metricsResponse?.pending_returns || 0,
          stockCountTasks: metricsResponse?.stock_count_tasks || 0,
          documentsPendingPrint: metricsResponse?.documents_pending_print || 0
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

  return (
    <div className="staff-dashboard-page">
      <section className="staff-hero-card">
        <div>
          <p>Welcome back, Staff!</p>
          <h2>Assist in inventory operations, releases, receiving, and documentation.</h2>
        </div>
        <div className="staff-hero-actions">
          <button className="primary-button" type="button">Prepare Release</button>
          <button className="secondary-button" type="button">Receive Delivery</button>
        </div>
      </section>

      <section className="staff-stats-grid">
        <StaffStatCard icon={PackageCheck} label="Approved Releases Waiting" value={stats?.approvedReleases ?? '—'} tone="blue" />
        <StaffStatCard icon={Boxes} label="Items Ready for Release" value={stats?.itemsReady ?? '—'} tone="blue" />
        <StaffStatCard icon={Truck} label="Today's Deliveries" value={stats?.todaysDeliveries ?? '—'} tone="teal" />
        <StaffStatCard icon={RotateCcw} label="Pending Returns" value={stats?.pendingReturns ?? '—'} tone="orange" />
        <StaffStatCard icon={ClipboardList} label="Stock Count Tasks" value={stats?.stockCountTasks ?? '—'} tone="purple" />
        <StaffStatCard icon={Printer} label="Documents Pending Print" value={stats?.documentsPendingPrint ?? '—'} tone="indigo" />
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
          {[
            ['Prepare Release', PackageCheck],
            ['Receive Delivery', Truck],
            ['Print Gate Pass', FileText],
            ['Print Receipt', FileText],
            ['Scan QR', QrCode],
            ['Scan Barcode', Barcode],
            ['Stock Count', ClipboardList],
            ['Inventory Verification', CheckCircle2]
          ].map(([label, Icon]) => (
            <button key={label} className="staff-quick-action" type="button"><Icon size={18} />{label}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
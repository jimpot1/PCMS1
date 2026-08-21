import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, Eye, Package, PackageCheck, FileText, Shield, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function OicDashboard() {
  const location = useLocation();
  const isQueueView = location.pathname.endsWith('/release-queue');
  const [queue, setQueue] = useState({ purchaseRequests: [], gatePasses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await pcmsApi.oicReleaseQueue();
      setQueue({
        purchaseRequests: data.purchaseRequests || [],
        gatePasses: data.gatePasses || [],
      });
      setError(null);
    } catch (err) {
      setError(err?.message || 'Unable to load release queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const queueItems = useMemo(() => {
    return [
      ...queue.purchaseRequests.map((item) => ({
        ...item,
        type: 'purchase',
        label: 'Purchase Request',
        ref: item.request_number,
        detail: item.purpose || `PHP ${Number(item.total_amount || 0).toLocaleString()}`,
      })),
      ...queue.gatePasses.map((item) => ({
        ...item,
        type: 'gate_pass',
        label: 'Gate Pass',
        ref: item.gate_pass_number,
        detail: item.purpose || 'Gate pass ready for release',
      })),
    ];
  }, [queue]);

  const stats = useMemo(() => ({
    countReady: queueItems.length,
    purchaseCount: queue.purchaseRequests.length,
    gatePassCount: queue.gatePasses.length,
    lastUpdated: loading ? 'Loading...' : `${queueItems.length} item${queueItems.length === 1 ? '' : 's'} ready`,
  }), [queue, queueItems.length, loading]);

  const authorizeItem = async (item) => {
    const itemKey = `${item.type}-${item.id}`;
    try {
      setError(null);
      setMessage(null);
      const staffProcessing = item.type === 'purchase' && item.request_type === 'request' && ['asset_assignment', 'supplies_inventory_release'].includes(item.workflow_destination);
      if (!window.confirm(`Authorize ${item.label} ${item.ref} for ${staffProcessing ? 'staff processing' : 'release'}?`)) {
        return;
      }
      setProcessingId(itemKey);
      if (staffProcessing) {
        await pcmsApi.advancePurchaseRequest(item.id);
      } else {
        await pcmsApi.oicRelease(item.type, item.id);
      }
      setMessage(`${item.label} ${item.ref} was authorized successfully.`);
      await loadQueue();
    } catch (err) {
      setError(err?.message || 'Authorization failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const viewDetails = (item) => setSelectedItem(item);

  return (
    <div className="oic-dashboard">
      {!isQueueView && <section className="oic-hero">
        <div>
          <p className="eyebrow">Final Release Operations</p>
          <h2>Welcome to the Property Custodian dashboard.</h2>
          <p>Verify fully approved requests, authorize release, and hand operational processing to staff.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => { window.location.href = '/oic/release-queue'; }}>Review Release Queue</button>
      </section>}

      {!isQueueView && <section className="oic-stat-grid">
        <article className="oic-stat-card">
          <div className="stat-icon"><Package size={20} /></div>
          <div>
            <strong>{stats.purchaseCount}</strong>
            <span>Awaiting OIC Authorization</span>
          </div>
        </article>
        <article className="oic-stat-card">
          <div className="stat-icon"><FileText size={20} /></div>
          <div>
            <strong>{stats.gatePassCount}</strong>
            <span>Gate Passes to Authorize</span>
          </div>
        </article>
        <article className="oic-stat-card">
          <div className="stat-icon"><CheckCircle2 size={20} /></div>
          <div>
            <strong>{stats.countReady}</strong>
            <span>Awaiting Authorization</span>
          </div>
        </article>
        <article className="oic-stat-card">
          <div className="stat-icon"><Shield size={20} /></div>
          <div>
            <strong>{stats.lastUpdated}</strong>
            <span>Queue status</span>
          </div>
        </article>
      </section>}

      {message && <div className="form-message success">{message}</div>}
      {error && <div className="form-message error">{error}</div>}

      <section className="oic-panel">
        <div className="panel-header">
          <div>
            <h3>{isQueueView ? 'Release Queue' : 'Approved Releases'}</h3>
            <p>Verify fully approved requests before staff completes the operational release.</p>
          </div>
          <button className="secondary-button" type="button" onClick={loadQueue}><RefreshCw size={15} /> Refresh Queue</button>
        </div>

        {loading ? (isQueueView ? (
          <div className="table-responsive oic-release-table-wrap"><table className="data-table oic-release-table"><thead><tr><th>Type</th><th>Reference</th><th>Requester</th><th>Status</th><th>Details</th><th>Actions</th></tr></thead><tbody><tr><td colSpan="6" className="table-loading-row">Loading release queue...</td></tr></tbody></table></div>
        ) : <div className="loading-card">Loading queue...</div>) : queueItems.length === 0 ? (
          <div className="empty-state">No approved items are waiting for release right now.</div>
        ) : isQueueView ? (
          <div className="table-responsive oic-release-table-wrap">
            <table className="data-table oic-release-table">
              <thead><tr><th>Type</th><th>Reference</th><th>Requester</th><th>Status</th><th>Details</th><th>Actions</th></tr></thead>
              <tbody>{queueItems.map((item) => { const itemKey = `${item.type}-${item.id}`; return <tr key={itemKey}><td>{item.label}</td><td className="font-mono">{item.ref}</td><td>{item.requester?.email || item.requester?.name || '-'}</td><td><span className="status success">{item.status || 'approved'}</span></td><td>{item.detail}</td><td><div className="oic-row-actions"><button className="workflow-icon-button" type="button" title="View details" aria-label={`View details for ${item.ref}`} onClick={() => viewDetails(item)}><Eye size={16} /></button><button className="workflow-icon-button" type="button" title="Authorize release" aria-label={`Authorize ${item.ref}`} onClick={() => authorizeItem(item)} disabled={processingId === itemKey}>{processingId === itemKey ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}</button></div></td></tr>; })}</tbody>
            </table>
          </div>
        ) : (
          <div className="oic-queue-list">
            {queueItems.map((item) => (
              <article className="oic-queue-card" key={`${item.type}-${item.id}`}>
                <div>
                  <strong>{item.label}: {item.ref}</strong>
                  <p>{item.detail}</p>
                  <div className="meta">Status: {item.status || 'approved'} · Requested by: {item.requester?.email || item.requester?.name || 'Unknown'}</div>
                </div>
                <div className="card-actions">
                  <button className="primary-button" type="button" onClick={() => authorizeItem(item)} disabled={processingId === `${item.type}-${item.id}`}>{processingId === `${item.type}-${item.id}` ? 'Authorizing...' : 'Authorize Release'}</button>
                  <button className="muted-button" type="button" onClick={() => viewDetails(item)}>View details <ArrowRight size={14} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selectedItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="oic-request-details-title" onClick={() => setSelectedItem(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 id="oic-request-details-title">{selectedItem.label} Details</h3>
              <button className="icon-button" type="button" aria-label="Close details" onClick={() => setSelectedItem(null)}>×</button>
            </div>
            <div className="asset-description-card">
              <p><strong>Reference:</strong> {selectedItem.ref}</p>
              <p><strong>Requester:</strong> {selectedItem.requester?.email || selectedItem.requester?.name || '-'}</p>
              <p><strong>Status:</strong> {selectedItem.status || 'approved'}</p>
              <p><strong>Details:</strong> {selectedItem.detail}</p>
              <p><strong>Next step:</strong> PPMO Staff operational processing after authorization.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

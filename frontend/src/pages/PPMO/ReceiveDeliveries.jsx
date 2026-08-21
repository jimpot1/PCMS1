import React, { useEffect, useState } from 'react';
import { PackageOpen, Loader2, AlertTriangle, CheckCircle2, PackageCheck } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function ReceiveDeliveries() {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);
  const [receivingNotes, setReceivingNotes] = useState('');

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch deliverable gate passes
        const data = await pcmsApi.requesterGatePasses({ deliverable: true });
        setGatePasses(data?.data || []);
      } catch (err) {
        console.error('Error loading deliveries:', err);
        setError('Failed to load deliveries');
      } finally {
        setLoading(false);
      }
    };

    loadDeliveries();
  }, []);

  const handleReceiveDelivery = async (id) => {
    try {
      // Scan/receive the gate pass
      await pcmsApi.scanGatePass(id);
      // Reload the list
      const data = await pcmsApi.requesterGatePasses({ deliverable: true });
      setGatePasses(data?.data || []);
      setSelectedPass(null);
      setReceivingNotes('');
    } catch (err) {
      setError(`Failed to receive delivery: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="panel">
          <div className="loading-state">
            <Loader2 size={40} className="spin" />
            <p>Loading deliveries...</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingDeliveries = gatePasses.filter(gp => gp.status === 'released' || gp.status === 'in_transit');

  return (
    <div className="page-container">
      <section className="page-header">
        <h1>Receive Deliveries</h1>
        <p>Receive and scan incoming deliveries</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="panel">
        {pendingDeliveries.length === 0 ? (
          <div className="empty-state">
            <PackageOpen size={48} />
            <p>No deliveries to receive</p>
            <p className="text-muted">Released items ready for delivery will appear here</p>
          </div>
        ) : (
          <>
            <div className="section-header">
              <h3>Pending Deliveries ({pendingDeliveries.length})</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Delivery #</th>
                    <th>Requester</th>
                    <th>Department</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDeliveries.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className="font-mono">{delivery.id || 'N/A'}</td>
                      <td>{delivery.requester_name || '-'}</td>
                      <td>{delivery.department || '-'}</td>
                      <td>
                        <span className="badge">{Array.isArray(delivery.items) ? delivery.items.length : 0} item(s)</span>
                      </td>
                      <td>
                        <span className={`badge badge-${delivery.status}`}>{delivery.status}</span>
                      </td>
                      <td>
                        <button
                          className="staff-action-button primary"
                          title="Receive Delivery"
                          aria-label={`Receive delivery ${delivery.id || ''}`}
                          onClick={() => setSelectedPass(delivery)}
                        >
                          <PackageCheck size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedPass && (
        <div className="panel">
          <div className="modal-like-container">
            <div className="modal-header">
              <h3>Receive Delivery</h3>
              <button className="close-button" onClick={() => setSelectedPass(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div>
                  <label>Delivery Number</label>
                  <p>{selectedPass.id || 'N/A'}</p>
                </div>
                <div>
                  <label>Requester</label>
                  <p>{selectedPass.requester_name || '-'}</p>
                </div>
                <div>
                  <label>Department</label>
                  <p>{selectedPass.department || '-'}</p>
                </div>
                <div>
                  <label>Status</label>
                  <p className="badge">{selectedPass.status}</p>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Items Being Delivered</h4>
                {Array.isArray(selectedPass.items) && selectedPass.items.length > 0 ? (
                  <ul className="item-list">
                    {selectedPass.items.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name || item.description || `Item ${idx + 1}`}</strong>
                        <span className="text-muted"> - Qty: {item.quantity || 1}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No items listed</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="receiving-notes">Receiving Notes (Optional)</label>
                <textarea
                  id="receiving-notes"
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  placeholder="Enter any notes about the delivery condition, items received, etc."
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="primary-button"
                  onClick={() => handleReceiveDelivery(selectedPass.id)}
                >
                  <CheckCircle2 size={16} />
                  Confirm Receipt
                </button>
                <button className="secondary-button" onClick={() => setSelectedPass(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

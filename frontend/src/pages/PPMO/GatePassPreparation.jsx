import React, { useEffect, useState } from 'react';
import { QrCode, Loader2, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';
import { TableSkeleton } from '../../components/TableSkeleton.jsx';

export default function GatePassPreparation() {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    const loadGatePasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.fetchGatePasses({ limit: 100 });
        setGatePasses(data?.data || []);
      } catch (err) {
        console.error('Error loading gate passes:', err);
        setError('Failed to load gate passes');
      } finally {
        setLoading(false);
      }
    };

    loadGatePasses();
  }, []);

  const handleApproveGatePass = async (id) => {
    try {
      await pcmsApi.approveGatePass(id);
      // Reload the list
      const data = await pcmsApi.fetchGatePasses({ limit: 100 });
      setGatePasses(data?.data || []);
      setSelectedPass(null);
    } catch (err) {
      setError(`Failed to approve gate pass: ${err.message}`);
    }
  };

  const pendingGatePasses = gatePasses.filter(gp => gp.status === 'pending' || gp.status === 'approved');

  return (
    <div className="page-container">
      <section className="page-header">
        <h1>Gate Pass Preparation</h1>
        <p>Prepare and manage gate passes for item releases</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="panel">
        <div className="section-header"><h3>Pending Gate Passes ({loading ? '...' : pendingGatePasses.length})</h3></div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Gate Pass #</th>
                    <th>Requester</th>
                    <th>Items</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <TableSkeleton columns={6} /> : pendingGatePasses.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">No gate passes to prepare</td></tr>
                  ) : pendingGatePasses.map((gp) => (
                    <tr key={gp.id}>
                      <td className="font-mono">{gp.id || gp.gate_pass_number}</td>
                      <td>{gp.requester_name || gp.requested_by || '-'}</td>
                      <td>
                        <span className="badge">{Array.isArray(gp.items) ? gp.items.length : 0} item(s)</span>
                      </td>
                      <td>{gp.purpose || '-'}</td>
                      <td>
                        <span className={`badge badge-${gp.status}`}>{gp.status}</span>
                      </td>
                      <td>
                        <button
                          className="staff-action-button"
                          title="View Gate Pass"
                          aria-label={`View gate pass ${gp.id || gp.gate_pass_number}`}
                          onClick={() => setSelectedPass(gp)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
      </div>

      {selectedPass && (
        <div className="panel">
          <div className="modal-like-container">
            <div className="modal-header">
              <h3>Gate Pass Details</h3>
              <button className="close-button" onClick={() => setSelectedPass(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div>
                  <label>Gate Pass Number</label>
                  <p>{selectedPass.id || selectedPass.gate_pass_number}</p>
                </div>
                <div>
                  <label>Requester</label>
                  <p>{selectedPass.requester_name || selectedPass.requested_by || '-'}</p>
                </div>
                <div>
                  <label>Status</label>
                  <p className="badge">{selectedPass.status}</p>
                </div>
                <div>
                  <label>Purpose</label>
                  <p>{selectedPass.purpose || '-'}</p>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>Items in Gate Pass</h4>
                {Array.isArray(selectedPass.items) && selectedPass.items.length > 0 ? (
                  <ul className="item-list">
                    {selectedPass.items.map((item, idx) => (
                      <li key={idx}>{item.name || item.description || `Item ${idx + 1}`}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No items listed</p>
                )}
              </div>

              <div className="modal-footer">
                {selectedPass.status === 'pending' && (
                  <button
                    className="staff-action-button primary"
                    title="Approve Gate Pass"
                    aria-label="Approve gate pass"
                    onClick={() => handleApproveGatePass(selectedPass.id)}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button className="secondary-button" onClick={() => setSelectedPass(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

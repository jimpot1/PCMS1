import React, { useEffect, useState } from 'react';
import { Package, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function StockVerification() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState({});

  useEffect(() => {
    const loadSupplies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.supplies();
        setSupplies(data?.data || data || []);
      } catch (err) {
        console.error('Error loading supplies:', err);
        setError('Failed to load supply inventory');
      } finally {
        setLoading(false);
      }
    };

    loadSupplies();
  }, []);

  const handleQuantityChange = (supplyId, quantity) => {
    setVerificationData(prev => ({
      ...prev,
      [supplyId]: quantity
    }));
  };

  const handleVerifyStock = async () => {
    try {
      // Submit stock verification
      const updates = Object.entries(verificationData).map(([id, quantity]) => ({
        id: parseInt(id),
        verified_quantity: quantity
      }));

      if (updates.length === 0) {
        setError('Please enter at least one verification');
        return;
      }

      // TODO: Call API to update verified quantities
      alert(`Verified stock for ${updates.length} item(s)`);
      setVerificationData({});
    } catch (err) {
      setError(`Failed to verify stock: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="panel">
          <div className="loading-state">
            <Loader2 size={40} className="spin" />
            <p>Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <section className="page-header">
        <h1>Stock Verification</h1>
        <p>Verify current stock levels against system records</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="panel">
        <div className="info-box">
          <AlertCircle size={20} />
          <p>Enter the actual quantities verified in the physical count. Leave blank if not verified.</p>
        </div>

        {supplies.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No supplies found</p>
            <p className="text-muted">Supplies inventory will appear here for verification</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supply Name</th>
                    <th>Category</th>
                    <th>System Quantity</th>
                    <th>Verified Quantity</th>
                    <th>Variance</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((supply) => {
                    const verified = verificationData[supply.id];
                    const variance = verified !== undefined ? (verified - (supply.quantity || 0)) : null;
                    return (
                      <tr key={supply.id}>
                        <td className="font-semibold">{supply.name || 'N/A'}</td>
                        <td>{supply.category || '-'}</td>
                        <td className="text-center">{supply.quantity || 0}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={verificationData[supply.id] ?? ''}
                            onChange={(e) => handleQuantityChange(supply.id, parseInt(e.target.value) || 0)}
                            placeholder="Enter qty"
                            className="input-small"
                          />
                        </td>
                        <td>
                          {variance !== null && (
                            <span className={variance > 0 ? 'text-success' : variance < 0 ? 'text-danger' : 'text-muted'}>
                              {variance > 0 ? '+' : ''}{variance}
                            </span>
                          )}
                        </td>
                        <td>{supply.unit || 'pcs'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="action-bar">
              <button className="primary-button" onClick={handleVerifyStock}>
                Verify Stock
              </button>
              <button 
                className="secondary-button" 
                onClick={() => setVerificationData({})}
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

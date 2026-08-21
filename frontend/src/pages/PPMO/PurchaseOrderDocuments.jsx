import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, AlertTriangle, Printer, Download, X, Eye } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';
import { exportElementToPdf } from '../../utils/pdfExport.js';
import { TableSkeleton } from '../../components/TableSkeleton.jsx';

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PurchaseOrderDocuments() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pcmsApi.fetchPurchaseRequests({ limit: 200 });
        if (!mounted) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading purchase order documents:', err);
        if (mounted) setError('Failed to load purchase order documents.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const purchaseOrders = useMemo(
    () => requests.filter((item) => (item.request_type || 'purchase_order') === 'purchase_order'),
    [requests]
  );

  const filtered = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      const term = search.trim().toLowerCase();
      const matchesSearch = !term
        || (po.request_number || '').toLowerCase().includes(term)
        || (po.requested_by_name || po.requester?.full_name || '').toLowerCase().includes(term)
        || (po.department?.name || po.department_name || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, search, statusFilter]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (po) => {
    const printArea = document.getElementById('po-print-area');
    if (!printArea) return;

    setDownloading(true);
    setError(null);
    try {
      const filename = `Purchase-Order-${po.request_number || po.id}.pdf`;
      await exportElementToPdf(printArea, filename);
    } catch (err) {
      console.error('Error downloading purchase order PDF:', err);
      setError('Unable to download purchase order document.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <div>
          <h1>Purchase Order Documents</h1>
          <p>View, manage, and print purchase order documentation.</p>
        </div>
      </section>

      <div className="panel">
        <div className="data-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by PO number, requester, or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 260px', minWidth: 200, height: 42, borderRadius: 8, border: '1px solid var(--border)', padding: '0 12px' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 42, borderRadius: 8, border: '1px solid var(--border)', padding: '0 12px' }}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="released">Released</option>
          </select>
        </div>

        <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Requester</th>
                  <th>Department</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <TableSkeleton columns={7} /> : error ? (
                  <tr><td colSpan="7" className="asset-table-state"><div className="alert danger">{error}</div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No purchase order documents found</td></tr>
                ) : filtered.map((po) => (
                  <tr key={po.id}>
                    <td className="font-mono">{po.request_number || po.id}</td>
                    <td>{po.requested_by_name || po.requester?.full_name || po.walk_in_requester_name || '-'}</td>
                    <td>{po.department?.name || po.department_name || '-'}</td>
                    <td>{formatCurrency(po.total_amount)}</td>
                    <td>{formatDate(po.created_at)}</td>
                    <td>
                      <span className={`badge badge-${po.status}`}>{po.status || 'pending'}</span>
                    </td>
                    <td>
                      <button className="staff-action-button" title="View Purchase Order" aria-label={`View purchase order ${po.request_number || po.id}`} onClick={() => setSelected(po)}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="modal-card large-review-modal po-document-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header no-print">
              <h3>Purchase Order Document</h3>
              <button onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div id="po-print-area" className="po-document">
                <div className="po-document-header">
                  <div>
                    <h2>Purchase Order</h2>
                    <p className="text-muted">Property Custodian Management System</p>
                  </div>
                  <div className="po-document-number">
                    <label>PO Number</label>
                    <p className="font-mono">{selected.request_number || selected.id}</p>
                  </div>
                </div>

                <div className="detail-grid">
                  <div>
                    <label>Requester</label>
                    <p>{selected.requested_by_name || selected.requester?.full_name || selected.walk_in_requester_name || '-'}</p>
                  </div>
                  <div>
                    <label>Department</label>
                    <p>{selected.department?.name || selected.department_name || '-'}</p>
                  </div>
                  <div>
                    <label>Status</label>
                    <p className="badge">{selected.status || 'pending'}</p>
                  </div>
                  <div>
                    <label>Date</label>
                    <p>{formatDate(selected.created_at)}</p>
                  </div>
                  <div>
                    <label>Priority</label>
                    <p>{selected.priority || 'normal'}</p>
                  </div>
                  <div>
                    <label>Branch / Unit</label>
                    <p>{[selected.branch, selected.unit].filter(Boolean).join(' / ') || '-'}</p>
                  </div>
                </div>

                {selected.purpose && (
                  <div className="detail-section">
                    <h4>Purpose</h4>
                    <p>{selected.purpose}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Line Items</h4>
                  {Array.isArray(selected.line_items) && selected.line_items.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Unit</th>
                          <th>Unit Price</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.line_items.map((line, idx) => (
                          <tr key={idx}>
                            <td>{line.item || line.particular || line.description || `Item ${idx + 1}`}</td>
                            <td>{line.quantity || line.qty || 1}</td>
                            <td>{line.unit || '-'}</td>
                            <td>{formatCurrency(line.unit_price ?? line.unitPrice)}</td>
                            <td>{formatCurrency(line.amount ?? line.estimated_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">No line items recorded.</p>
                  )}
                </div>

                <div className="po-document-total">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(selected.total_amount)}</strong>
                </div>

                <div className="po-document-signatures">
                  <div>
                    <p className="signature-line" />
                    <label>Prepared By</label>
                  </div>
                  <div>
                    <p className="signature-line" />
                    <label>Approved By</label>
                  </div>
                  <div>
                    <p className="signature-line" />
                    <label>Received By</label>
                  </div>
                </div>
              </div>

              <div className="modal-footer no-print">
                <button className="staff-action-button primary" title="Print Purchase Order" aria-label="Print purchase order" onClick={handlePrint}>
                  <Printer size={16} />
                </button>
                <button className="staff-action-button" title="Download Purchase Order" aria-label="Download purchase order" onClick={() => handleDownload(selected)} disabled={downloading}>
                  <Download size={16} />
                </button>
                <button className="secondary-button" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .po-document { padding: 8px 4px; }
        .po-document-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .po-document-header h2 { margin: 0 0 4px; }
        .po-document-number label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
        .po-document-total { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 16px; }
        .po-document-signatures { display: flex; gap: 24px; margin-top: 40px; }
        .po-document-signatures > div { flex: 1; text-align: center; }
        .signature-line { border-top: 1px solid #94A3B8; margin: 40px 0 6px; }
        .po-document-signatures label { font-size: 12px; color: var(--muted); }

        @media print {
          body * { visibility: hidden; }
          #po-print-area, #po-print-area * { visibility: visible; }
          #po-print-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
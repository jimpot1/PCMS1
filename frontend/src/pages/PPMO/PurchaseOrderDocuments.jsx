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
  const [pendingPrint, setPendingPrint] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

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

  const handlePrintFromTable = (po) => {
    setSelected(po);
    setPendingPrint(true);
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

  const handleDownloadFromTable = (po) => {
    setSelected(po);
    setPendingDownload(po);
  };

  useEffect(() => {
    if (!selected || !pendingPrint) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setPendingPrint(false);
      window.print();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selected, pendingPrint]);

  useEffect(() => {
    if (!selected || !pendingDownload) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setPendingDownload(null);
      handleDownload(pendingDownload);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selected, pendingDownload]);

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
                      <button className="staff-action-button" title="Print Purchase Order" aria-label={`Print purchase order ${po.request_number || po.id}`} onClick={() => handlePrintFromTable(po)}>
                        <Printer size={16} />
                      </button>
                      <button className="staff-action-button" title="Download Purchase Order" aria-label={`Download purchase order ${po.request_number || po.id}`} onClick={() => handleDownloadFromTable(po)} disabled={downloading}>
                        <Download size={16} />
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
        .po-document { box-sizing: border-box; max-width: 794px; min-height: 1123px; margin: 0 auto; padding: 38px 42px; color: #172033; background: #fff; font-family: Georgia, 'Times New Roman', serif; }
        .po-document-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 2px solid #172033; }
        .po-document-header h2 { margin: 0 0 6px; color: #10213b; font-size: 25px; letter-spacing: .04em; text-transform: uppercase; }
        .po-document-header p { margin: 0; color: #64748b; font-family: Arial, sans-serif; font-size: 11px; }
        .po-document-number { min-width: 150px; text-align: right; }
        .po-document-number label { display: block; margin-bottom: 6px; color: #64748b; font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
        .po-document-number p { margin: 0; color: #172033; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; }
        .po-document .detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px 24px; margin-bottom: 18px; }
        .po-document label, .po-document h4 { font-family: Arial, sans-serif; }
        .po-document .detail-grid label { display: block; margin-bottom: 4px; color: #64748b; font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
        .po-document .detail-grid p { margin: 0; font-size: 12px; }
        .po-document .detail-section { margin-top: 18px; }
        .po-document .detail-section h4 { margin: 0 0 8px; color: #10213b; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .po-document .detail-section > p { margin: 0; font-size: 12px; line-height: 1.5; }
        .po-document .data-table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 10px; }
        .po-document .data-table th { padding: 9px 8px; border: 1px solid #cbd5e1; background: #e8eef5; color: #334155; font-size: 9px; letter-spacing: .06em; text-align: left; text-transform: uppercase; }
        .po-document .data-table td { padding: 9px 8px; border: 1px solid #dbe2ea; color: #172033; }
        .po-document-total { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 12px 8px; border-top: 2px solid #172033; font-family: Arial, sans-serif; font-size: 13px; }
        .po-document-total strong { font-size: 16px; }
        .po-document-signatures { display: flex; gap: 28px; margin-top: 74px; }
        .po-document-signatures > div { flex: 1; text-align: center; }
        .signature-line { border-top: 1px solid #64748b; margin: 30px 0 7px; }
        .po-document-signatures label { color: #64748b; font-family: Arial, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: .1em; }

        @page { size: A4 portrait; margin: 14mm; }
        @media print {
          html, body { background: #fff !important; }
          body { margin: 0 !important; }
          body * { visibility: hidden !important; }
          #po-print-area, #po-print-area * { visibility: visible !important; }
          #po-print-area { position: absolute; top: 0; left: 0; z-index: 9999; width: 100%; min-height: auto; margin: 0; padding: 0; }
          #po-print-area .data-table { break-inside: auto; }
          #po-print-area thead { display: table-header-group; }
          #po-print-area tr, #po-print-area .detail-section, #po-print-area .po-document-signatures { break-inside: avoid; page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
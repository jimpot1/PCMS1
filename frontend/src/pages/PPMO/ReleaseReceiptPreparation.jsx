import React, { useEffect, useRef, useState } from 'react';
import { FileText, AlertTriangle, Loader2, Receipt, Download, Eye, Printer, X } from 'lucide-react';
import { pcmsApi, releaseReceiptUrl } from '../../services/api.js';
import { exportHtmlToPdf } from '../../utils/pdfExport.js';
import { TableSkeleton } from '../../components/TableSkeleton.jsx';

export default function ReleaseReceiptPreparation() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [preview, setPreview] = useState(null); // { item, html }
  const [autoPrint, setAutoPrint] = useState(false);
  const iframeRef = useRef(null);

  const loadReleased = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pcmsApi.fetchReleasedRequests({ limit: 100 });
      setRequests(data);
    } catch (err) {
      console.error('Error loading released requests:', err);
      setError('Failed to load released requests');
    } finally {
      setLoading(false);
    }
  };

  // Same as loadReleased but without toggling the page-level `loading`
  // flag — used after View/Print/Download so the table refreshes quietly
  // instead of unmounting the whole page (and any open modal) behind the
  // full-page spinner.
  const refreshReleasedSilently = async () => {
    try {
      const data = await pcmsApi.fetchReleasedRequests({ limit: 100 });
      setRequests(data);
    } catch (err) {
      console.error('Error refreshing released requests:', err);
    }
  };

  useEffect(() => {
    loadReleased();
  }, []);

  // Renders the receipt inline in a modal (via an iframe) instead of a
  // popup window. Popups require navigating a new window to a data:/blob:
  // URL, which modern Chrome blocks as a top-level navigation — that's
  // what caused the blank tab. Rendering inline, the same way the working
  // Purchase Order Documents module does, avoids that entirely.
  const openReceipt = async (item, mode = 'view') => {
    setGeneratingId(item.id);
    setError(null);
    try {
      const data = await pcmsApi.fetchReleaseReceipt(item.id);
      if (data?.receipt_document_path) {
        const sourceUrl = releaseReceiptUrl(data.receipt_document_path);
        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to retrieve release receipt document.');
        const html = await response.text();
        setPreview({ item, html });
        setAutoPrint(mode === 'print');
      }
      await refreshReleasedSilently();
    } catch (err) {
      setError(err.message || 'Unable to generate release receipt.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleIframeLoad = () => {
    if (autoPrint && iframeRef.current) {
      setAutoPrint(false);
      // contentWindow.print() works because the iframe is same-page,
      // same-origin content we wrote via srcDoc — no popup involved.
      iframeRef.current.contentWindow?.focus();
      iframeRef.current.contentWindow?.print();
    }
  };

  const closePreview = () => {
    setPreview(null);
    setAutoPrint(false);
  };

  const downloadReceipt = async (item) => {
    setDownloadingId(item.id);
    setError(null);
    try {
      const data = await pcmsApi.fetchReleaseReceipt(item.id);
      const path = data?.receipt_document_path || item.receipt_document_path;

      if (path) {
        const response = await fetch(releaseReceiptUrl(path));
        if (!response.ok) throw new Error('Unable to retrieve release receipt document.');
        const html = await response.text();
        const filename = `Release-Receipt-${item.receipt_number || item.request_number}.pdf`;
        await exportHtmlToPdf(html, filename);
        if (data?.receipt_document_path) {
          setRequests((current) => current.map((request) => request.id === item.id
            ? { ...request, ...data }
            : request));
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to download release receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="page-container">
      <section className="page-header">
        <h1>Release Receipt Preparation</h1>
        <p>Prepare release receipts for requesters</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="panel">
        <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Request Number</th>
                  <th>Department</th>
                  <th>Requester</th>
                  <th>Amount</th>
                  <th>Released</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <TableSkeleton columns={7} /> : requests.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No released requests yet</td></tr>
                ) : requests.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.receipt_number || '-'}</td>
                    <td className="font-mono">{item.request_number}</td>
                    <td>{item.department?.name || item.department_name || '-'}</td>
                    <td>{item.requester?.email || item.requested_by_name || '-'}</td>
                    <td className="text-right">PHP {Number(item.total_amount || 0).toLocaleString()}</td>
                    <td className="text-muted">{item.released_at ? new Date(item.released_at).toLocaleString() : '-'}</td>
                    <td>
                      <button className="staff-action-button" title="View Receipt" aria-label={`View receipt ${item.receipt_number || item.request_number}`} disabled={generatingId === item.id} onClick={() => openReceipt(item, 'view')}>
                        <Eye size={16} />
                      </button>
                      <button className="staff-action-button" title="Print Receipt" aria-label={`Print receipt ${item.receipt_number || item.request_number}`} disabled={generatingId === item.id} onClick={() => openReceipt(item, 'print')}>
                        <Printer size={16} />
                      </button>
                      <button className="staff-action-button" title="Download Receipt" aria-label={`Download receipt ${item.receipt_number || item.request_number}`} disabled={downloadingId === item.id} onClick={() => downloadReceipt(item)}>
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {preview && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-card large-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Release Receipt {preview.item.receipt_number || preview.item.request_number}</h3>
              <button onClick={closePreview}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <iframe
                ref={iframeRef}
                title="Release Receipt Preview"
                srcDoc={preview.html}
                onLoad={handleIframeLoad}
                style={{ width: '100%', height: '70vh', border: 'none' }}
              />
            </div>
            <div className="modal-footer">
              <button
                className="staff-action-button primary"
                title="Print Receipt"
                onClick={() => {
                  iframeRef.current?.contentWindow?.focus();
                  iframeRef.current?.contentWindow?.print();
                }}
              >
                <Printer size={16} /> Print
              </button>
              <button className="secondary-button" onClick={closePreview}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
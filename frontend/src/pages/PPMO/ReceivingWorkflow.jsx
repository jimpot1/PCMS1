import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Upload, Loader2, ClipboardList, Eye, Camera, X, Printer, Download, PackageCheck } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';
import { TableSkeleton } from '../../components/TableSkeleton.jsx';
import { LIFECYCLE_STATE_LABELS, resolveLifecycleState } from '../../components/PurchaseWorkflowTimeline.jsx';
import SuccessModal from '../../components/SuccessModal.jsx';

const styles = `
  .receiving-workflow-page {
    background: #ffffff;
  }

  .receiving-workflow-page .panel {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .receiving-workflow-page .page-header {
    background: linear-gradient(135deg, #172033 0%, #2d3e50 100%);
    color: #ffffff;
    padding: 24px 32px;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .receiving-workflow-page .page-header h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    color: #ffffff;
  }

  .receiving-workflow-page .page-header p {
    color: #cbd5e1;
    margin: 8px 0 0 0;
    font-size: 14px;
  }

  .receiving-workflow-page .data-table {
    width: 100%;
    border-collapse: collapse;
    background: #ffffff;
  }

  .receiving-workflow-page .data-table th {
    background: #f8fafc;
    color: #1e293b;
    font-weight: 600;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .receiving-workflow-page .data-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    font-size: 14px;
  }

  .receiving-workflow-page .data-table tr:hover {
    background: #f8fafc;
  }

  .receiving-workflow-page .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    background: #e2e8f0;
    color: #475569;
  }

  .receiving-workflow-page .badge-success {
    background: #dcfce7;
    color: #166534;
  }

  .receiving-workflow-page .badge-danger {
    background: #fee2e2;
    color: #991b1b;
  }

  .receiving-workflow-page .badge-pending {
    background: #fef3c7;
    color: #92400e;
  }

  .receiving-workflow-page .staff-action-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    transition: all 0.2s;
  }

  .receiving-workflow-page .staff-action-button:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  .receiving-workflow-page .staff-action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .receiving-workflow-page .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
  }

  .receiving-workflow-page .modal-like-container {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  }

  .receiving-workflow-page .details-modal {
    width: min(760px, 100%);
    max-height: 85vh;
    overflow: auto;
  }

  .receiving-workflow-page .modal-header {
    background: #f8fafc;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .receiving-workflow-page .modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }

  .receiving-workflow-page .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #64748b;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .receiving-workflow-page .close-button:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  .receiving-workflow-page .modal-body {
    padding: 24px;
  }

  .receiving-workflow-page .form-group {
    margin-bottom: 20px;
  }

  .receiving-workflow-page .form-group label {
    display: block;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .receiving-workflow-page .form-group input[type="text"],
  .receiving-workflow-page .form-group input[type="number"],
  .receiving-workflow-page .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 5px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
  }

  .receiving-workflow-page .form-group input[type="text"]:focus,
  .receiving-workflow-page .form-group input[type="number"]:focus,
  .receiving-workflow-page .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .receiving-workflow-page .form-group textarea {
    resize: vertical;
    font-size: 13px;
    line-height: 1.5;
  }

  .receiving-workflow-page .form-group .quantity-inputs {
    background: #f8fafc;
    padding: 16px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }

  .receiving-workflow-page .form-group .quantity-item {
    margin-bottom: 14px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: center;
  }

  .receiving-workflow-page .form-group .quantity-item:last-child {
    margin-bottom: 0;
  }

  .receiving-workflow-page .form-group .quantity-item label {
    margin: 0;
    font-weight: 500;
    color: #475569;
    font-size: 13px;
  }

  .receiving-workflow-page .form-group .quantity-item input {
    width: 100%;
    max-width: 120px;
  }

  .receiving-workflow-page .file-upload-box {
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .receiving-workflow-page .file-upload-box:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .receiving-workflow-page .file-upload-box.drag-over {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .receiving-workflow-page .file-upload-box input[type="file"] {
    display: none;
  }

  .receiving-workflow-page .file-upload-box .upload-icon {
    color: #3b82f6;
    margin-bottom: 8px;
  }

  .receiving-workflow-page .file-upload-box p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.5;
  }

  .receiving-workflow-page .file-upload-box .highlight {
    color: #3b82f6;
    font-weight: 600;
  }

  .receiving-workflow-page .file-preview {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  .receiving-workflow-page .file-preview-name {
    flex: 1;
    color: #166534;
    font-size: 13px;
    font-weight: 500;
  }

  .receiving-workflow-page .file-preview-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: #dc2626;
    padding: 0;
    display: flex;
    align-items: center;
    transition: all 0.2s;
  }

  .receiving-workflow-page .file-preview-remove:hover {
    color: #b91c1c;
  }

  .receiving-workflow-page .modal-footer {
    padding: 20px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .receiving-workflow-page .secondary-button,
  .receiving-workflow-page .primary-button {
    padding: 10px 16px;
    border-radius: 5px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .receiving-workflow-page .secondary-button {
    background: #e2e8f0;
    color: #334155;
    border: 1px solid #cbd5e1;
  }

  .receiving-workflow-page .secondary-button:hover:not(:disabled) {
    background: #cbd5e1;
    color: #1e293b;
  }

  .receiving-workflow-page .primary-button {
    background: #3b82f6;
    color: white;
    border: 1px solid #3b82f6;
  }

  .receiving-workflow-page .primary-button:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }

  .receiving-workflow-page .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .receiving-workflow-page .info-panel {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-top: 16px;
    color: #0369a1;
    font-size: 13px;
  }

  .receiving-workflow-page .info-panel p {
    margin: 0;
    line-height: 1.5;
  }

  .receiving-workflow-page .success-panel {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 20px;
    text-align: center;
    color: #166534;
  }

  .receiving-workflow-page .success-panel h4 {
    margin: 8px 0 0 0;
    font-size: 16px;
    font-weight: 600;
  }

  .receiving-workflow-page .success-panel p {
    margin: 8px 0 0 0;
    font-size: 13px;
  }

  .receiving-workflow-page .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
    font-size: 14px;
  }

  .receiving-workflow-page .error-panel {
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    color: #991b1b;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .receiving-workflow-page .error-panel p {
    margin: 0;
  }

  .receiving-workflow-page .form-message {
    padding: 14px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .receiving-workflow-page .form-message.success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .receiving-workflow-page .qc-options {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .receiving-workflow-page .qc-options label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 400;
    margin: 0;
  }

  .receiving-workflow-page .qc-options input[type="radio"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }
`;

export default function ReceivingWorkflow() {
  const [poList, setPoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedPo, setSelectedPo] = useState(null);
  const [detailsPo, setDetailsPo] = useState(null);
  const [step, setStep] = useState('list');
  const [processingId, setProcessingId] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Receiving form state
  const [receivedData, setReceivedData] = useState({
    received_quantity: {},
    receiving_notes: '',
    receiving_photo_file: null,
  });

  // QC form state
  const [qcData, setQcData] = useState({
    decision: 'passed',
    qc_notes: '',
  });

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const [propertyStageResponse, ppmoStageResponse] = await Promise.all([
        pcmsApi.fetchPurchaseRequests({
          current_stage: 'property_custodian',
          status: 'approved',
          request_type: 'purchase_order',
          limit: 200,
        }),
        pcmsApi.fetchPurchaseRequests({
          current_stage: 'ppmo_staff',
          status: 'approved',
          request_type: 'purchase_order',
          limit: 200,
        }),
      ]);

      const pos = [...(propertyStageResponse || []), ...(ppmoStageResponse || [])].filter((po, index, list) => {
        const firstIndex = list.findIndex((item) => item.id === po.id);
        return firstIndex === index;
      });

      setPoList(pos);
    } catch (err) {
      console.error('Error loading POs:', err);
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLogReceived = async () => {
    if (!selectedPo) return;
    
    setProcessingId(selectedPo.id);
    setError(null);
    setMessage(null);

    try {
      // Convert file to FormData if file exists
      const formData = new FormData();
      formData.append('received_quantity', JSON.stringify(receivedData.received_quantity));
      formData.append('receiving_notes', receivedData.receiving_notes);
      if (receivedData.receiving_photo_file) {
        formData.append('receiving_photo', receivedData.receiving_photo_file);
      }

      const response = await pcmsApi.logPoReceived(selectedPo.id, formData);
      setMessage('Stock received logged. Quality control required.');
      await loadPurchaseOrders();
      setStep('qc');
      setReceivedData({ received_quantity: {}, receiving_notes: '', receiving_photo_file: null });
    } catch (err) {
      setError(err.message || 'Failed to log received stock');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePerformQc = async () => {
    if (!selectedPo) return;

    setProcessingId(selectedPo.id);
    setError(null);
    setMessage(null);

    try {
      const response = await pcmsApi.performPoQc(selectedPo.id, qcData);
      setMessage(`Quality control marked as ${qcData.decision}.`);
      await loadPurchaseOrders();
      setStep('confirm');
      setQcData({ decision: 'passed', qc_notes: '' });
    } catch (err) {
      setError(err.message || 'Failed to complete quality control');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedPo) return;

    setProcessingId(selectedPo.id);
    setError(null);
    setMessage(null);

    try {
      const response = await pcmsApi.updatePoStock(selectedPo.id);
      setMessage('Stock updated in inventory successfully.');
      await loadPurchaseOrders();
      setStep('list');
      setSelectedPo(null);
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickStatusUpdate = async (poId, field, value) => {
    if (!poId || value === undefined || value === null) return;

    setProcessingId(poId);
    setError(null);
    setMessage(null);

    try {
      await pcmsApi.updatePurchaseRequest(poId, {
        [field]: value,
      });

      setPoList((current) =>
        current.map((po) => (po.id === poId ? { ...po, [field]: value } : po))
      );
      setMessage(`${field === 'procurement_status' ? 'Status' : 'QC status'} updated successfully.`);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const openPoDetails = (po) => {
    setDetailsPo(po);
    setSelectedPo(po);
  };

  const closePoDetails = () => {
    setDetailsPo(null);
    setSelectedPo(null);
  };

  const canFinalizeInventory = (po) => {
    return po?.qc_status === 'passed' && po?.procurement_status !== 'completed' && po?.procurement_status !== 'qc_failed' && po?.procurement_status !== 'qc_on_hold';
  };

  const handleFinalizeInventory = async (po) => {
    if (!po || !canFinalizeInventory(po)) return;

    setProcessingId(po.id);
    setError(null);
    setMessage(null);

    try {
      await pcmsApi.updatePoStock(po.id);
      setMessage('Stock added to inventory successfully.');
      await loadPurchaseOrders();
      setSelectedPo(null);
    } catch (err) {
      setError(err.message || 'Failed to update inventory stock');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrintPo = (po) => {
    if (!po) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      setError('Your browser blocked the print popup. Please allow pop-ups and try again.');
      return;
    }

    const html = `
      <html>
        <head><title>${po.request_number}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Purchase Order</h2>
          <p><strong>PO Number:</strong> ${po.request_number || '-'}</p>
          <p><strong>Department:</strong> ${po.department?.name || '-'}</p>
          <p><strong>Amount:</strong> PHP ${Number(po.total_amount || 0).toLocaleString()}</p>
          <p><strong>Status:</strong> ${po.procurement_status || 'draft'}</p>
          <p><strong>QC Status:</strong> ${po.qc_status || 'pending'}</p>
          <p><strong>Created:</strong> ${po.created_at ? new Date(po.created_at).toLocaleDateString() : '-'}</p>
          <hr />
          <h3>Line Items</h3>
          <ul>
            ${(po.line_items || []).map((item) => `<li>${item.item || item.particular || 'Item'} - ${item.qty || item.quantity || 0}</li>`).join('') || '<li>No line items</li>'}
          </ul>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPo = (po) => {
    if (!po) return;

    const payload = {
      request_number: po.request_number,
      department: po.department?.name || '-',
      total_amount: Number(po.total_amount || 0),
      procurement_status: po.procurement_status || 'draft',
      qc_status: po.qc_status || 'pending',
      created_at: po.created_at || null,
      line_items: po.line_items || [],
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(po.request_number || 'purchase-order').replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && step === 'list') {
    return (
      <div className="page-container">
        <section className="page-header">
          <h1>Receiving & Quality Control</h1>
          <p>Process purchase order receipts and quality checks</p>
        </section>
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Status</th>
                <th>QC Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <TableSkeleton columns={7} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page-container receiving-workflow-page">
      <section className="page-header">
        <h1>Receiving & Quality Control</h1>
        <p>Process purchase order receipts and quality checks</p>
      </section>

      {error && (
        <div className="panel error-panel">
          <AlertTriangle size={20} />
          <p>{error}</p>
        </div>
      )}
      <SuccessModal message={message} />

      {step === 'list' && (
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Department</th>
                <th>Amount</th>
                <th>Status</th>
                <th>QC Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {poList.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No purchase orders to process</td></tr>
              ) : poList.map((po) => (
                <tr key={po.id}>
                  <td className="font-mono">{po.request_number}</td>
                  <td>{po.department?.name || '-'}</td>
                  <td className="text-right">PHP {Number(po.total_amount || 0).toLocaleString()}</td>
                  <td>
                    <select
                      value={po.procurement_status || 'draft'}
                      onChange={(e) => handleQuickStatusUpdate(po.id, 'procurement_status', e.target.value)}
                      disabled={processingId === po.id}
                      style={{
                        minWidth: 110,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#334155',
                        fontSize: 13,
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="approved">Approved</option>
                      <option value="received">Received</option>
                      <option value="ready_to_release">Ready to Release</option>
                      <option value="completed">Completed</option>
                      <option value="qc_failed">QC Failed</option>
                      <option value="qc_on_hold">QC On Hold</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={po.qc_status || 'pending'}
                      onChange={(e) => handleQuickStatusUpdate(po.id, 'qc_status', e.target.value)}
                      disabled={processingId === po.id}
                      style={{
                        minWidth: 110,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#334155',
                        fontSize: 13,
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                      <option value="hold">Hold</option>
                    </select>
                  </td>
                  <td className="text-muted">{po.created_at ? new Date(po.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="staff-action-button primary"
                        disabled={po.qc_status === 'passed' || processingId === po.id}
                        onClick={() => {
                          setSelectedPo(po);
                          setStep(po.stock_received_date ? 'qc' : 'receive');
                        }}
                        title="Process PO"
                        aria-label={`Process ${po.request_number}`}
                      >
                        <ClipboardList size={16} />
                      </button>

                      <button
                        className="staff-action-button"
                        disabled={processingId === po.id}
                        onClick={() => openPoDetails(po)}
                        title="View PO Details"
                        aria-label={`View details for ${po.request_number}`}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        className="staff-action-button success"
                        disabled={!canFinalizeInventory(po) || processingId === po.id}
                        onClick={() => handleFinalizeInventory(po)}
                        title="Add stock to inventory"
                        aria-label={`Add stock for ${po.request_number}`}
                      >
                        <PackageCheck size={16} />
                      </button>

                      <button
                        className="staff-action-button"
                        disabled={processingId === po.id}
                        onClick={() => handlePrintPo(po)}
                        title="Print PO"
                        aria-label={`Print ${po.request_number}`}
                      >
                        <Printer size={16} />
                      </button>

                      <button
                        className="staff-action-button"
                        disabled={processingId === po.id}
                        onClick={() => handleDownloadPo(po)}
                        title="Download PO"
                        aria-label={`Download ${po.request_number}`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailsPo && (
        <div className="modal-backdrop" onClick={closePoDetails}>
          <div className="modal-like-container details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>PO Details — {detailsPo.request_number}</h3>
              <button className="close-button" disabled={processingId === detailsPo.id} onClick={closePoDetails}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Overview</label>
                <div className="quantity-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: 12 }}>
                  <div><strong>Department:</strong> {detailsPo.department?.name || '-'}</div>
                  <div><strong>Amount:</strong> PHP {Number(detailsPo.total_amount || 0).toLocaleString()}</div>
                  <div><strong>Lifecycle State:</strong> {LIFECYCLE_STATE_LABELS[resolveLifecycleState(detailsPo)] || 'Submitted'}</div>
                  <div><strong>Procurement Status:</strong> {detailsPo.procurement_status || 'draft'}</div>
                  <div><strong>QC Status:</strong> {detailsPo.qc_status || 'pending'}</div>
                  <div><strong>Created:</strong> {detailsPo.created_at ? new Date(detailsPo.created_at).toLocaleDateString() : '-'}</div>
                  <div><strong>Expected Delivery:</strong> {detailsPo.expected_delivery_date ? new Date(detailsPo.expected_delivery_date).toLocaleDateString() : '-'}</div>
                </div>
              </div>

              <div className="form-group">
                <label>Line Items</label>
                <div className="quantity-inputs">
                  {detailsPo.line_items?.length ? detailsPo.line_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: idx < detailsPo.line_items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <span>{item.item || item.particular || 'Item'}</span>
                      <strong>{item.qty || item.quantity || 0}</strong>
                    </div>
                  )) : <p style={{ margin: 0 }}>No line items available.</p>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="secondary-button" onClick={closePoDetails}>
                  Close
                </button>
                <button className="primary-button" onClick={() => {
                  setSelectedPo(detailsPo);
                  setDetailsPo(null);
                  setStep(detailsPo.stock_received_date ? 'qc' : 'receive');
                }}>
                  <ClipboardList size={16} />
                  Continue workflow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'receive' && selectedPo && (
        <div className="panel">
          <div className="modal-like-container">
            <div className="modal-header">
              <h3>Log Stock Received — {selectedPo.request_number}</h3>
              <button className="close-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Receiving Notes</label>
                <textarea
                  value={receivedData.receiving_notes}
                  onChange={(e) => setReceivedData({ ...receivedData, receiving_notes: e.target.value })}
                  placeholder="Document any issues, damages, or missing items..."
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Received Quantities (per item)</label>
                <div className="quantity-inputs">
                  {selectedPo.line_items?.map((item, idx) => (
                    <div key={idx} className="quantity-item">
                      <label>{item.item || item.particular} (Ordered: {item.qty || item.quantity})</label>
                      <input
                        type="number"
                        min="0"
                        max={item.qty || item.quantity}
                        value={receivedData.received_quantity[item.source_id] || item.qty || item.quantity}
                        onChange={(e) => setReceivedData({
                          ...receivedData,
                          received_quantity: {
                            ...receivedData.received_quantity,
                            [item.source_id]: parseInt(e.target.value) || 0
                          }
                        })}
                        placeholder="Quantity received"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Receiving Photo Evidence (Optional)</label>
                <div
                  className={`file-upload-box ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => document.getElementById(`photo-input-${selectedPo.id}`).click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files[0]) {
                      setReceivedData({ ...receivedData, receiving_photo_file: e.dataTransfer.files[0] });
                    }
                  }}
                >
                  <Camera className="upload-icon" size={32} />
                  <p>
                    <span className="highlight">Click to upload</span> or drag and drop<br />
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <input
                    id={`photo-input-${selectedPo.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setReceivedData({ ...receivedData, receiving_photo_file: e.target.files[0] });
                      }
                    }}
                  />
                </div>
                {receivedData.receiving_photo_file && (
                  <div className="file-preview">
                    <span className="file-preview-name">
                      ✓ {receivedData.receiving_photo_file.name}
                    </span>
                    <button
                      className="file-preview-remove"
                      onClick={() => setReceivedData({ ...receivedData, receiving_photo_file: null })}
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="secondary-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>
                  Cancel
                </button>
                <button className="primary-button" disabled={processingId === selectedPo.id} onClick={handleLogReceived}>
                  <Upload size={16} />
                  {processingId === selectedPo.id ? 'Logging...' : 'Log Received'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'qc' && selectedPo && (
        <div className="panel">
          <div className="modal-like-container">
            <div className="modal-header">
              <h3>Quality Control Check — {selectedPo.request_number}</h3>
              <button className="close-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>QC Decision</label>
                <div className="qc-options">
                  {['passed', 'failed', 'hold'].map(option => (
                    <label key={option}>
                      <input
                        type="radio"
                        name="qc_decision"
                        value={option}
                        checked={qcData.decision === option}
                        onChange={(e) => setQcData({ ...qcData, decision: e.target.value })}
                      />
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>QC Notes *</label>
                <textarea
                  value={qcData.qc_notes}
                  onChange={(e) => setQcData({ ...qcData, qc_notes: e.target.value })}
                  placeholder="Document your quality control findings..."
                  rows="4"
                  required
                />
              </div>

              {qcData.decision === 'failed' && (
                <div className="info-panel">
                  <AlertTriangle size={16} />
                  <p>Failed QC requires supplier contact for return or replacement</p>
                </div>
              )}

              <div className="modal-footer">
                <button className="secondary-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>
                  Cancel
                </button>
                <button className="primary-button" disabled={processingId === selectedPo.id || !qcData.qc_notes} onClick={handlePerformQc}>
                  <CheckCircle2 size={16} />
                  {processingId === selectedPo.id ? 'Submitting...' : 'Submit QC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && selectedPo && selectedPo.qc_status === 'passed' && (
        <div className="panel">
          <div className="modal-like-container">
            <div className="modal-header">
              <h3>Update Stock in Inventory — {selectedPo.request_number}</h3>
              <button className="close-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="success-panel">
                <CheckCircle2 size={24} />
                <h4>QC Passed!</h4>
                <p>Stock has passed quality control and is ready to be added to inventory.</p>
              </div>

              <div className="info-panel">
                <p>This will update the supply stock quantities based on received items. Once completed, dependent requests will be notified that they can be released.</p>
              </div>

              <div className="modal-footer">
                <button className="secondary-button" disabled={processingId === selectedPo.id} onClick={() => { setStep('list'); setSelectedPo(null); }}>
                  Cancel
                </button>
                <button className="primary-button" disabled={processingId === selectedPo.id} onClick={handleUpdateStock}>
                  <CheckCircle2 size={16} />
                  {processingId === selectedPo.id ? 'Updating...' : 'Update Stock Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

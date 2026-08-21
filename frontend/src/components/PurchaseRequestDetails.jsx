import React from 'react';
import { FileText, Pencil, Printer, Trash2, X } from 'lucide-react';
import { assetQrCodeUrl } from '../services/api.js';
import PurchaseWorkflowTimeline from './PurchaseWorkflowTimeline.jsx';

const requesterName = (request) => request?.requester?.full_name || request?.requester?.name || request?.requester?.email || request?.requested_by_name || request?.walk_in_requester_name || '-';
const departmentName = (request) => request?.department?.name || request?.department_name || request?.department || '-';
const itemName = (item, index) => item?.name || item?.item || item?.particular || item?.description || `Item ${index + 1}`;

export default function PurchaseRequestDetails({ request, onClose, onPrint, onEdit, onDelete }) {
  if (!request) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel purchase-details-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header purchase-details-header">
          <div>
            <h3>{request.request_number || 'Purchase Request'}</h3>
            <p className="text-muted">Complete workflow record</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="purchase-summary-grid">
            <div><label>Requester</label><p>{requesterName(request)}</p></div>
            <div><label>Department</label><p>{departmentName(request)}</p></div>
            <div><label>Request Type</label><p>{request.workflow?.is_procurement_required ? 'Purchase Form / Procurement Required' : (request.request_type || '-')}</p></div>
            <div><label>Total Amount</label><p>PHP {Number(request.total_amount || 0).toLocaleString()}</p></div>
            <div><label>Priority</label><p>{request.priority || '-'}</p></div>
            <div><label>Date Needed</label><p>{request.date_needed ? new Date(request.date_needed).toLocaleDateString() : '-'}</p></div>
            <div><label>Current Stage</label><p>{request.current_stage || '-'}</p></div>
            <div><label>Status</label><p>{request.status || '-'}</p></div>
          </div>

          <div className="detail-section"><h4>Purpose</h4><p>{request.purpose || 'No purpose recorded.'}</p></div>

          {request.workflow?.is_procurement_required && (
            <div className="form-message warning">Insufficient stock — procurement is required. This request follows the existing Purchase Order approval workflow and cannot be released as an inventory request.</div>
          )}

          <div className="detail-section">
            <h4>Items</h4>
            {Array.isArray(request.line_items) && request.line_items.length ? (
              <div className="table-responsive"><table className="data-table"><thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Amount</th></tr></thead><tbody>
                {request.line_items.map((item, index) => <tr key={`${itemName(item, index)}-${index}`}><td>{itemName(item, index)}</td><td>{item.qty || item.quantity || 1}</td><td>PHP {Number(item.unit_price ?? item.unitPrice ?? 0).toLocaleString()}</td><td>PHP {Number(item.amount ?? item.estimated_cost ?? 0).toLocaleString()}</td></tr>)}
              </tbody></table></div>
            ) : <p className="text-muted">No line items recorded.</p>}
          </div>

          {(request.attachment_path || request.approval_document_path) && <div className="detail-section"><h4>Attachments</h4><div className="inline-actions">
            {request.attachment_path && <a className="link-button" href={assetQrCodeUrl(request.attachment_path)} target="_blank" rel="noreferrer"><FileText size={14} /> Request attachment</a>}
            {request.approval_document_path && <a className="link-button" href={assetQrCodeUrl(request.approval_document_path)} target="_blank" rel="noreferrer"><FileText size={14} /> Approved form</a>}
          </div></div>}

          <div className="detail-section"><h4>Workflow</h4><PurchaseWorkflowTimeline request={request} /></div>

          {request.status === 'released' && <div className="detail-section release-information"><h4>Release Information</h4><div className="purchase-summary-grid"><div><label>Released By</label><p>{request.released_by || '-'}</p></div><div><label>Released At</label><p>{request.released_at ? new Date(request.released_at).toLocaleString() : '-'}</p></div><div><label>Receipt Number</label><p>{request.receipt_number || '-'}</p></div></div></div>}
        </div>
        <div className="purchase-details-footer"><div className="purchase-modal-actions">{onPrint && <button className="secondary-button" type="button" onClick={onPrint} title="Print Request"><Printer size={15} /> Print</button>}{onEdit && <button className="secondary-button" type="button" onClick={onEdit} title="Edit Request"><Pencil size={15} /> Edit</button>}{onDelete && <button className="danger-button" type="button" onClick={onDelete} title="Delete Request"><Trash2 size={15} /> Delete</button>}</div><button className="secondary-button" type="button" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

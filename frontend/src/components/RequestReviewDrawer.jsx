import React from 'react';
import { X, User, Building2, FolderOpen, FileText } from 'lucide-react';

export default function RequestReviewDrawer({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="department-drawer-backdrop" onClick={onClose}>
      <aside className="department-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="department-drawer-header">
          <div>
            <p className="department-eyebrow">Review request</p>
            <h3>{item.label}: {item.ref}</h3>
          </div>
          <button className="department-icon-btn" type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="department-drawer-body">
          <div className="department-drawer-section">
            <h4>Requester Information</h4>
            <div className="department-info-grid">
              <div><span>Employee</span><strong>{item.requester?.email || 'Recorded requester'}</strong></div>
              <div><span>Department</span><strong>{item.department?.name || item.requester?.department || 'Department'}</strong></div>
              <div><span>Request Type</span><strong>{item.label}</strong></div>
              <div><span>Priority</span><strong>{item.priority || 'Normal'}</strong></div>
            </div>
          </div>

          <div className="department-drawer-section">
            <h4>Request Details</h4>
            <div className="department-info-grid">
              <div><span>Purpose</span><strong>{item.detail || 'No purpose provided.'}</strong></div>
              <div><span>Estimated Cost</span><strong>{item.total_amount ? `PHP ${Number(item.total_amount).toLocaleString()}` : 'Pending'}</strong></div>
              <div><span>Budget Availability</span><strong>{item.budget_available ? 'Available' : 'To review'}</strong></div>
              <div><span>Attachments</span><strong>Supporting docs attached</strong></div>
            </div>
          </div>

          <div className="department-drawer-section">
            <h4>Approval History</h4>
            <div className="department-history-list">
              <div><strong>Submitted</strong><p>Awaiting department head review</p></div>
              <div><strong>Previous comments</strong><p>No prior comments recorded.</p></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

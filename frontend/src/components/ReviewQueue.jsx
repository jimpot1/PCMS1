import React from 'react';
import { Eye, Layers, ClipboardList, Loader2 } from 'lucide-react';

export default function ReviewQueue({ requests = [], onView, selectable = false, selectedIds = [], onToggleSelect, onToggleSelectAll, loading = false }) {
  if (!requests.length && !loading) {
    return <div className="recommending-empty-state">No review requests available.</div>;
  }

  const selectedSet = new Set(selectedIds);
  const allSelected = requests.length > 0 && requests.every((request) => selectedSet.has(request.id));
  const someSelected = requests.some((request) => selectedSet.has(request.id)) && !allSelected;

  return (
    <div className="recommending-queue-table-wrap">
      <table className="recommending-queue-table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  aria-label="Select all requests"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={(e) => onToggleSelectAll && onToggleSelectAll(e.target.checked)}
                />
              </th>
            )}
            <th>Request No.</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Request Type</th>
            <th>Items</th>
            <th>Priority</th>
            <th>Submitted Date</th>
            <th>Current Stage</th>
            <th>Validation Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={selectable ? 11 : 10} className="table-loading-row">
                <Loader2 size={20} className="spin" />
                <span>Loading review requests...</span>
              </td>
            </tr>
          ) : requests.map((request) => (
            <tr key={request.id} className={selectable && selectedSet.has(request.id) ? 'row-selected' : ''}>
              {selectable && (
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select request ${request.request_number}`}
                    checked={selectedSet.has(request.id)}
                    onChange={(e) => onToggleSelect && onToggleSelect(request, e.target.checked)}
                  />
                </td>
              )}
              <td><strong>{request.request_number}</strong></td>
              <td>{request.requester?.email || request.requester?.name || 'Requester'}</td>
              <td>{request.department?.name || request.department_name || 'Department'}</td>
              <td>{request.request_type?.replace('_', ' ') || 'Purchase Order'}</td>
              <td>{request.line_items?.length ?? 0}</td>
              <td><span className={`status-pill ${String(request.priority ?? 'normal').toLowerCase()}`}>{request.priority || 'normal'}</span></td>
              <td>{new Date(request.created_at).toLocaleDateString()}</td>
              <td><span className="status-pill info">{request.current_stage?.replace('_', ' ')}</span></td>
              <td><span className={`status-pill ${request.validation_status === 'failed' ? 'danger' : request.validation_status === 'needs_attention' ? 'warning' : request.validation_status === 'passed' ? 'success' : 'info'}`}>{request.validation_status ? request.validation_status.replace('_', ' ') : 'Pending Review'}</span></td>
              <td>
                <button className="workflow-icon-button" type="button" title="Review request" aria-label={`Review ${request.request_number}`} onClick={() => onView(request)}>
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
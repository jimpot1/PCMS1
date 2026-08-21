import React from 'react';
import { CheckCircle2, Circle, Clock3, XCircle } from 'lucide-react';

export const WORKFLOW_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'department_head', label: 'Department Head' },
  { key: 'recommending_approver', label: 'Recommending Approver' },
  { key: 'president', label: 'President / CEO' },
  { key: 'property_custodian', label: 'Processing / Release' },
  { key: 'released', label: 'Released' },
];

const REQUEST_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'department_head', label: 'Department Head' },
  { key: 'recommending_approver', label: 'Recommending Approver' },
  { key: 'property_custodian', label: 'OIC' },
  { key: 'ppmo_staff', label: 'PPMO Staff — Processing / Release' },
  { key: 'released', label: 'Released' },
];

const statusLabel = (status) => ({
  submitted: 'Completed',
  approved: 'Completed',
  resubmitted: 'Completed',
  current: 'Current',
  pending: 'Pending',
  rejected: 'Rejected',
  revision_requested: 'Revision Requested',
  released: 'Completed',
}[status] || status || 'Pending');

export default function PurchaseWorkflowTimeline({ request }) {
  const stages = Array.isArray(request?.workflow?.stages) && request.workflow.stages.length
    ? request.workflow.stages
    : request?.request_type === 'request' && ['asset_assignment', 'supplies_inventory_release'].includes(request?.workflow_destination)
      ? REQUEST_STAGES
      : WORKFLOW_STAGES;
  const currentIndex = Math.max(0, stages.findIndex((stage) => stage.key === request?.current_stage));
  const history = Array.isArray(request?.timeline) ? request.timeline : [];

  return (
    <div className="purchase-workflow-timeline">
      {stages.map((stage, index) => {
        const entries = history.filter((entry) => {
          const value = String(entry.stage || '').toLowerCase();
          return value.includes(stage.label.toLowerCase()) || value === stage.key;
        });
        const latest = entries[entries.length - 1];
        const isRejected = latest?.status === 'rejected' || (request.status === 'rejected' && index === currentIndex);
        const isRevision = latest?.status === 'revision_requested' || (request.status === 'revision_requested' && index === currentIndex);
        const isComplete = request.status === 'released' || index < currentIndex || stage.status === 'approved' || stage.status === 'released' || latest?.status === 'approved' || latest?.status === 'released';
        const isCurrent = !isComplete && !isRejected && !isRevision && index === currentIndex;
        const state = isRejected ? 'rejected' : isRevision ? 'revision_requested' : isComplete ? 'completed' : isCurrent ? 'current' : 'pending';
        const Icon = state === 'completed' ? CheckCircle2 : state === 'rejected' ? XCircle : state === 'current' ? Clock3 : Circle;

        return (
          <div className={`purchase-timeline-step ${state}`} key={stage.key}>
            <div className="purchase-timeline-marker"><Icon size={18} /></div>
            <div className="purchase-timeline-content">
              <div className="purchase-timeline-heading">
                <strong>{stage.label}</strong>
                <span className={`badge badge-${state}`}>{statusLabel(state)}</span>
              </div>
              <div className="purchase-timeline-meta">
                {stage.approver?.name || latest?.performed_by_name || latest?.approver || latest?.processor || 'Awaiting assignment'}
                {latest?.timestamp && ` · ${new Date(latest.timestamp).toLocaleString()}`}
              </div>
              {(stage.remarks || latest?.notes || (isRejected && request.rejection_reason)) && (
                <p className="purchase-timeline-comment">{stage.remarks || latest?.notes || request.rejection_reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

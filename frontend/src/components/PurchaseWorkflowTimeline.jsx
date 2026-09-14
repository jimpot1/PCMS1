import React from 'react';
import { CheckCircle2, Circle, Clock3, XCircle } from 'lucide-react';

export const LIFECYCLE_STATE_LABELS = {
  submitted: 'Submitted',
  pending_approval: 'Pending Approval',
  purchase_order_created: 'Purchase Order Created',
  received: 'Received',
  qc_passed: 'QC Passed',
  inventory_updated: 'Inventory Updated',
  ready_to_release: 'Ready to Release',
  released: 'Released',
};

export const WORKFLOW_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'department_head', label: 'Department Head' },
  { key: 'recommending_approver', label: 'Recommending Approver' },
  { key: 'president', label: 'President / CEO' },
  { key: 'property_custodian', label: 'Processing / Release' },
  { key: 'released', label: 'Released' },
];

export function resolveLifecycleState(request) {
  const status = String(request?.status || '').toLowerCase();
  const currentStage = String(request?.current_stage || '').toLowerCase();
  const procurementStatus = String(request?.procurement_status || '').toLowerCase();
  const qcStatus = String(request?.qc_status || '').toLowerCase();
  const requestType = String(request?.request_type || '').toLowerCase();
  const workflowDestination = String(request?.workflow_destination || '').toLowerCase();
  const isPurchaseWorkflow = requestType === 'purchase_order' || workflowDestination === 'purchase_workflow';

  if (status === 'released' || currentStage === 'released') {
    return 'released';
  }

  if (procurementStatus === 'ready_to_release' || status === 'ready_to_release') {
    return 'ready_to_release';
  }

  if (procurementStatus === 'completed' || procurementStatus === 'inventory_updated') {
    return 'inventory_updated';
  }

  if (qcStatus === 'passed') {
    return 'qc_passed';
  }

  if (procurementStatus === 'received' || request?.stock_received_date) {
    return 'received';
  }

  if (status === 'approved' && isPurchaseWorkflow) {
    return 'purchase_order_created';
  }

  if (status === 'pending' || status === 'draft' || currentStage === 'employee' || currentStage === 'department_head' || currentStage === 'recommending_approver' || currentStage === 'president') {
    return 'pending_approval';
  }

  if (currentStage === 'property_custodian' || currentStage === 'ppmo_staff') {
    return 'pending_approval';
  }

  return 'submitted';
}

const REQUEST_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'department_head', label: 'Department Head' },
  { key: 'recommending_approver', label: 'Recommending Approver' },
  { key: 'property_custodian', label: 'OIC' },
  { key: 'ppmo_staff', label: 'PPMO Staff — Processing / Release' },
  { key: 'released', label: 'Released' },
];

const WALK_IN_REQUEST_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'ppmo_staff', label: 'PPMO Staff — Processing / Release' },
  { key: 'released', label: 'Released' },
];

const WALK_IN_PURCHASE_STAGES = [
  { key: 'employee', label: 'Submitted' },
  { key: 'property_custodian', label: 'Property Custodian / OIC' },
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
  const isWalkIn = Boolean(request?.is_walk_in);
  const stages = Array.isArray(request?.workflow?.stages) && request.workflow.stages.length
    ? request.workflow.stages
    : isWalkIn
      ? (request?.request_type === 'request' && ['asset_assignment', 'supplies_inventory_release'].includes(request?.workflow_destination)
        ? WALK_IN_REQUEST_STAGES
        : WALK_IN_PURCHASE_STAGES)
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
          <div className={`purchase-timeline-step ${state}`} key={`${stage.key}-${index}`}>
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

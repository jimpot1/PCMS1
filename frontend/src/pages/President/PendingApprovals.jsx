import React from 'react';
import ExecutiveApprovalQueue from '../../components/ExecutiveApprovalQueue.jsx';

export default function PendingExecutiveApprovals() {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Pending Executive Approvals</h2>
          <p>These are the purchase requests currently waiting for your approval.</p>
        </div>
      </div>
      <ExecutiveApprovalQueue />
    </div>
  );
}

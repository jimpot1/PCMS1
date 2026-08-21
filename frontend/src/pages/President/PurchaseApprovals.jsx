import React from 'react';
import ExecutiveApprovalQueue from '../../components/ExecutiveApprovalQueue.jsx';

export default function PurchaseApprovals() {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Purchase Order Approvals</h2>
          <p>Review requests approved by Department Heads and prepare them for executive action.</p>
        </div>
      </div>
      <ExecutiveApprovalQueue />
    </div>
  );
}

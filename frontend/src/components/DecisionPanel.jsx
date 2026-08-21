import React, { useState } from 'react';
import { CheckCircle2, XCircle, MessageSquareMore } from 'lucide-react';

export default function DecisionPanel({ selectedItem, onApprove, onReject, onRequestMoreInfo }) {
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [question, setQuestion] = useState('');
  if (!selectedItem) return null;

  return (
    <div className="department-decision-panel">
      <div className="department-decision-actions">
        <button className="department-decision-btn approve" type="button" onClick={() => onApprove(selectedItem, comment)}>
          <CheckCircle2 size={16} /> Approve Request
        </button>
        <button className="department-decision-btn reject" type="button" onClick={() => onReject(selectedItem, reason)}>
          <XCircle size={16} /> Reject Request
        </button>
        <button className="department-decision-btn info" type="button" onClick={() => onRequestMoreInfo(selectedItem, question)}>
          <MessageSquareMore size={16} /> Request More Info
        </button>
      </div>
      <div className="department-decision-fields">
        <label>Comments
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add approval comments..." />
        </label>
        <label>Reason for rejection
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Provide rejection reason..." />
        </label>
        <label>Questions / additional info
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="List what the requester should provide..." />
        </label>
      </div>
    </div>
  );
}

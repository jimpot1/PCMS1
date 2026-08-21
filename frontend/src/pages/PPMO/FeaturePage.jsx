import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

export default function PPMOFeaturePage({ title, caption, icon: Icon }) {
  return (
    <div className="page-container">
      <section className="page-header">
        <h1>{title}</h1>
        <p>{caption}</p>
      </section>

      <div className="panel">
        <div className="empty-state">
          {Icon ? <Icon size={48} /> : <Lock size={48} />}
          <p>{title}</p>
          <p className="text-muted">{caption}</p>
        </div>

        <div className="info-box">
          <AlertCircle size={20} />
          <p>This feature is available in your PCMS system and will be fully implemented soon. Please check back for updates.</p>
        </div>

        <div className="action-bar">
          <button className="secondary-button" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Download, FileText } from 'lucide-react';
import { pcmsApi } from '../../services/api.js';

export default function OicReports() {
  return (
    <div className="oic-page-shell">
      <section className="oic-panel">
        <div className="panel-header">
          <div>
            <h3>Reports</h3>
            <p>Export final release summaries and operational reports.</p>
          </div>
        </div>
        <div className="oic-report-actions">
          <button className="secondary-button" type="button" onClick={() => window.open(pcmsApi.requesterExportUrl('requests'), '_blank')}><FileText size={16} /> Purchase Request Report</button>
          <button className="secondary-button" type="button" onClick={() => window.open(pcmsApi.requesterExportUrl('gate_passes'), '_blank')}><Download size={16} /> Gate Pass Report</button>
        </div>
      </section>
    </div>
  );
}

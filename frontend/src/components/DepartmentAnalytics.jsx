import React from 'react';
import { BarChart3, Clock3 } from 'lucide-react';

export default function DepartmentAnalytics({ analytics = {} }) {
  const monthly = analytics.monthly_approvals ?? analytics.monthly ?? 0;
  const avgHours = analytics.average_review_time_hours ?? analytics.avg_review_hours ?? null;

  return (
    <section className="department-panel-card">
      <div className="department-panel-header">
        <div>
          <h3>Department Analytics</h3>
          <p>Approval trends and department performance.</p>
        </div>
      </div>
      <div className="department-chart-grid">
        <div className="department-chart-card">
          <div className="department-chart-title"><BarChart3 size={16} /> Monthly Approvals</div>
          <div className="department-chart-placeholder">{monthly} approvals this month</div>
        </div>
        <div className="department-chart-card">
          <div className="department-chart-title"><Clock3 size={16} /> Average Review Time</div>
          <div className="department-chart-placeholder">{avgHours ? `${avgHours} hours` : '—'}</div>
        </div>
      </div>
    </section>
  );
}

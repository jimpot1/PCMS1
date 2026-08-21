import React from 'react';
import { ArrowLeft, Building2, Mail, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../services/auth.js';
import { ROLES, getRoleDisplayName } from '../services/roles.js';

function resolveDashboardPath(role) {
  switch (role) {
    case ROLES.DEPARTMENT_HEAD:
      return '/department-head/dashboard';
    case ROLES.DEPARTMENT_REQUESTER:
      return '/requester';
    case ROLES.OIC:
      return '/oic/dashboard';
    case ROLES.PPMO_STAFF:
      return '/ppmo';
    case ROLES.PRESIDENT_CEO:
      return '/president/dashboard';
    case ROLES.RECOMMENDING_APPROVER:
      return '/recommending-approver/dashboard';
    default:
      return '/';
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.full_name || user?.email || 'User';
  const roleName = getRoleDisplayName(user?.role);
  const status = user?.status || 'Active';
  const fallback = resolveDashboardPath(user?.role);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <button type="button" className="secondary-button back-button" onClick={handleBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="page-heading">
          <h2>Profile</h2>
          <p>Review your account information, role, department, and current status.</p>
        </div>
      </div>

      <div className="page-card profile-card">
        <div className="profile-summary-card">
          <div className="profile-summary-top">
            <div className="profile-avatar">{name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="profile-meta">
              <span className="profile-label">Account Holder</span>
              <span className="profile-name">{name}</span>
              <span className="profile-role">{roleName}</span>
            </div>
          </div>

          <div className="profile-detail-grid">
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value"><Mail size={14} /> {user?.email || 'Not available'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Department</span>
              <span className="detail-value"><Building2 size={14} /> {user?.department || 'Not assigned'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account status</span>
              <span className={`status-pill ${status.toLowerCase() === 'active' ? 'success' : status.toLowerCase() === 'pending' ? 'warning' : 'danger'}`}>{status}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member since</span>
              <span className="detail-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

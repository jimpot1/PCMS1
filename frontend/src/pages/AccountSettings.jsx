import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
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

export default function AccountSettings() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.full_name || user?.email || 'User';
  const roleName = getRoleDisplayName(user?.role);
  const fallback = resolveDashboardPath(user?.role);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { valid: false, error: 'Please fill in all password fields.' };
    }
    if (newPassword !== confirmPassword) {
      return { valid: false, error: 'New password and confirmation must match.' };
    }
    return { valid: true };
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    const validation = validateForm();
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.error });
      return;
    }

    setIsSaving(true);
    try {
      const resp = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(payload.message || 'Failed to change password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <button type="button" className="secondary-button back-button" onClick={handleBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="page-heading">
          <h2>Account Settings</h2>
          <p>Manage your account details and protect your profile with a secure password update workflow.</p>
        </div>
      </div>

      <div className="page-card settings-card">
        <div className="settings-section">
          <div className="section-heading">
            <h3>Profile Information</h3>
            <p>View the details associated with your account.</p>
          </div>
          <div className="profile-detail-grid">
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email || 'Not available'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Role</span>
              <span className="detail-value">{roleName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Department</span>
              <span className="detail-value">{user?.department || 'Not assigned'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account status</span>
              <span className={`status-pill ${user?.status?.toLowerCase() === 'active' ? 'success' : user?.status?.toLowerCase() === 'pending' ? 'warning' : 'danger'}`}>{user?.status || 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-card settings-card">
        <div className="settings-section">
          <div className="section-heading">
            <h3>Security</h3>
            <p>Keep your account secure by updating your password regularly.</p>
          </div>
          <form className="form-grid" onSubmit={handleChangePassword}>
            <div className="field-row">
              <label htmlFor="currentPassword">Current password</label>
              <div className="password-input-wrapper">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrent((current) => !current)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="field-row">
              <label htmlFor="newPassword">New password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNew((current) => !current)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="field-row">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((current) => !current)}
                  aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="field-row" style={{ gridColumn: '1 / -1' }}>
              <div>
                <small>Use a strong password with at least eight characters, including numbers and symbols.</small>
              </div>
            </div>

            {message && (
              <div className="field-row" style={{ gridColumn: '1 / -1' }}>
                <div className={message.type === 'error' ? 'form-message error' : 'form-message success'}>{message.text}</div>
              </div>
            )}

            <div className="field-row" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

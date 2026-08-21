import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Archive,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  FileBarChart2,
  Home,
  ClipboardCheck,
  FileText,
  Gauge,
  LogOut,
  PackageCheck,
  PackageOpen,
  Package,
  QrCode,
  RotateCcw,
  ShoppingCart,
  Tags,
  Wrench,
  UserPlus
} from 'lucide-react';

const sidebarSections = [
  {
    title: 'Staff Menu',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/ppmo/dashboard' }
    ]
  },
  {
    title: 'Asset Management',
    items: [
      { id: 'assets', label: 'Asset Registry', icon: Boxes, to: '/ppmo/assets' },
      { id: 'ocr', label: 'OCR Asset Tagging', icon: QrCode, to: '/ppmo/ocr' },
      { id: 'categories', label: 'Asset Categories', icon: Tags, to: '/ppmo/categories' }
    ]
  },
  {
    title: 'Property Issuance',
    items: [
      { id: 'assignments', label: 'Asset Assignment', icon: PackageCheck, to: '/ppmo/assignments' },
      { id: 'transfers', label: 'Asset Transfer', icon: RotateCcw, to: '/ppmo/transfers' },
      { id: 'returns', label: 'Asset Return', icon: RotateCcw, to: '/ppmo/returns' }
    ]
  },
  {
    title: 'Inventory',
    items: [
      { id: 'supplies', label: 'Supplies Inventory', icon: Archive, to: '/ppmo/supplies' },
      { id: 'departments', label: 'Department', icon: Building2, to: '/ppmo/departments' },
      { id: 'monitoring', label: 'Inventory Monitoring', icon: Gauge, to: '/ppmo/monitoring' }
    ]
  },
  {
    title: 'Maintenance',
    items: [
      { id: 'maintenance', label: 'Preventive Maintenance', icon: Wrench, to: '/ppmo/maintenance' },
      { id: 'damage', label: 'Damage Report', icon: PackageOpen, to: '/ppmo/damage' }
    ]
  },
  {
    title: 'Procurement & Audit',
    items: [
      { id: 'purchases', label: 'Purchase Workflow', icon: ShoppingCart, to: '/ppmo/purchases' },
      { id: 'gatepass', label: 'Gate Pass', icon: FileText, to: '/ppmo/gatepass' },
      { id: 'audit', label: 'Audit Dashboard', icon: ClipboardList, to: '/ppmo/audit' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { id: 'walk-in-request', label: 'Walk-in Request', icon: UserPlus, to: '/ppmo/walk-in-request' },
      { id: 'approved-release-queue', label: 'Approved Release Queue', icon: ClipboardCheck, to: '/ppmo/approved-release-queue' }
    ]
  },
  {
    title: 'Document Center',
    items: [
      { id: 'gate-pass-preparation', label: 'Gate Pass Preparation', icon: FileText, to: '/ppmo/gate-pass-preparation' },
      { id: 'release-receipt-preparation', label: 'Release Receipt Preparation', icon: FileText, to: '/ppmo/release-receipt-preparation' },
      { id: 'purchase-order-documents', label: 'Purchase Order Documents', icon: FileText, to: '/ppmo/purchase-order-documents' }
    ]
  },
  {
    title: 'AI & Reports',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, to: '/ppmo/reports' },
      { id: 'activity', label: 'Activity & Transaction Logs', icon: Activity, to: '/ppmo/activity' }
    ]
  }
];

export default function StaffSidebar({ currentUser, onLogout, collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      <aside className={`staff-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="staff-sidebar-inner">
          <div className="staff-brand">
            <div className="staff-brand-icon"><Package size={20} /></div>
            {!collapsed && (
              <div>
                <strong>PCMS System</strong>
                <p>Property Custodian Management System</p>
              </div>
            )}
          </div>

          <nav className="staff-nav">
            {sidebarSections.map((section) => (
              <div className="staff-section" key={section.title}>
                {!collapsed && <div className="staff-section-title">{section.title}</div>}
                <div className="staff-nav-list">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.to}
                        className={({ isActive }) => `staff-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => onCloseMobile?.()}
                      >
                        <span className="staff-nav-icon"><Icon size={18} /></span>
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="staff-sidebar-footer">
            <div className="staff-profile-card">
              <div className="staff-avatar">{(currentUser?.first_name?.[0] || currentUser?.email?.[0] || 'S').toUpperCase()}</div>
              {!collapsed && (
                <div>
                  <strong>PPMO Staff</strong>
                  <p>PPMO Staff</p>
                </div>
              )}
            </div>
            <button className="staff-logout-btn" type="button" onClick={onLogout}>
              <LogOut size={16} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && <div className="staff-sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}
    </>
  );
}
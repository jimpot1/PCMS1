import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { pcmsApi } from '../services/api.js';
import { hasPermission } from '../services/roles.js';
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
  PackageCheck,
  PackageOpen,
  Package,
  QrCode,
  RotateCcw,
  ShoppingCart,
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
      { id: 'ocr', label: 'OCR Asset Tagging', icon: QrCode, to: '/ppmo/ocr' }
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
  const [unresolvedAnomalyCount, setUnresolvedAnomalyCount] = useState(0);
  const [queueCounts, setQueueCounts] = useState({ assignments: 0, maintenance: 0, release: 0 });

  useEffect(() => {
    if (!currentUser || !hasPermission(currentUser.role, 'canViewReports')) {
      setUnresolvedAnomalyCount(0);
      return undefined;
    }

    let active = true;
    const refreshAnomalyCount = async () => {
      try {
        const summary = await pcmsApi.fetchAnomalySummary();
        if (active) {
          setUnresolvedAnomalyCount(Math.max(0, Number(summary?.open_unresolved || 0)));
        }
      } catch {
        // Keep the last known count if the summary is temporarily unavailable.
      }
    };

    refreshAnomalyCount();
    const interval = setInterval(refreshAnomalyCount, 30000);
    window.addEventListener('pcms:anomaly-data-changed', refreshAnomalyCount);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('pcms:anomaly-data-changed', refreshAnomalyCount);
    };
  }, [currentUser?.role]);

  useEffect(() => {
    if (!currentUser) {
      setQueueCounts({ assignments: 0, maintenance: 0, release: 0 });
      return undefined;
    }

    let active = true;
    const refreshQueueCounts = async () => {
      const [assignmentResult, maintenanceResult, releaseResult] = await Promise.allSettled([
        pcmsApi.assetAssignmentQueue(),
        pcmsApi.fetchMaintenancePredictions(),
        pcmsApi.ppmoReleaseQueue(),
      ]);

      if (!active) return;
      setQueueCounts({
        assignments: assignmentResult.status === 'fulfilled' && Array.isArray(assignmentResult.value) ? assignmentResult.value.length : 0,
        maintenance: maintenanceResult.status === 'fulfilled' && Array.isArray(maintenanceResult.value) ? maintenanceResult.value.length : 0,
        release: releaseResult.status === 'fulfilled' && Array.isArray(releaseResult.value?.purchaseRequests) ? releaseResult.value.purchaseRequests.length : 0,
      });
    };

    refreshQueueCounts();
    const interval = setInterval(refreshQueueCounts, 30000);
    window.addEventListener('pcms:dataChanged', refreshQueueCounts);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('pcms:dataChanged', refreshQueueCounts);
    };
  }, [currentUser?.role]);

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
                        className={({ isActive }) => `staff-nav-item ${isActive ? 'active' : ''} ${item.id === 'monitoring' && unresolvedAnomalyCount > 0 ? 'has-anomaly' : ''} ${['assignments', 'maintenance', 'approved-release-queue'].includes(item.id) && queueCounts[item.id === 'approved-release-queue' ? 'release' : item.id] > 0 ? 'has-queue' : ''}`}
                      >
                        <span className="staff-nav-icon"><Icon size={18} /></span>
                        {!collapsed && <span>{item.label}</span>}
                        {['assignments', 'maintenance', 'approved-release-queue'].includes(item.id) && queueCounts[item.id === 'approved-release-queue' ? 'release' : item.id] > 0 && (
                          <span className="nav-count-badge" aria-label={`${queueCounts[item.id === 'approved-release-queue' ? 'release' : item.id]} items in ${item.label}`}>
                            {queueCounts[item.id === 'approved-release-queue' ? 'release' : item.id] > 99 ? '99+' : queueCounts[item.id === 'approved-release-queue' ? 'release' : item.id]}
                          </span>
                        )}
                        {item.id === 'monitoring' && unresolvedAnomalyCount > 0 && (
                          <span className="nav-anomaly-badge" aria-label={`${unresolvedAnomalyCount} unresolved anomalies`}>
                            {unresolvedAnomalyCount > 99 ? '99+' : unresolvedAnomalyCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

        </div>
      </aside>
      {mobileOpen && <div className="staff-sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />}
    </>
  );
}

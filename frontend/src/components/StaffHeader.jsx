import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import HeaderActions from './HeaderActions.jsx';

const routeTitles = {
  dashboard: 'Dashboard',
  assets: 'Asset Registry',
  ocr: 'OCR Asset Tagging',
  assignments: 'Asset Assignment',
  transfers: 'Asset Transfer',
  returns: 'Asset Return',
  supplies: 'Supplies Inventory',
  departments: 'Department',
  monitoring: 'Inventory Monitoring',
  maintenance: 'Preventive Maintenance',
  damage: 'Damage Report',
  purchases: 'Purchase Workflow',
  gatepass: 'Gate Pass',
  audit: 'Audit Dashboard',
  'walk-in-request': 'Walk-in Request',
  'approved-release-queue': 'Approved Release Queue',
  'gate-pass-preparation': 'Gate Pass Preparation',
  'release-receipt-preparation': 'Release Receipt Preparation',
  'purchase-order-documents': 'Purchase Order Documents',
  reports: 'Reports & Analytics',
  activity: 'Activity & Transaction Logs',
  'receiving-history': 'Receiving History',
  'stock-counting': 'Stock Counting',
  'stock-verification': 'Stock Verification',
  'inventory-encoding': 'Inventory Encoding',
  notifications: 'Notifications',
};

export default function StaffHeader({ currentUser, onLogout, sidebarCollapsed, onToggleSidebar, onOpenMobile }) {
  const location = useLocation();
  const routeKey = location.pathname.replace(/^\/ppmo\/?/, '').replace(/\/+$/, '') || 'dashboard';
  const title = routeTitles[routeKey] || routeKey
    .split('/')
    .pop()
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const handleSidebarButton = () => {
    if (window.matchMedia('(max-width: 980px)').matches) {
      onOpenMobile();
      return;
    }
    onToggleSidebar();
  };

  return (
    <header className="staff-header">
      <div className="staff-header-left">
        <button className="staff-icon-btn staff-sidebar-toggle" type="button" onClick={handleSidebarButton} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="staff-header-right">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

import React from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import HeaderActions from "./HeaderActions.jsx";

const routeMeta = {
  "/oic/dashboard": {
    title: "Dashboard",
    subtitle:
      "Manage approved requests and gate passes ready for final release.",
  },
  "/oic/release-queue": {
    title: "Release Queue",
    subtitle: "Release fully approved purchase orders and gate passes.",
  },
  "/oic/approvals": {
    title: "Approval History",
    subtitle: "Review historical release decisions and activity logs.",
  },
  "/oic/reports": {
    title: "Reports",
    subtitle: "Export release summaries and audit-ready reports.",
  },
  "/oic/audit": {
    title: "Physical Audit",
    subtitle:
      "Schedule audits, scan QR tags, verify OCR labels, and report missing assets.",
  },
  "/oic/notifications": {
    title: "Notifications",
    subtitle: "Receive release alerts and operational updates.",
  },
};

export default function OicHeader({
  currentUser,
  onLogout,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobile,
}) {
  const location = useLocation();
  const displayName =
    [currentUser?.first_name, currentUser?.last_name]
      .filter(Boolean)
      .join(" ") ||
    currentUser?.full_name ||
    currentUser?.email ||
    "OIC";
  const meta = routeMeta[location.pathname] || routeMeta["/oic/dashboard"];
  const handleSidebarToggle = () => {
    if (window.matchMedia("(max-width: 980px)").matches) {
      onOpenMobile?.();
      return;
    }
    onToggleSidebar?.();
  };

  return (
    <header className="oic-header">
      <div className="oic-header-left">
        <button
          className="oic-sidebar-toggle icon-button"
          type="button"
          onClick={handleSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="breadcrumb">PCMS / Property Custodian</div>
          <h1>{meta.title}</h1>
          <p>{meta.subtitle}</p>
        </div>
      </div>
      <div className="oic-header-right">
        <HeaderActions currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}

import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  ClipboardCheck,
  FileText,
  BarChart3,
  Bell,
  LogOut,
  Sparkles,
  Gauge,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, to: "/oic/dashboard" },
  {
    id: "release-queue",
    label: "Release Queue",
    icon: ClipboardCheck,
    to: "/oic/release-queue",
  },
  {
    id: "approvals",
    label: "Approval History",
    icon: FileText,
    to: "/oic/approvals",
  },
  {
    id: "monitoring",
    label: "Inventory Monitoring",
    icon: Gauge,
    to: "/oic/monitoring",
  },
  {
    id: "audit",
    label: "Physical Audit",
    icon: ClipboardCheck,
    to: "/oic/audit",
  },
  { id: "reports", label: "Reports", icon: BarChart3, to: "/oic/reports" },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    to: "/oic/notifications",
  },
];

export default function OicSidebar({
  currentUser,
  onLogout,
  collapsed,
  mobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {mobileOpen && <div className="overlay" onClick={onCloseMobile} />}
      <aside
        className={`oic-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          {!collapsed && (
            <div>
              <strong>Property Custodian</strong>
              <span>Final release and fulfillment</span>
            </div>
          )}
        </div>

        <nav className="oic-nav">
          <div className="oic-section">
            {!collapsed && (
              <div className="oic-section-title">OIC / PPMO MENU</div>
            )}
            <div>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    className={({ isActive }) =>
                      `oic-nav-item ${isActive ? "active" : ""}`
                    }
                    onClick={() => onCloseMobile?.()}
                  >
                    <span className="icon">
                      <Icon size={18} />
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="oic-sidebar-footer">
          <div className="oic-profile">
            <div className="avatar">
              {(
                currentUser?.first_name?.[0] ||
                currentUser?.email?.[0] ||
                "O"
              ).toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <strong>
                  {currentUser?.first_name || "Property"}{" "}
                  {currentUser?.last_name || "Custodian"}
                </strong>
                <p>{currentUser?.role || "Property Custodian"}</p>
              </div>
            )}
          </div>
          <button className="logout-btn" type="button" onClick={onLogout}>
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

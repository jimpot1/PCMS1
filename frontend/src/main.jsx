import React, { useMemo, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Boxes,
  Layers,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  FileBarChart2,
  Filter,
  Gauge,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  LockKeyhole,
  Mail,
  Menu,
  Package,
  PackageCheck,
  PackageOpen,
  Pencil,
  Printer,
  QrCode,
  Barcode,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Timer,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  UserX,
  Users,
  Wrench,
  X,
} from "lucide-react";
import RequesterLayout from "./components/RequesterLayout.jsx";
import RequesterStatCard from "./components/RequesterStatCard.jsx";
import RequestEditModal from "./components/RequestEditModal.jsx";
import RequesterQuickActionCard from "./components/QuickActionCard.jsx";
import RequesterRequestForm from "./components/RequesterRequestForm.jsx";
import RequesterItemTable from "./components/RequesterItemTable.jsx";
import RequesterNotificationPanel from "./components/NotificationPanel.jsx";
import { exportElementToPdf } from "./utils/pdfExport.js";
import DepartmentHeadLayout from "./components/DepartmentHeadLayout.jsx";
import DepartmentHeadHeader from "./components/DepartmentHeadHeader.jsx";
import UserNotificationsPage from "./components/UserNotificationsPage.jsx";
import PurchaseWorkflowMonitor from "./components/PurchaseWorkflowMonitor.jsx";
import PurchaseRequestDetails from "./components/PurchaseRequestDetails.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DeptDashboardPage from "./pages/DepartmentHead/Dashboard.jsx";
import DeptPending from "./pages/DepartmentHead/PendingApprovals.jsx";
import DeptQueue from "./pages/DepartmentHead/ApprovalQueue.jsx";
import DeptHistory from "./pages/DepartmentHead/ApprovalHistory.jsx";
import DeptAnalytics from "./pages/DepartmentHead/DepartmentAnalytics.jsx";
import DeptNotifications from "./pages/DepartmentHead/Notifications.jsx";
import StaffLayout from "./components/StaffLayout.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import PPMODashboard from "./pages/PPMO/Dashboard.jsx";
import ApprovedReleaseQueue from "./pages/PPMO/ApprovedReleaseQueue.jsx";
import GatePassPreparation from "./pages/PPMO/GatePassPreparation.jsx";
import ReleaseReceiptPreparation from "./pages/PPMO/ReleaseReceiptPreparation.jsx";
import ReceiveDeliveries from "./pages/PPMO/ReceiveDeliveries.jsx";
import WalkInRequest from "./pages/PPMO/WalkInRequest.jsx";
import StockVerification from "./pages/PPMO/StockVerification.jsx";
import PPMOFeaturePage from "./pages/PPMO/FeaturePage.jsx";
import PurchaseOrderDocuments from "./pages/PPMO/PurchaseOrderDocuments.jsx";
import PresidentLayout from "./components/PresidentLayout.jsx";
import PresDashboard from "./pages/President/Dashboard.jsx";
import PresPurchaseApprovals from "./pages/President/PurchaseApprovals.jsx";
import PresHistory from "./pages/President/ApprovalHistory.jsx";
import PresAnalytics from "./pages/President/Analytics.jsx";
import PresNotifications from "./pages/President/Notifications.jsx";
import OicLayout from "./components/OicLayout.jsx";
import OicDashboard from "./pages/OIC/Dashboard.jsx";
import OicApprovals from "./pages/OIC/Approvals.jsx";
import OicReports from "./pages/OIC/Reports.jsx";
import OicNotifications from "./pages/OIC/Notifications.jsx";
import DepartmentHeadStatCard from "./components/DepartmentHeadStatCard.jsx";
import ApprovalQueueTable from "./components/ApprovalQueueTable.jsx";
import RequestReviewDrawer from "./components/RequestReviewDrawer.jsx";
import DecisionPanel from "./components/DecisionPanel.jsx";
import QuickActionCard from "./components/QuickActionCard.jsx";
import DepartmentAnalytics from "./components/DepartmentAnalytics.jsx";
import RecentActivity from "./components/RecentActivity.jsx";
import NotificationPanel from "./components/NotificationPanel.jsx";
import RecommendingApproverLayout from "./components/RecommendingApproverLayout.jsx";
import RecommendingApproverDashboard from "./pages/RecommendingApprover/Dashboard.jsx";
import RecommendingApproverReviewQueue from "./pages/RecommendingApprover/ReviewQueuePage.jsx";
import RecommendingApproverPlaceholder from "./pages/RecommendingApprover/PlaceholderPage.jsx";
import PendingReviews from "./pages/RecommendingApprover/PendingReviews.jsx";
import ConditionalApprovals from "./pages/RecommendingApprover/ConditionalApprovals.jsx";
import InformationRequests from "./pages/RecommendingApprover/InformationRequests.jsx";
import ReviewHistory from "./pages/RecommendingApprover/ReviewHistory.jsx";
import ValidationAnomalies from "./pages/RecommendingApprover/ValidationAnomalies.jsx";
import AuditTrail from "./pages/RecommendingApprover/AuditTrail.jsx";
import ReviewRequest from "./pages/RecommendingApprover/ReviewRequest.jsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  auditItems,
  categories,
  departments as mockDepartments,
  maintenance,
  purchaseRequests,
  roleMatrix,
  supplies,
  transfers,
} from "./data/mockData.js";
import "./styles.css";
import "./styles-staff.css";
import {
  signInWithEmail,
  signOut,
  getCurrentSession,
  onAuthStateChange,
  getCurrentUserProfile,
  getStoredUser,
} from "./services/auth.js";
import { ROLES, hasPermission } from "./services/roles.js";
import { pcmsApi, assetQrCodeUrl } from "./services/api.js";
import jsQR from "jsqr";
import { TableSkeleton, ListSkeleton } from "./components/TableSkeleton.jsx";

const sidebarSections = [
  {
    id: "overview",
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "asset-management",
    title: "Asset Management",
    icon: Package,
    items: [
      { id: "assets", label: "Asset Registry", icon: Archive },
      { id: "ocr", label: "OCR Asset Tagging", icon: Camera },
      { id: "categories", label: "Asset Categories", icon: Boxes },
    ],
  },
  {
    id: "property-issuance",
    title: "Property Issuance",
    icon: UserCheck,
    items: [
      { id: "assignments", label: "Asset Assignment", icon: UserCheck },
      { id: "transfers", label: "Asset Transfer", icon: Truck },
      { id: "returns", label: "Asset Return", icon: PackageCheck },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: PackageOpen,
    items: [
      { id: "supplies", label: "Supplies Inventory", icon: Archive },
      { id: "departments", label: "Department", icon: Building2 },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance",
    icon: Wrench,
    items: [
      { id: "maintenance", label: "Preventive Maintenance", icon: Wrench },
      { id: "damage", label: "Damage Report", icon: AlertTriangle },
    ],
  },
  {
    id: "procurement-audit",
    title: "Procurement & Audit",
    icon: ClipboardCheck,
    items: [
      { id: "purchases", label: "Purchase Workflow", icon: ShoppingCart },
      { id: "gatepass", label: "Gate Pass", icon: QrCode },
      { id: "audit", label: "Audit Dashboard", icon: ClipboardCheck },
    ],
  },
  {
    id: "ai-features",
    title: "AI & Reports",
    icon: Sparkles,
    items: [
      { id: "ocr", label: "OCR Asset Tagging", icon: Camera },
      { id: "monitoring", label: "Inventory Monitoring", icon: Gauge },
      { id: "reports", label: "Report & Analytics", icon: FileBarChart2 },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: Settings,
    items: [
      { id: "users", label: "User Management", icon: Users },
      { id: "notifications", label: "Notification", icon: Bell },
      { id: "settings", label: "System Settings", icon: Settings },
      { id: "activity", label: "Activity Logs", icon: History },
    ],
  },
];

const sidebarItems = sidebarSections.flatMap((section) => section.items);

const formatCurrency = (value) => `PHP ${value.toLocaleString()}`;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("pcms_sidebar_collapsed") === "1",
  );
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 981px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 981px)");
    const handleChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const effectiveSidebarCollapsed = sidebarCollapsed && isDesktop;
  const [authError, setAuthError] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    assets: [],
    departments: [],
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifData, setNotifData] = useState({ data: [], unread_count: 0 });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const notifRef = useRef(null);
  const notifButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const current =
    sidebarItems.find((item) => item.id === activePage) || sidebarItems[0];
  const page = useMemo(
    () => renderPage(activePage, setActivePage, currentUser),
    [activePage, currentUser],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadNotifications = () =>
      pcmsApi
        .notifications()
        .then(setNotifData)
        .catch(() => {});
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setShowSearchResults(false);
        setShowNotifDropdown(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target)
      ) {
        setShowNotifDropdown(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults({ assets: [], departments: [] });
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const [assets, departments] = await Promise.all([
          pcmsApi.assets({ search: searchQuery, limit: 5 }),
          pcmsApi.departments().catch(() => []),
        ]);
        const query = searchQuery.trim().toLowerCase();
        setSearchResults({
          assets: assets || [],
          departments: (departments || [])
            .filter(
              (d) =>
                (d.name || "").toLowerCase().includes(query) ||
                (d.code || "").toLowerCase().includes(query),
            )
            .slice(0, 5),
        });
      } catch {
        setSearchResults({ assets: [], departments: [] });
      }
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  const goToSearchResult = (pageId) => {
    setActivePage(pageId);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleAdminNotificationClick = async (notification) => {
    if (
      notification &&
      !notification.read &&
      notification.source &&
      notification.id
    ) {
      try {
        await pcmsApi.markNotificationRead(
          notification.source,
          notification.id,
        );
        setNotifData((previous) => ({
          ...previous,
          data: (previous.data || []).map((item) =>
            item.id === notification.id && item.source === notification.source
              ? { ...item, read: true }
              : item,
          ),
          unread_count: Math.max(0, (previous.unread_count || 0) - 1),
        }));
      } catch {
        // keep navigation responsive even if read state update fails
      }
    }

    setShowNotifDropdown(false);

    if (notification?.anomaly_id || notification?.url?.includes("anomaly=")) {
      const anomalyId =
        notification.anomaly_id ||
        new URL(notification.url, window.location.origin).searchParams.get(
          "anomaly",
        );
      window.history.pushState({}, "", `/?anomaly=${anomalyId}`);
      setActivePage("monitoring");
      return;
    }

    setActivePage("notifications");
  };

  useEffect(() => {
    async function loadUserProfile(sessionUser) {
      if (!sessionUser) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(sessionUser);
    }

    async function initAuth() {
      const session = await getCurrentSession();
      setIsAuthenticated(!!session);
      await loadUserProfile(session);
      setIsLoadingAuth(false);
    }
    initAuth();
    // Note: persistCurrentUser() (called by signInWithEmail/signOut/getCurrentSession)
    // already stores the fresh, correct user before firing this event, so we just
    // read that instead of re-fetching /api/auth/me here. Re-fetching on every
    // event caused a race right after login: the login response would set the
    // user, then this listener's own /me re-check could still fail/lag and
    // immediately flip the app back to "logged out".
    const unsubscribe = onAuthStateChange(() => {
      const sessionUser = getStoredUser();
      setIsAuthenticated(!!sessionUser);
      setCurrentUser(sessionUser);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async ({ email, password }) => {
    setAuthError(null);
    setIsSigningIn(true);
    const { data, error } = await signInWithEmail(email, password);
    setIsSigningIn(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    const profile = data?.user || null;
    setCurrentUser(profile);
    setIsAuthenticated(!!profile);
  };

  const handleLogout = async () => {
    await signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActivePage("dashboard");
  };

  const requestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await handleLogout();
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSelectPage = (pageId) => {
    setActivePage(pageId);
    setSidebarOpen(false);
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("pcms_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  if (isLoadingAuth) {
    return (
      <div className="login-wrapper">
        <div className="loading-card">Loading authentication…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        authError={authError}
        isSigningIn={isSigningIn}
      />
    );
  }

  const role = currentUser?.role;
  const isPresident = role === "President" || role === "CEO";
  const isDepartmentHead = role === "Department Head";
  const isRequester = role === "Requester";
  const isPpmoStaff = role === "PPMO Staff";
  const isOic = role === "OIC" || role === "Property Custodian";
  const isRecommendingApprover = role === ROLES.RECOMMENDING_APPROVER;
  const isSystemAdmin = role === ROLES.SYSTEM_ADMIN;
  const defaultRedirect = isPresident
    ? "/president/dashboard"
    : isDepartmentHead
      ? "/department-head/dashboard"
      : isRequester
        ? "/requester"
        : isOic
          ? "/oic/dashboard"
          : isRecommendingApprover
            ? "/recommending-approver/dashboard"
            : isPpmoStaff
              ? "/ppmo"
              : isSystemAdmin
                ? "/"
                : "/";

  const adminShell = (
    <div
      className={`sms-app ${effectiveSidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <aside
        className={`sidebar ${effectiveSidebarCollapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Package size={20} />
          </div>
          <div>
            <strong>PCMS Admin</strong>
            <span>System Administrator</span>
          </div>
        </div>
        <div className="sidebar-nav">
          {sidebarSections.map((section) => (
            <div className="sidebar-section" key={section.id}>
              <div className="nav-section-label">{section.title}</div>
              <div className="nav-items">
                {section.items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`nav-link ${activePage === item.id ? "active" : ""}`}
                    data-label={item.label}
                    onClick={() => handleSelectPage(item.id)}
                  >
                    <span className="nav-link-icon">
                      <item.icon size={18} />
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="help-button" type="button">
          <HelpCircle size={18} />
          <span>Need help? Contact support</span>
        </button>
      </aside>
      {sidebarOpen && !isDesktop && (
        <button
          className="overlay"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button
              className={`menu-button ${effectiveSidebarCollapsed ? "active" : ""}`}
              type="button"
              onClick={() =>
                isDesktop
                  ? toggleSidebarCollapsed()
                  : setSidebarOpen((current) => !current)
              }
            >
              <Menu size={20} />
            </button>
            <div>
              <strong>{current.label}</strong>
              <span className="breadcrumb">System Administrator</span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="action" style={{ position: "relative" }}>
              <button
                ref={notifButtonRef}
                className="icon-button"
                type="button"
                aria-haspopup="true"
                aria-expanded={showNotifDropdown}
                onClick={() =>
                  setShowNotifDropdown((current) => {
                    const next = !current;
                    if (next) setShowProfileMenu(false);
                    return next;
                  })
                }
              >
                <Bell size={18} />
              </button>
              {showNotifDropdown && (
                <div ref={notifRef} className="dropdown notification-dropdown">
                  <div className="dropdown-header">Notifications</div>
                  <div className="dropdown-body">
                    {((notifData && notifData.data) || []).length === 0 ? (
                      <div className="dropdown-empty">No new notifications</div>
                    ) : (
                      ((notifData && notifData.data) || [])
                        .slice(0, 6)
                        .map((n, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`notification-item ${n.read ? "read" : "unread"}`}
                            onClick={() => handleAdminNotificationClick(n)}
                          >
                            <div className="notification-title">
                              {n.title || n.message || "Notification"}
                            </div>
                            {n.message && (
                              <div className="notification-message">
                                {n.message}
                              </div>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                  <div className="dropdown-footer">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => {
                        setShowNotifDropdown(false);
                        setActivePage("notifications");
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="action" style={{ position: "relative" }}>
              <button
                ref={profileButtonRef}
                className="profile-button"
                type="button"
                aria-haspopup="true"
                aria-expanded={showProfileMenu}
                onClick={() =>
                  setShowProfileMenu((current) => {
                    const next = !current;
                    if (next) setShowNotifDropdown(false);
                    return next;
                  })
                }
              >
                <div className="avatar">
                  {(
                    currentUser?.first_name?.[0] ||
                    currentUser?.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </div>
                <div className="profile-text">
                  <div className="profile-name">
                    {currentUser?.first_name || currentUser?.email || "User"}
                  </div>
                  <div className="profile-role">{currentUser?.role}</div>
                </div>
                <svg
                  className="profile-chevron"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 7.5L10 12L14.5 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showProfileMenu && (
                <div ref={profileMenuRef} className="dropdown profile-dropdown">
                  <div className="dropdown-list">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActivePage("profile");
                        window.location.href = "/profile";
                      }}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActivePage("settings");
                        window.location.href = "/account-settings";
                      }}
                    >
                      Account Settings
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActivePage("activity");
                      }}
                    >
                      Activity Log
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActivePage("settings");
                      }}
                    >
                      System Preferences
                    </button>
                  </div>
                  <div className="dropdown-footer">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Removed duplicate logout button - logout is available inside profile dropdown */}
          </div>
        </div>
        <div className="content">{page}</div>
      </div>
    </div>
  );

  return (
    <>
      {showLogoutConfirm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeLogoutConfirm}
        >
          <div
            className="modal-card confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Logout</h3>
              <button
                className="icon-button"
                type="button"
                onClick={closeLogoutConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to logout?</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeLogoutConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button danger"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Logging out..." : "Log Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BrowserRouter>
        <Routes>
          {isPresident && (
            <Route
              path="/president/*"
              element={
                <PresidentLayout
                  currentUser={currentUser}
                  onLogout={requestLogout}
                />
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PresDashboard />} />
              <Route path="approvals" element={<PresPurchaseApprovals />} />
              <Route path="history" element={<PresHistory />} />
              <Route path="analytics" element={<PresAnalytics />} />
              <Route
                path="notifications"
                element={
                  <UserNotificationsPage
                    title="Notifications"
                    subtitle="President notifications and approval alerts."
                  />
                }
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          )}

          {/* Global profile and account routes */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/account-settings" element={<AccountSettings />} />

          {isDepartmentHead && (
            <Route
              path="/department-head/*"
              element={
                <DepartmentHeadLayout
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              }
            >
              <Route index element={<DeptDashboardPage />} />
              <Route path="dashboard" element={<DeptDashboardPage />} />
              <Route path="pending" element={<DeptPending />} />
              <Route path="pending-approvals" element={<DeptPending />} />
              <Route path="queue" element={<DeptQueue />} />
              <Route path="history" element={<DeptHistory />} />
              <Route path="analytics" element={<DeptAnalytics />} />
              <Route path="notifications" element={<DeptNotifications />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          )}

          {isOic && (
            <Route
              path="/oic/*"
              element={
                <OicLayout currentUser={currentUser} onLogout={handleLogout} />
              }
            >
              <Route index element={<OicDashboard />} />
              <Route path="dashboard" element={<OicDashboard />} />
              <Route path="release-queue" element={<OicDashboard />} />
              <Route path="approvals" element={<OicApprovals />} />
              <Route path="reports" element={<OicReports />} />
              <Route
                path="monitoring"
                element={<MonitoringPage currentUser={currentUser} />}
              />
              <Route path="audit" element={<AuditPage currentUser={currentUser} />} />
              <Route
                path="notifications"
                element={
                  <UserNotificationsPage
                    title="Notifications"
                    subtitle="Custodian notifications and operational alerts."
                  />
                }
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          )}

          {isPpmoStaff && (
            <Route
              path="/ppmo/*"
              element={
                <StaffLayout
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              }
            >
              <Route index element={<PPMODashboard />} />
              <Route path="dashboard" element={<PPMODashboard />} />
              <Route
                path="assets"
                element={<AssetRegistry currentUser={currentUser} />}
              />
              <Route path="ocr" element={<OcrPage />} />
              <Route path="categories" element={<CategoryPage />} />
              <Route path="assignments" element={<EnhancedAssignmentsPage />} />
              <Route path="transfers" element={<TransferPage />} />
              <Route path="returns" element={<AssetReturnPage />} />
              <Route path="supplies" element={<SuppliesPage currentUser={currentUser} />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route
                path="monitoring"
                element={<MonitoringPage currentUser={currentUser} />}
              />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="damage" element={<DamagePage />} />
              <Route path="purchases" element={<PurchasePage currentUser={currentUser} />} />
              <Route path="gatepass" element={<GatePassPage />} />
              <Route path="audit" element={<AuditPage currentUser={currentUser} />} />
              <Route path="walk-in-request" element={<WalkInRequest />} />
              <Route
                path="approved-release-queue"
                element={<ApprovedReleaseQueue />}
              />
              <Route
                path="receive-deliveries"
                element={<ReceiveDeliveries />}
              />
              <Route
                path="receiving-history"
                element={
                  <PPMOFeaturePage
                    title="Receiving History"
                    caption="View historical receiving records and transactions"
                  />
                }
              />
              <Route
                path="stock-counting"
                element={
                  <PPMOFeaturePage
                    title="Stock Counting"
                    caption="Conduct physical inventory counts"
                  />
                }
              />
              <Route
                path="stock-verification"
                element={<StockVerification />}
              />
              <Route
                path="inventory-encoding"
                element={
                  <PPMOFeaturePage
                    title="Inventory Encoding"
                    caption="Encode inventory data into the system"
                  />
                }
              />
              <Route
                path="returned-assets"
                element={
                  <PPMOFeaturePage
                    title="Returned Assets"
                    caption="Process and manage returned items"
                  />
                }
              />
              <Route
                path="damaged-assets"
                element={
                  <PPMOFeaturePage
                    title="Damaged Assets"
                    caption="Report and track damaged property items"
                  />
                }
              />
              <Route
                path="gate-pass-preparation"
                element={<GatePassPreparation />}
              />
              <Route
                path="release-receipt-preparation"
                element={<ReleaseReceiptPreparation />}
              />
              <Route
                path="purchase-order-documents"
                element={<PurchaseOrderDocuments />}
              />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route
                path="print-center"
                element={
                  <PPMOFeaturePage
                    title="Print Center"
                    caption="Print documents and reports"
                  />
                }
              />
              <Route
                path="qr-scanner"
                element={
                  <PPMOFeaturePage
                    title="QR Code Scanner"
                    caption="Scan QR codes for asset verification"
                  />
                }
              />
              <Route
                path="barcode-scanner"
                element={
                  <PPMOFeaturePage
                    title="Barcode Scanner"
                    caption="Scan barcodes for inventory operations"
                  />
                }
              />
              <Route
                path="reports/daily-operations"
                element={
                  <PPMOFeaturePage
                    title="Daily Operations Report"
                    caption="View daily operations summary and metrics"
                  />
                }
              />
              <Route
                path="reports/release-history"
                element={
                  <PPMOFeaturePage
                    title="Release History Report"
                    caption="Review historical release transactions"
                  />
                }
              />
              <Route
                path="reports/receiving-history"
                element={<PPMODashboard />}
              />
              <Route
                path="notifications"
                element={
                  <UserNotificationsPage
                    title="Notifications"
                    subtitle="PPMO notifications and workflow updates."
                  />
                }
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          )}

          {isRecommendingApprover && (
            <Route
              path="/recommending-approver/*"
              element={
                <RecommendingApproverLayout
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route
                path="dashboard"
                element={<RecommendingApproverDashboard />}
              />
              <Route
                path="review-queue"
                element={<RecommendingApproverReviewQueue />}
              />
              <Route path="review/:requestId" element={<ReviewRequest />} />
              <Route
                path="pending-reviews"
                element={
                  <Navigate to="/recommending-approver/review-queue" replace />
                }
              />
              <Route
                path="conditional-approvals"
                element={<ConditionalApprovals />}
              />
              <Route
                path="information-requests"
                element={<InformationRequests />}
              />
              <Route path="review-history" element={<ReviewHistory />} />
              <Route
                path="validation-anomalies"
                element={<ValidationAnomalies />}
              />
              <Route path="audit-trail" element={<AuditTrail />} />
              <Route
                path="notifications"
                element={
                  <UserNotificationsPage
                    title="Notifications"
                    subtitle="Recommendation review notifications."
                  />
                }
              />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          )}

          {isSystemAdmin && <Route path="/*" element={adminShell} />}

          <Route
            path="*"
            element={
              isRequester ? (
                <RequesterDashboard
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : isOic ? (
                <Navigate to="/oic/dashboard" replace />
              ) : isPpmoStaff ? (
                <Navigate to="/ppmo" replace />
              ) : isRecommendingApprover ? (
                <Navigate to="/recommending-approver/dashboard" replace />
              ) : isSystemAdmin ? (
                adminShell
              ) : (
                <Navigate to={defaultRedirect} replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function LoginPage({ onLogin, authError, isSigningIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ email, password });
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <section className="left-panel">
          <div>
            <div className="logo">
              <div className="brand-icon">
                <Building2 size={30} />
              </div>
              <div>
                <h2>PCMS</h2>
                <p>Property Custodian Management</p>
              </div>
            </div>

            <h1 className="login-title">
              Manage. Monitor. Maintain with Confidence.
            </h1>
            <p className="login-subtitle">
              A centralized system to manage properties, custodians, requests,
              maintenance, and assets efficiently.
            </p>
          </div>
        </section>

        <section className="right-panel">
          <div className="login-form-container">
            <div className="logo">
              <div className="brand-icon">
                <Building2 size={30} />
              </div>
              <div>
                <h2>PCMS</h2>
              </div>
            </div>

            <h1 className="login-title">Welcome Back!</h1>
            <p className="login-subtitle">
              Sign in to continue to your account
            </p>

            <form onSubmit={handleSubmit}>
              {authError && <div className="login-error">{authError}</div>}
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="input-group password-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className={`password-toggle ${showPassword ? "active" : ""}`}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={isSigningIn}
              >
                {isSigningIn ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleDashboardShell({
  title,
  subtitle,
  currentUser,
  onLogout,
  children,
}) {
  return (
    <main className="role-dashboard">
      <header className="role-topbar">
        <div>
          <span className="breadcrumb">PCMS / {currentUser?.role}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="role-user">
          <div className="avatar">
            {(
              currentUser?.first_name?.[0] ||
              currentUser?.email?.[0] ||
              "U"
            ).toUpperCase()}
          </div>
          <div>
            <strong>
              {currentUser?.first_name} {currentUser?.last_name}
            </strong>
            <span>{currentUser?.department || currentUser?.role}</span>
          </div>
          <button className="secondary-button" type="button" onClick={onLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>
      {children}
    </main>
  );
}

function RequesterDashboard({ currentUser, onLogout }) {
  const [activeAction, setActiveAction] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const closeRequesterLogoutConfirm = () => setShowLogoutConfirm(false);

  const handleRequesterLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmRequesterLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await onLogout();
      setShowLogoutConfirm(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const actions = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "submit", label: "Submit Request", icon: Upload },
    { id: "status", label: "Request Status", icon: ClipboardList },
    { id: "receive", label: "Receive Items", icon: PackageCheck },
    { id: "history", label: "Request History", icon: History },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "assets", label: "My Assigned Assets", icon: Package },
    { id: "downloads", label: "Download Documents", icon: Download },
  ];

  const loadSummary = async () => {
    try {
      setSummary(await pcmsApi.requesterDashboard());
      setSummaryError(null);
    } catch (err) {
      setSummaryError(err.message);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const stats = summary?.stats || {};
  const quickActions = [
    {
      id: "submit",
      label: "Submit Request",
      description: "Create a new property or supply request",
      icon: Upload,
    },
    {
      id: "status",
      label: "View Status",
      description: "Track approval workflow",
      icon: ClipboardList,
    },
    {
      id: "receive",
      label: "Receive Items",
      description: "Confirm released items",
      icon: PackageCheck,
    },
    {
      id: "history",
      label: "Request History",
      description: "Review previous requests",
      icon: History,
    },
    {
      id: "downloads",
      label: "Download Documents",
      description: "Access approved documents",
      icon: Download,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "View system updates",
      icon: Bell,
    },
  ];

  const renderContent = () => {
    if (activeAction === "submit") {
      return (
        <RequesterRequestForm
          currentUser={currentUser}
          onSubmitted={loadSummary}
          summary={summary}
        />
      );
    }
    if (activeAction === "status") {
      return <RequesterStatus records={summary?.history || []} />;
    }
    if (activeAction === "receive") {
      return (
        <RequesterReceiveItems
          onChanged={loadSummary}
          initialItems={summary?.receivable_items || []}
        />
      );
    }
    if (activeAction === "history") {
      return <RequesterHistory records={summary?.history || []} />;
    }
    if (activeAction === "notifications") {
      return <NotificationPanel notifications={summary?.notifications || []} />;
    }
    if (activeAction === "assets") {
      return (
        <RequesterAssignedAssets
          assignments={summary?.assigned_assets || []}
          onChanged={loadSummary}
        />
      );
    }
    if (activeAction === "downloads") {
      return <RequesterDownloads />;
    }

    return (
      <>
        <section className="requester-hero-card">
          <div>
            <p className="requester-eyebrow">Welcome back</p>
            <h2>Welcome back, Requester!</h2>
            <p>
              Track your requests, approvals, released items, and assigned
              properties.
            </p>
          </div>
          <button
            className="requester-submit-btn"
            type="button"
            onClick={() => setActiveAction("submit")}
          >
            <Upload size={16} /> Submit Request
          </button>
        </section>

        {summaryError && (
          <div className="requester-alert error">{summaryError}</div>
        )}

        <section className="requester-stats-grid">
          <RequesterStatCard
            icon={ClipboardList}
            label="Pending Requests"
            value={stats.pending_requests || 0}
            description="Awaiting review"
          />
          <RequesterStatCard
            icon={CheckCircle2}
            label="Approved Requests"
            value={stats.approved || 0}
            description="Confirmed approvals"
          />
          <RequesterStatCard
            icon={X}
            label="Rejected Requests"
            value={stats.rejected || 0}
            description="Needs revision"
          />
          <RequesterStatCard
            icon={PackageCheck}
            label="Completed Requests"
            value={stats.completed || 0}
            description="Finished workflow"
          />
          <RequesterStatCard
            icon={Archive}
            label="Waiting Release"
            value={stats.items_waiting_for_release || 0}
            description="Ready for dispatch"
          />
          <RequesterStatCard
            icon={PackageOpen}
            label="Returned Items"
            value={stats.returned || 0}
            description="Returned to custody"
          />
        </section>

        <section className="requester-panel-card">
          <div className="requester-panel-header">
            <div>
              <h3>Quick Actions</h3>
              <p>Jump into the most common requester tasks.</p>
            </div>
          </div>
          <div className="requester-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <QuickActionCard
                  key={action.id}
                  icon={Icon}
                  title={action.label}
                  description={action.description}
                  onClick={() => setActiveAction(action.id)}
                />
              );
            })}
          </div>
        </section>
      </>
    );
  };

  return (
    <>
      {showLogoutConfirm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeRequesterLogoutConfirm}
        >
          <div
            className="modal-card confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Logout</h3>
              <button
                className="icon-button"
                type="button"
                onClick={closeRequesterLogoutConfirm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to logout?</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeRequesterLogoutConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button danger"
                  onClick={handleConfirmRequesterLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Logging out..." : "Log Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <RequesterLayout
        currentUser={currentUser}
        onLogout={handleRequesterLogoutRequest}
        activeView={activeAction}
        onNavigate={setActiveAction}
        title={
          activeAction === "dashboard"
            ? "Dashboard"
            : actions.find((action) => action.id === activeAction)?.label ||
              "Requester"
        }
        subtitle={
          activeAction === "dashboard"
            ? "Monitor your requests, approvals, and releases in one place."
            : "Manage your requester workflow safely."
        }
      >
        {renderContent()}
      </RequesterLayout>
    </>
  );
}

// RequesterSubmitRequest component removed in favor of the new RequesterRequestForm component.

function RequesterStatus({ records: initialRecords = [] }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        const [purchaseRequestsData, gatePassesData, transfersData] =
          await Promise.all([
            pcmsApi.requesterPurchaseRequests(),
            pcmsApi.requesterGatePasses(),
            pcmsApi.requesterTransfers(),
          ]);

        setRecords([
          ...purchaseRequestsData.map((item) => ({
            id: `purchase-${item.id}`,
            document_type: "Purchase Request",
            reference_no: item.request_number,
            status: item.status,
            current_approver:
              item.workflow?.next_approver?.name ||
              item.workflow?.next_approver_role ||
              item.current_stage,
            last_updated: item.updated_at || item.created_at,
            request: item,
          })),
          ...gatePassesData.map((item) => ({
            id: `gate-${item.id}`,
            document_type: "Gate Pass",
            reference_no: item.gate_pass_number,
            status: item.status,
            current_approver: item.purpose,
          })),
          ...transfersData.map((item) => ({
            id: `transfer-${item.id}`,
            document_type: "Transfer",
            reference_no: item.transfer_number,
            status: item.status,
            current_approver: item.reason,
          })),
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  return (
    <RequesterTable
      title="My Requests"
      records={records}
      loading={loading}
      error={error}
      onView
    />
  );
}

function RequesterReceiveItems({ onChanged, initialItems = [] }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      setItems(await pcmsApi.requesterGatePasses({ deliverable: true }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const confirmReceipt = async (id) => {
    const receiving_signature = window.prompt(
      "Receiving signature / typed name:",
    );
    if (!receiving_signature) return;
    try {
      setError(null);
      await pcmsApi.requesterConfirmReceipt(id, {
        receiving_signature,
        condition_after: "good",
      });
      setSuccess("Receipt confirmed.");
      await loadItems();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel role-panel">
      <PanelHeader
        title="Receive Items"
        subtitle="Approved gate passes ready for receipt confirmation."
      />
      {success && <div className="form-message success">{success}</div>}
      {error && <div className="form-message error">{error}</div>}
      {loading ? (
        <div className="loading-card">Loading receivable items...</div>
      ) : (
        <div className="approval-list">
          {items.map((item) => (
            <article className="approval-card" key={item.id}>
              <div>
                <strong>{item.gate_pass_number}</strong>
                <p>
                  {item.asset?.name || "Asset"} / {item.purpose}
                </p>
                <span className="status success">{item.status}</span>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => confirmReceipt(item.id)}
              >
                <CheckCircle2 size={16} /> Confirm Receipt
              </button>
            </article>
          ))}
          {items.length === 0 && (
            <p className="empty-state">
              No approved items are ready for receipt.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function RequesterTable({ title, records, loading, error, onView }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    pcmsApi
      .departments()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  const canModify = (record) =>
    record.request &&
    !["released", "cancelled"].includes(record.request.status);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await pcmsApi.deletePurchaseRequest(deleteTarget.id);
      setDeleteTarget(null);
      window.location.reload();
    } catch (err) {
      window.alert(err.message || "Unable to delete request.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="panel role-panel">
      <PanelHeader
        title={title}
        subtitle="Only records submitted by the logged-in requester are shown."
      />
      {error && <div className="form-message error">{error}</div>}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Current Approver / Step</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="table-loading-row">
                  Loading records...
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td>{record.document_type || record.type}</td>
                  <td>
                    <strong>{record.reference_no || record.ref}</strong>
                  </td>
                  <td>
                    <span
                      className={`status ${record.status === "approved" || record.status === "returned" ? "success" : record.status === "rejected" ? "danger" : "warning"}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td>
                    {record.current_approver || record.stage || "Pending"}
                  </td>
                  <td>
                    {record.last_updated
                      ? new Date(record.last_updated).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <div className="requester-row-actions">
                      {record.request && (
                        <button
                          className="requester-action-icon-button"
                          type="button"
                          title="View details"
                          aria-label={`View details for ${record.reference_no}`}
                          onClick={() => setSelectedRequest(record.request)}
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {canModify(record) && (
                        <button
                          className="requester-action-icon-button"
                          type="button"
                          title="Edit request"
                          aria-label={`Edit ${record.reference_no}`}
                          onClick={() => setEditTarget(record.request)}
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {isSystemAdmin && canModify(record) && (
                        <button
                          className="requester-action-icon-button destructive"
                          type="button"
                          title="Delete request"
                          aria-label={`Delete ${record.reference_no}`}
                          onClick={() => setDeleteTarget(record.request)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan="6">No requester submissions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {onView && (
        <PurchaseRequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
      {editTarget && (
        <RequestEditModal
          request={editTarget}
          departments={departments}
          onClose={() => setEditTarget(null)}
          onSaved={() => window.location.reload()}
        />
      )}
      {deleteTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="requester-delete-title"
        >
          <div className="confirm-dialog">
            <h3 id="requester-delete-title">Delete request?</h3>
            <p>
              Delete <strong>{deleteTarget.request_number}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DepartmentHeadDashboard({ currentUser, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  React.useEffect(() => {
    console.log("DepartmentHead activeView ->", activeView);
  }, [activeView]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await pcmsApi.departmentHeadApprovalQueue();
      setQueue([
        ...data.purchaseRequests.map((item) => ({
          ...item,
          type: "purchase",
          label: "Purchase Request",
          ref: item.request_number,
          detail: `Amount PHP ${Number(item.total_amount || 0).toLocaleString()}`,
        })),
        ...data.gatePasses.map((item) => ({
          ...item,
          type: "gate_pass",
          label: "Gate Pass",
          ref: item.gate_pass_number,
          detail: item.purpose,
        })),
        ...data.transfers.map((item) => ({
          ...item,
          type: "transfer",
          label: "Transfer",
          ref: item.transfer_number,
          detail: item.reason || "Department transfer",
        })),
      ]);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const decide = async (item, decision, note = "") => {
    try {
      setError(null);
      if (decision === "reject") {
        const reason =
          note ||
          window.prompt(
            "Enter rejection reason",
            "Rejected by Department Head",
          );
        if (!reason) {
          setError("A rejection reason is required.");
          return;
        }
        const response = await pcmsApi.departmentHeadReject(
          item.type,
          item.id,
          reason,
        );
        const workflow = response?.workflow;
        setMessage(
          workflow?.message || response?.message || "Request rejected.",
        );
        await loadQueue();
        setSelectedItem(null);
        return;
      }

      const response = await pcmsApi.departmentHeadApprove(item.type, item.id);
      const workflow = response?.workflow;
      setMessage(
        workflow?.message || response?.message || "Approval recorded.",
      );
      await loadQueue();
      setSelectedItem(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const quickActions = [
    {
      id: "pending",
      label: "Review Next Request",
      description: "Open next pending approval",
      icon: ClipboardCheck,
    },
    {
      id: "queue",
      label: "Pending Queue",
      description: "View all waiting requests",
      icon: Layers,
    },
    {
      id: "history",
      label: "Approval History",
      description: "Review previous decisions",
      icon: History,
    },
    {
      id: "analytics",
      label: "Department Analytics",
      description: "View department performance",
      icon: FileBarChart2,
    },
  ];

  const stats = [
    {
      label: "Pending Approvals",
      value: queue.length || 0,
      description: "Waiting for review",
      icon: ClipboardList,
    },
    {
      label: "Approved Today",
      value: "12",
      description: "Approved requests today",
      icon: CheckCircle2,
    },
    {
      label: "Rejected Requests",
      value: "4",
      description: "Rejected this month",
      icon: X,
    },
    {
      label: "Returned for Revision",
      value: "3",
      description: "Awaiting requester updates",
      icon: RotateCcw,
    },
    {
      label: "Average Review Time",
      value: "2.4h",
      description: "Average processing duration",
      icon: Timer,
    },
    {
      label: "Department Queue",
      value: queue.length || 0,
      description: "Total active requests",
      icon: Layers,
    },
  ];

  return (
    <DepartmentHeadLayout
      currentUser={currentUser}
      onLogout={onLogout}
      activeView={activeView}
      onNavigate={setActiveView}
      title={activeView === "dashboard" ? "Dashboard" : "Approval Management"}
      subtitle={
        activeView === "dashboard"
          ? "Review department approvals with a focused approval workspace."
          : "Manage your approval queue safely."
      }
    >
      {message && <div className="department-alert success">{message}</div>}
      {error && <div className="department-alert error">{error}</div>}

      {activeView === "dashboard" ? (
        <>
          <section className="department-hero-card">
            <div>
              <p className="department-eyebrow">Welcome back</p>
              <h2>Welcome back, Department Head!</h2>
              <p>
                Review procurement and department requests awaiting your
                approval.
              </p>
            </div>
            <div className="department-hero-actions">
              <button
                className="department-submit-btn"
                type="button"
                onClick={() => setActiveView("pending")}
              >
                <ClipboardCheck size={16} /> Review Approvals
              </button>
              <button
                className="department-secondary-btn"
                type="button"
                onClick={() => setActiveView("history")}
              >
                <History size={16} /> Approval History
              </button>
            </div>
          </section>

          <section className="department-stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <DepartmentHeadStatCard
                  key={stat.label}
                  icon={Icon}
                  label={stat.label}
                  value={stat.value}
                  description={stat.description}
                />
              );
            })}
          </section>

          <section className="department-panel-card">
            <div className="department-panel-header">
              <div>
                <h3>Pending Approval Queue</h3>
                <p>Review the latest requests awaiting your decision.</p>
              </div>
            </div>
            {loading ? (
              <div className="department-empty-state">
                Loading approval queue...
              </div>
            ) : (
              <ApprovalQueueTable
                queue={queue}
                onReview={setSelectedItem}
                onApprove={(item) => setSelectedItem(item)}
              />
            )}
          </section>

          <section className="department-grid-two">
            <QuickActionCard
              icon={ClipboardCheck}
              title="Quick Actions"
              description="Jump into the queue and recent approvals"
              onClick={() => setActiveView("pending")}
            />
            <DepartmentAnalytics />
          </section>

          <section className="department-grid-two">
            <RecentActivity />
            <NotificationPanel
              notifications={[
                {
                  title: "New approval requests",
                  message: "2 new requests pending review",
                },
                {
                  title: "Urgent request",
                  message: "One request needs immediate attention",
                },
              ]}
            />
          </section>
        </>
      ) : (
        <>
          <section className="department-panel-card">
            <div className="department-panel-header">
              <div>
                <h3>Pending Approval Queue</h3>
                <p>Review the latest requests awaiting your decision.</p>
              </div>
            </div>
            {loading ? (
              <div className="department-empty-state">
                Loading approval queue...
              </div>
            ) : (
              <ApprovalQueueTable
                queue={queue}
                onReview={setSelectedItem}
                onApprove={(item) => setSelectedItem(item)}
              />
            )}
          </section>
          {selectedItem && (
            <div className="department-review-layout">
              <RequestReviewDrawer
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
              />
              <DecisionPanel
                selectedItem={selectedItem}
                onApprove={(item, note) => decide(item, "approve", note)}
                onReject={(item, note) => decide(item, "reject", note)}
                onRequestMoreInfo={(item, note) => {
                  setMessage("Request for more information sent to requester.");
                  setSelectedItem(null);
                }}
              />
            </div>
          )}
        </>
      )}
    </DepartmentHeadLayout>
  );
}

function renderPage(page, onNavigate, currentUser) {
  const pages = {
    dashboard: <Dashboard onNavigate={onNavigate} />,
    assets: <AssetRegistry currentUser={currentUser} />,
    categories: <CategoryPage />,
    departments: <DepartmentsPage />,
    assignments: <EnhancedAssignmentsPage />,
    transfers: <TransferPage />,
    returns: <AssetReturnPage />,
    maintenance: <MaintenancePage />,
    damage: <DamagePage />,
    supplies: <SuppliesPage currentUser={currentUser} />,
    purchases: <PurchasePage currentUser={currentUser} />,
    gatepass: <GatePassPage />,
    audit: <AuditPage currentUser={currentUser} />,
    ocr: <OcrPage />,
    monitoring: <MonitoringPage currentUser={currentUser} />,
    reports: <ReportsPage />,
    notifications: <NotificationsPage onNavigate={onNavigate} />,
    users: <UsersPage />,
    activity: <ActivityPage />,
    settings: <SettingsPage />,
  };
  return pages[page] || pages.dashboard;
}

function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    pcmsApi
      .dashboard()
      .then((response) => {
        if (mounted) setData(response);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Unable to load dashboard data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const m = data?.metrics || {};
  const monthlyData = data?.monthly_analytics || [];
  const statusData = data?.status_breakdown || [];
  const activities = data?.recent_activities || [];
  const anomalyPreview = data?.anomaly_preview || [];

  const metrics = [
    {
      label: "Total Assets",
      value: (m.total_assets ?? 0).toLocaleString(),
      change: `+${m.total_assets_this_month ?? 0} this month`,
      icon: Package,
      tone: "blue",
    },
    {
      label: "Available Assets",
      value: (m.available_assets ?? 0).toLocaleString(),
      change: m.total_assets
        ? `${Math.round((m.available_assets / m.total_assets) * 100)}% of inventory`
        : "No assets yet",
      icon: PackageOpen,
      tone: "green",
    },
    {
      label: "Assigned Assets",
      value: (m.assigned_assets ?? 0).toLocaleString(),
      change: `+${m.assigned_this_month ?? 0} assignments`,
      icon: UserCheck,
      tone: "purple",
    },
    {
      label: "Pending Requests",
      value: (m.pending_requests ?? 0).toLocaleString(),
      change: "Needs review",
      icon: ClipboardList,
      tone: "orange",
    },
    {
      label: "Damaged Assets",
      value: (m.damaged_assets ?? 0).toLocaleString(),
      change: `${m.damaged_reports_pending ?? 0} reports pending`,
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Upcoming Audits",
      value: (m.upcoming_audits ?? 0).toLocaleString(),
      change: m.next_audit_area
        ? `Next: ${m.next_audit_area}`
        : "None scheduled",
      icon: ClipboardCheck,
      tone: "teal",
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h2>
            Welcome back, Admin! <span className="wave">PCMS</span>
          </h2>
          <p>
            Manage assets, supplies, procurement, audits, OCR tagging, and AI
            inventory alerts.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate?.("assets")}
          >
            <Package size={16} /> Register Asset
          </button>
        </div>
      </div>

      {error && <div className="form-message error">{error}</div>}

      <section className="metric-grid">
        {loading ? (
          <div className="loading-card">Loading dashboard…</div>
        ) : (
          metrics.map((metric) => <StatCard key={metric.label} {...metric} />)
        )}
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel wide">
          <PanelHeader
            title="Monthly Analytics"
            subtitle="Asset registrations, repairs, and anomaly flags"
            action="View Report"
            onAction={() => onNavigate?.("reports")}
          />
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="assetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="assets"
                stroke="#2563EB"
                fill="url(#assetGradient)"
                strokeWidth={3}
              />
              <Area
                type="monotone"
                dataKey="repairs"
                stroke="#F59E0B"
                fill="#FEF3C7"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="anomalies"
                stroke="#EF4444"
                fill="#FEE2E2"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <PanelHeader
            title="Asset Status"
            subtitle="Real-time inventory distribution"
            action="View All"
            onAction={() => onNavigate?.("assets")}
          />
          {statusData.length === 0 ? (
            <p className="small-text">No assets registered yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={290}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {statusData.map((item) => (
                  <span key={item.name}>
                    <i style={{ background: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-grid lower">
        <div className="panel">
          <PanelHeader
            title="Quick Actions"
            subtitle="Frequent PPMO workflows"
          />
          <div className="quick-grid">
            {[
              ["OCR Tag Asset", Camera, "ocr"],
              ["Create Transfer", Truck, "transfers"],
              ["Stock In Supplies", Archive, "supplies"],
              ["Generate Gate Pass", QrCode, "gatepass"],
              ["Schedule Audit", ClipboardCheck, "audit"],
              ["Export Report", Download, "reports"],
            ].map(([label, Icon, pageId]) => (
              <button
                className="quick-action"
                key={label}
                type="button"
                onClick={() => onNavigate?.(pageId)}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <PanelHeader
            title="Recent Activity"
            subtitle="Latest property office updates"
            action="View All Activities"
            onAction={() => onNavigate?.("activity")}
          />
          <div className="activity-list">
            {activities.length === 0 ? (
              <p className="small-text">No activity recorded yet.</p>
            ) : (
              activities.map((activity, index) => (
                <div key={index}>
                  <span className="activity-dot" />
                  <p>{activity.text}</p>
                  <time>{formatRelativeTime(activity.time)}</time>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="panel">
          <PanelHeader
            title="AI Inventory Alerts"
            subtitle="Anomaly-based monitoring"
            action="Open Monitoring"
            onAction={() => onNavigate?.("monitoring")}
          />
          <div className="alert-list">
            {anomalyPreview.length === 0 ? (
              <p className="small-text">No open anomalies.</p>
            ) : (
              anomalyPreview.map((flag) => (
                <AnomalyCard key={flag.id} flag={flag} compact />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function exportRowsToCsv(filename, rows, columns) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const header = columns.map((column) => escape(column.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escape(column.value(row))).join(","),
  );
  const csv = [header, ...lines].join("\r\n");

  const blob = new Blob([String.fromCharCode(0xfeff) + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  // Backend timestamps are stored and sent in UTC (config/app.php timezone
  // is 'UTC') but arrive as plain "Y-m-d H:i:s" with no zone marker. Without
  // an explicit UTC hint, the browser assumes the string is already in the
  // user's local time, which silently shifts every timestamp by the user's
  // UTC offset (e.g. 8 hours early for UTC+8). Appending 'Z' (after
  // swapping the space for 'T') tells Date() to parse it as UTC instead.
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString);
  const isoString = dateString.replace(" ", "T");
  const then = new Date(hasTimezone ? isoString : `${isoString}Z`);
  if (Number.isNaN(then.getTime())) return dateString;

  const diffSeconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60)
    return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString();
}

const NOTIFICATION_TYPE_META = {
  approval: { icon: ClipboardList, tone: "blue" },
  anomaly: { icon: Sparkles, tone: "red" },
  maintenance: { icon: Wrench, tone: "orange" },
  predicted_maintenance: { icon: Wrench, tone: "purple" },
  low_stock: { icon: AlertTriangle, tone: "red" },
  audit: { icon: ClipboardCheck, tone: "green" },
  ocr: { icon: Camera, tone: "teal" },
};

function notificationMeta(type) {
  return NOTIFICATION_TYPE_META[type] || { icon: Bell, tone: "blue" };
}

function formatDepartment(dept) {
  if (!dept) return null;
  if (typeof dept === "string") return dept;
  if (typeof dept === "object")
    return dept.name || dept.code || String(dept.id || "");
  return String(dept);
}

function formatAssignmentUser(user) {
  if (!user) return "";
  const name = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ");
  const label = name || user.full_name || user.email || user.id;
  const detail = [user.employee_id, user.department]
    .filter(Boolean)
    .join(" - ");
  return detail ? `${label} (${detail})` : label;
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatAssetDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toLocaleDateString();
}

function formatAssetDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function assetToFormValues(asset = {}) {
  return {
    property_number: asset.property_number || "",
    serial_number: asset.serial_number || "",
    brand: asset.brand || "",
    model: asset.model || "",
    name: asset.name || "",
    description: asset.description || "",
    category_id: asset.category_id || "",
    department_id: asset.department_id || "",
    location: asset.location || "",
    purchase_date: toDateInputValue(asset.purchase_date),
    purchase_cost: asset.purchase_cost ?? "",
    quantity: String(asset.quantity ?? 1),
    warranty_until: toDateInputValue(asset.warranty_until),
    condition: asset.condition || "good",
    status: asset.status || "available",
  };
}

function buildAssetPayload(values) {
  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a whole number of at least 1.");
  }

  const purchaseCost =
    values.purchase_cost === "" || values.purchase_cost === null
      ? null
      : Number(values.purchase_cost);
  if (
    purchaseCost !== null &&
    (Number.isNaN(purchaseCost) || purchaseCost < 0)
  ) {
    throw new Error("Purchase Cost cannot be negative.");
  }

  const departmentId = values.department_id
    ? Number(values.department_id)
    : null;
  if (
    values.department_id &&
    (Number.isNaN(departmentId) || departmentId <= 0)
  ) {
    throw new Error(
      "Department ID must be a valid numeric department identifier or left blank.",
    );
  }

  const categoryId = values.category_id ? Number(values.category_id) : null;
  if (values.category_id && (Number.isNaN(categoryId) || categoryId <= 0)) {
    throw new Error(
      "Category ID must be a valid numeric category identifier or left blank.",
    );
  }

  return {
    ...values,
    category_id: categoryId,
    department_id: departmentId,
    purchase_cost: purchaseCost,
    quantity,
    purchase_date: values.purchase_date || null,
    warranty_until: values.warranty_until || null,
  };
}

function AssetRegistry({ currentUser }) {
  const [assetsData, setAssetsData] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentLoadError, setDepartmentLoadError] = useState(null);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [actionModal, setActionModal] = useState({ type: null, asset: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const canManageAssets = hasPermission(currentUser?.role, "canManageAssets");
  const canDeleteRecords = currentUser?.role === ROLES.SYSTEM_ADMIN;
  const [registerValues, setRegisterValues] = useState({
    property_number: "",
    serial_number: "",
    brand: "",
    model: "",
    name: "",
    description: "",
    department_id: "",
    location: "",
    purchase_date: "",
    purchase_cost: "",
    quantity: "1",
    warranty_until: "",
    condition: "good",
    status: "available",
  });

  // Load departments once
  useEffect(() => {
    let mounted = true;
    async function loadDepartments() {
      setDepartmentLoadError(null);
      setIsLoadingDepartments(true);
      try {
        const departmentList = await pcmsApi.departments();
        if (!mounted) return;
        setDepartments(departmentList || []);
      } catch (error) {
        if (!mounted) return;
        setDepartmentLoadError(
          error?.message || "Unable to load departments from Supabase.",
        );
      } finally {
        if (!mounted) return;
        setIsLoadingDepartments(false);
      }
    }

    loadDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  // Load assets and support server-side search (debounced)
  const assetsSearchTimer = useRef(null);
  useEffect(() => {
    let mounted = true;
    setAssetError(null);
    setIsLoadingAssets(true);

    const load = async (search) => {
      try {
        const assets = await pcmsApi.assets({ limit: 200, search });
        if (!mounted) return;
        setAssetsData(assets || []);
      } catch (error) {
        if (!mounted) return;
        setAssetError(error?.message || "Unable to load assets.");
      } finally {
        if (!mounted) return;
        setIsLoadingAssets(false);
      }
    };

    clearTimeout(assetsSearchTimer.current);
    assetsSearchTimer.current = setTimeout(() => load(searchText || ""), 300);

    return () => {
      mounted = false;
      clearTimeout(assetsSearchTimer.current);
    };
  }, [searchText]);

  const filteredAssets = assetsData.filter((asset) => {
    const query = searchText.toLowerCase();
    return (
      asset.name?.toLowerCase().includes(query) ||
      asset.property_number?.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.location?.toLowerCase().includes(query) ||
      asset.status?.toLowerCase().includes(query) ||
      asset.condition?.toLowerCase().includes(query)
    );
  });

  const totalValue = assetsData.reduce(
    (sum, asset) => sum + Number(asset.purchase_cost || 0),
    0,
  );
  const qrTaggedCount = assetsData.filter((asset) => asset.qr_code_path).length;
  const warrantyActiveCount = assetsData.filter(
    (asset) =>
      asset.warranty_until && new Date(asset.warranty_until) >= new Date(),
  ).length;
  const needsEncodingCount = assetsData.filter(
    (asset) => !asset.property_number,
  ).length;

  const openRegisterDialog = () => {
    setRegisterError(null);
    setRegisterSuccess(null);
    setShowRegisterDialog(true);
  };

  const closeRegisterDialog = () => {
    setShowRegisterDialog(false);
    setRegisterLoading(false);
  };

  const closeActionModal = () => {
    if (actionSubmitting) return;
    setActionModal({ type: null, asset: null });
    setEditValues(null);
    setActionError(null);
    setActionLoading(false);
  };

  const updateRegisterField = (field, value) =>
    setRegisterValues((current) => ({ ...current, [field]: value }));
  const updateEditField = (field, value) =>
    setEditValues((current) => ({ ...current, [field]: value }));

  const parseNullableDepartmentId = (value) => {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  };
  const findDepartmentById = (departmentId) =>
    departments.find(
      (department) => Number(department.id) === Number(departmentId),
    ) || null;
  const mergeUpdatedAsset = (currentAsset, updatedAsset) => {
    const nextAsset = { ...currentAsset, ...updatedAsset };
    const hasDepartmentId =
      nextAsset.department_id !== null &&
      nextAsset.department_id !== undefined &&
      nextAsset.department_id !== "";

    return {
      ...nextAsset,
      department:
        updatedAsset.department ||
        (hasDepartmentId ? findDepartmentById(nextAsset.department_id) : null),
      category: updatedAsset.category || currentAsset.category || null,
    };
  };

  const openViewAsset = async (asset) => {
    setActionModal({ type: "view", asset });
    setActionError(null);
    setActionLoading(true);
    try {
      const fullAsset = await pcmsApi.asset(asset.id);
      setActionModal({ type: "view", asset: fullAsset });
    } catch (error) {
      setActionError(error?.message || "Unable to load asset details.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditAsset = async (asset) => {
    if (!canManageAssets) return;
    setActionModal({ type: "edit", asset });
    setActionError(null);
    setActionLoading(true);
    try {
      const fullAsset = await pcmsApi.asset(asset.id);
      setActionModal({ type: "edit", asset: fullAsset });
      setEditValues(assetToFormValues(fullAsset));
    } catch (error) {
      setActionError(error?.message || "Unable to load asset for editing.");
      setEditValues(assetToFormValues(asset));
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteAsset = (asset) => {
    if (!canManageAssets) return;
    setActionModal({ type: "delete", asset });
    setActionError(null);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!actionModal.asset || !editValues) return;
    setActionError(null);
    setActionSuccess(null);
    setActionSubmitting(true);

    try {
      const payload = buildAssetPayload(editValues);
      const updatedAsset = await pcmsApi.updateAsset(
        actionModal.asset.id,
        payload,
      );
      setAssetsData((current) =>
        current.map((asset) =>
          asset.id === updatedAsset.id
            ? mergeUpdatedAsset(asset, updatedAsset)
            : asset,
        ),
      );
      setActionSuccess("Asset updated successfully.");
      setActionModal({ type: null, asset: null });
      setEditValues(null);
    } catch (error) {
      setActionError(error?.message || "Failed to update asset.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!actionModal.asset) return;
    setActionError(null);
    setActionSuccess(null);
    setActionSubmitting(true);

    try {
      await pcmsApi.deleteAsset(actionModal.asset.id);
      setAssetsData((current) =>
        current.filter((asset) => asset.id !== actionModal.asset.id),
      );
      setActionSuccess("Asset deleted successfully.");
      setActionModal({ type: null, asset: null });
    } catch (error) {
      setActionError(error?.message || "Failed to delete asset.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    setRegisterLoading(true);

    try {
      const departmentId = parseNullableDepartmentId(
        registerValues.department_id,
      );
      if (registerValues.department_id && departmentId === null) {
        throw new Error(
          "Department ID must be a valid numeric department identifier or left blank.",
        );
      }
      const quantity = Number(registerValues.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a whole number of at least 1.");
      }

      const payload = {
        ...registerValues,
        department_id: departmentId,
        purchase_cost: registerValues.purchase_cost
          ? Number(registerValues.purchase_cost)
          : null,
        quantity,
        purchase_date: registerValues.purchase_date || null,
        warranty_until: registerValues.warranty_until || null,
      };

      const created = await pcmsApi.createAsset(payload);
      setAssetsData((current) => [created, ...current]);
      setRegisterSuccess("Asset registered successfully.");
      setRegisterValues({
        property_number: "",
        serial_number: "",
        brand: "",
        model: "",
        name: "",
        description: "",
        department_id: "",
        location: "",
        purchase_date: "",
        purchase_cost: "",
        quantity: "1",
        warranty_until: "",
        condition: "good",
        status: "available",
      });
      setTimeout(() => closeRegisterDialog(), 700);
    } catch (error) {
      setRegisterError(error?.message || "Failed to register the asset.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <ModulePage
      title="Asset Registry"
      subtitle="Register, track, export, and maintain the full property lifecycle."
      primary="Register Asset"
      icon={Package}
      onPrimary={openRegisterDialog}
      stats={[
        ["Total Value", formatCurrency(totalValue), FileBarChart2],
        ["QR Tagged", `${qrTaggedCount}`, QrCode],
        ["Warranty Active", `${warrantyActiveCount}`, CheckCircle2],
        ["Needs Encoding", `${needsEncodingCount}`, AlertTriangle],
      ]}
    >
      <DataToolbar searchText={searchText} onSearchChange={setSearchText} />
      {actionError && <div className="alert danger">{actionError}</div>}
      {actionSuccess && <div className="alert success">{actionSuccess}</div>}
      <AssetTable
        assets={filteredAssets}
        loading={isLoadingAssets}
        error={assetError}
        canManageAssets={canManageAssets}
        canDeleteRecords={canDeleteRecords}
        onView={openViewAsset}
        onEdit={openEditAsset}
        onDelete={openDeleteAsset}
        disabled={actionSubmitting || actionLoading}
      />

      {showRegisterDialog && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Asset</h3>
              <button
                className="icon-button"
                onClick={closeRegisterDialog}
                aria-label="Close"
              >
                {" "}
                <X size={18} />{" "}
              </button>
            </div>
            <form className="register-form" onSubmit={handleRegisterSubmit}>
              <div className="form-grid">
                <label>
                  Asset Name
                  <input
                    value={registerValues.name}
                    onChange={(event) =>
                      updateRegisterField("name", event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Property Number
                  <input
                    value={registerValues.property_number}
                    onChange={(event) =>
                      updateRegisterField("property_number", event.target.value)
                    }
                    placeholder="Auto-generated if left blank"
                  />
                </label>
                <label>
                  Serial Number
                  <input
                    value={registerValues.serial_number}
                    onChange={(event) =>
                      updateRegisterField("serial_number", event.target.value)
                    }
                  />
                </label>
                <label>
                  Brand
                  <input
                    value={registerValues.brand}
                    onChange={(event) =>
                      updateRegisterField("brand", event.target.value)
                    }
                  />
                </label>
                <label>
                  Model
                  <input
                    value={registerValues.model}
                    onChange={(event) =>
                      updateRegisterField("model", event.target.value)
                    }
                  />
                </label>
                <label>
                  Department
                  <select
                    value={registerValues.department_id}
                    onChange={(event) =>
                      updateRegisterField("department_id", event.target.value)
                    }
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  {departmentLoadError && (
                    <div className="alert warning">{departmentLoadError}</div>
                  )}
                </label>
                <label>
                  Location
                  <input
                    value={registerValues.location}
                    onChange={(event) =>
                      updateRegisterField("location", event.target.value)
                    }
                  />
                </label>
                <label>
                  Purchase Cost
                  <input
                    value={registerValues.purchase_cost}
                    onChange={(event) =>
                      updateRegisterField("purchase_cost", event.target.value)
                    }
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
                <label>
                  Quantity
                  <input
                    value={registerValues.quantity}
                    onChange={(event) =>
                      updateRegisterField("quantity", event.target.value)
                    }
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="Enter quantity"
                  />
                </label>
                <label>
                  Purchase Date
                  <input
                    value={registerValues.purchase_date}
                    onChange={(event) =>
                      updateRegisterField("purchase_date", event.target.value)
                    }
                    type="date"
                  />
                </label>
                <label>
                  Warranty Until
                  <input
                    value={registerValues.warranty_until}
                    onChange={(event) =>
                      updateRegisterField("warranty_until", event.target.value)
                    }
                    type="date"
                  />
                </label>
                <label>
                  Condition
                  <select
                    value={registerValues.condition}
                    onChange={(event) =>
                      updateRegisterField("condition", event.target.value)
                    }
                  >
                    <option value="good">Good</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged</option>
                    <option value="under_inspection">Under Inspection</option>
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={registerValues.status}
                    onChange={(event) =>
                      updateRegisterField("status", event.target.value)
                    }
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </label>
              </div>
              <label className="full-width">
                Description
                <textarea
                  value={registerValues.description}
                  onChange={(event) =>
                    updateRegisterField("description", event.target.value)
                  }
                  rows={3}
                />
              </label>
              {registerError && (
                <div className="alert danger">{registerError}</div>
              )}
              {registerSuccess && (
                <div className="alert success">{registerSuccess}</div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeRegisterDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={registerLoading}
                >
                  {registerLoading ? "Saving…" : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionModal.type === "view" && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card asset-detail-modal view-asset-modal">
            <div className="modal-header">
              <h3>View Asset</h3>
            </div>
            <div className="asset-detail-body">
              {actionLoading ? (
                <div className="loading-card">Loading asset details...</div>
              ) : (
                <AssetDetailGrid asset={actionModal.asset} />
              )}
              {actionError && <div className="alert danger">{actionError}</div>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeActionModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionModal.type === "edit" && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card asset-detail-modal">
            <div className="modal-header">
              <h3>Edit Asset</h3>
              <button
                className="icon-button"
                onClick={closeActionModal}
                aria-label="Close"
                disabled={actionSubmitting}
              >
                <X size={18} />
              </button>
            </div>
            {actionLoading || !editValues ? (
              <div className="asset-detail-body">
                <div className="loading-card">Loading asset form...</div>
              </div>
            ) : (
              <form className="register-form" onSubmit={handleEditSubmit}>
                <AssetEditFields
                  values={editValues}
                  departments={departments}
                  onChange={updateEditField}
                />
                {actionError && (
                  <div className="alert danger">{actionError}</div>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeActionModal}
                    disabled={actionSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={actionSubmitting}
                  >
                    {actionSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {actionModal.type === "delete" && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card confirm-dialog">
            <div className="modal-header">
              <h3>Delete Asset</h3>
              <button
                className="icon-button"
                onClick={closeActionModal}
                aria-label="Close"
                disabled={actionSubmitting}
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to delete this asset?</p>
              <div className="delete-summary">
                <span>Asset Name</span>
                <strong>{actionModal.asset?.name || "Unnamed asset"}</strong>
                <span>Property Number</span>
                <strong>{actionModal.asset?.property_number || "—"}</strong>
              </div>
              <p>This action cannot be undone.</p>
              {actionError && <div className="alert danger">{actionError}</div>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeActionModal}
                  disabled={actionSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button danger"
                  onClick={handleDeleteConfirm}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function CategoryPage() {
  return (
    <ModulePage
      title="Asset Categories"
      subtitle="Maintain depreciation rules and category-level controls."
      primary="New Category"
      icon={Boxes}
    >
      <div className="card-grid">
        {categories.map((category) => (
          <div className="mini-card" key={category.name}>
            <div className={`mini-icon tone-${category.tone}`}>
              <category.icon size={20} />
            </div>
            <strong>{category.name}</strong>
            <p>
              {category.count} assets · {category.depreciation}% annual
              depreciation
            </p>
            <span className="status success">Active</span>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}

function DepartmentsPage() {
  const [departmentRows, setDepartmentRows] = useState([]);
  const [isLoadingDepartmentsPage, setIsLoadingDepartmentsPage] =
    useState(true);
  const [departmentError, setDepartmentError] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    code: "",
    name: "",
    location: "",
  });
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [departmentSuccess, setDepartmentSuccess] = useState(null);

  useEffect(() => {
    async function loadDepartments() {
      setDepartmentError(null);
      setIsLoadingDepartmentsPage(true);
      try {
        const departmentList = await pcmsApi.departments();
        setDepartmentRows(departmentList || []);
      } catch (error) {
        setDepartmentError(error?.message || "Unable to load departments.");
      } finally {
        setIsLoadingDepartmentsPage(false);
      }
    }

    loadDepartments();
  }, []);

  const handleDepartmentChange = (field, value) => {
    setNewDepartment((current) => ({ ...current, [field]: value }));
  };

  const handleAddDepartment = async (event) => {
    event.preventDefault();
    setDepartmentError(null);
    setDepartmentSuccess(null);
    setIsSavingDepartment(true);

    try {
      const created = await pcmsApi.createDepartment(newDepartment);
      setDepartmentRows((current) => [created, ...current]);
      setDepartmentSuccess("Department added successfully.");
      setNewDepartment({ code: "", name: "", location: "" });
    } catch (error) {
      setDepartmentError(error?.message || "Failed to add department.");
    } finally {
      setIsSavingDepartment(false);
    }
  };

  return (
    <ModulePage
      title="Departments"
      subtitle="Department custodians, locations, and asset accountability."
      primary="Add Department"
      icon={Building2}
    >
      <div className="panel">
        <div className="panel-header">
          <h3>New Department</h3>
        </div>
        <form className="register-form" onSubmit={handleAddDepartment}>
          <div className="form-grid">
            <label>
              Department Code
              <input
                value={newDepartment.code}
                onChange={(event) =>
                  handleDepartmentChange("code", event.target.value)
                }
                required
              />
            </label>
            <label>
              Department Name
              <input
                value={newDepartment.name}
                onChange={(event) =>
                  handleDepartmentChange("name", event.target.value)
                }
                required
              />
            </label>
            <label>
              Location
              <input
                value={newDepartment.location}
                onChange={(event) =>
                  handleDepartmentChange("location", event.target.value)
                }
              />
            </label>
          </div>
          {departmentError && (
            <div className="alert danger">{departmentError}</div>
          )}
          {departmentSuccess && (
            <div className="alert success">{departmentSuccess}</div>
          )}
          <div className="modal-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isSavingDepartment}
            >
              {isSavingDepartment ? "Saving…" : "Add Department"}
            </button>
          </div>
        </form>
      </div>

      <div className="table-card">
        {isLoadingDepartmentsPage ? (
          <div className="loading-card">Loading departments…</div>
        ) : departmentError ? (
          <div className="alert danger">{departmentError}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Location</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {departmentRows.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.location}</span>
                  </td>
                  <td>{item.code}</td>
                  <td>{item.location || "-"}</td>
                  <td>
                    <span
                      className={`status ${item.is_active ? "success" : "warning"}`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModulePage>
  );
}

function WorkflowPage({ title, icon: Icon, items, statusLabel, onPrimary }) {
  return (
    <ModulePage
      title={title}
      subtitle="Role-guarded workflow with approvals, audit trail, and notifications."
      primary="Create Request"
      icon={Icon}
      onPrimary={onPrimary}
    >
      <div className="workflow-board">
        {["Draft", "Department Head", "PPMO Review", "Approved"].map(
          (stage, index) => (
            <div className="workflow-column" key={stage}>
              <h3>{stage}</h3>
              {items.slice(index, index + 3).map((asset) => (
                <div className="workflow-card" key={`${stage}-${asset.id}`}>
                  <strong>{asset.name}</strong>
                  <p>
                    {asset.id} ·{" "}
                    {formatDepartment(asset.department) ||
                      asset.from ||
                      "PPMO Office"}
                  </p>
                  <span
                    className={`status ${index === 3 ? "success" : "info"}`}
                  >
                    {index === 3 ? "Approved" : statusLabel}
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </ModulePage>
  );
}

function AssetReturnPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [returnAssignment, setReturnAssignment] = useState(null);
  const [returnValues, setReturnValues] = useState({ condition_after: "good", notes: "" });
  const [saving, setSaving] = useState(false);

  const formatAssignmentDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  };

  const loadReturns = async () => {
    setLoading(true);
    try {
      const records = await pcmsApi.assignments({ limit: 200 });
      setAssignments(records || []);
      setError(null);
    } catch (err) {
      setError(err?.message || "Unable to load asset return records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

  const openReturn = (assignment) => {
    setMessage(null);
    setError(null);
    setReturnValues({ condition_after: "good", notes: "" });
    setReturnAssignment(assignment);
  };

  const submitReturn = async (event) => {
    event.preventDefault();
    if (!returnAssignment) return;
    setSaving(true);
    try {
      await pcmsApi.returnAssignment(returnAssignment.id, returnValues.notes, returnValues.condition_after);
      setReturnAssignment(null);
      setMessage("Asset returned successfully and inventory was updated.");
      await loadReturns();
    } catch (err) {
      setError(err?.message || "Unable to record the asset return.");
    } finally {
      setSaving(false);
    }
  };

  const active = assignments.filter((item) => ["active", "pending_acceptance"].includes(item.status));
  const returned = assignments.filter((item) => item.status === "returned");
  const unitNumber = (assignment) => {
    const unit = assignment.assetUnit || assignment.asset_unit;
    return unit?.unit_code?.match(/-(\d{3})$/)?.[1] || "N/A";
  };
  const employeeName = (assignment) => formatAssignmentUser(assignment.assigned_to || assignment.assignedTo || {});

  return (
    <ModulePage title="Asset Return" subtitle="Inspect assigned property, record its condition, and return it to available inventory." primary="Start Return" icon={PackageCheck} onPrimary={() => active[0] && openReturn(active[0])}>
      {error && <div className="form-message error">{error}</div>}
      {message && <div className="form-message success">{message}</div>}
      <section className="metric-grid compact">
        <StatCard label="Awaiting Return" value={active.length} change="Active assignments" icon={Timer} tone="orange" />
        <StatCard label="Returned" value={returned.length} change="Completed check-ins" icon={PackageCheck} tone="green" />
        <StatCard label="Total Records" value={assignments.length} change="Assignment history" icon={History} tone="blue" />
      </section>
      <section className="panel role-panel">
        <PanelHeader title="Assets Awaiting Return" subtitle="Select an assignment to complete the inspection and check-in." />
        {loading ? <div className="loading-card">Loading return records...</div> : active.length === 0 ? <p className="empty-state">No active assets are waiting for return.</p> : (
          <div className="approval-list">{active.map((assignment) => (
            <article className="approval-card" key={assignment.id}>
              <div><strong>{assignment.asset?.name || `Asset #${assignment.asset_id}`}</strong><p>{assignment.asset?.property_number || "No property number"} · Physical Unit {unitNumber(assignment)}</p><small>{employeeName(assignment)} · Assigned {formatAssignmentDate(assignment.assigned_at)}</small></div>
              <button className="primary-button" type="button" onClick={() => openReturn(assignment)}><PackageCheck size={16} /> Inspect & Return</button>
            </article>
          ))}</div>
        )}
      </section>
      <section className="panel role-panel">
        <PanelHeader title="Return History" subtitle="Previously checked-in assets and their recorded condition." />
        {returned.length === 0 ? <p className="empty-state">No completed returns yet.</p> : <div className="table-card"><table><thead><tr><th>Asset</th><th>Employee</th><th>Physical Unit</th><th>Returned</th><th>Condition</th></tr></thead><tbody>{returned.map((assignment) => <tr key={assignment.id}><td><strong>{assignment.asset?.name || `Asset #${assignment.asset_id}`}</strong><span>{assignment.asset?.property_number || "N/A"}</span></td><td>{employeeName(assignment)}</td><td>{unitNumber(assignment)}</td><td>{formatAssignmentDate(assignment.returned_at)}</td><td><span className="status success">{assignment.condition_after || "good"}</span></td></tr>)}</tbody></table></div>}
      </section>
      {returnAssignment && <div className="modal-overlay" role="dialog" aria-modal="true"><div className="modal-card"><div className="modal-header"><h3>Inspect & Return Asset</h3><button className="icon-button" type="button" onClick={() => setReturnAssignment(null)} aria-label="Close"><X size={18} /></button></div><div className="asset-description-card"><strong>{returnAssignment.asset?.name || `Asset #${returnAssignment.asset_id}`}</strong><p>Property No.: {returnAssignment.asset?.property_number || "N/A"}</p><p>Physical Unit: {unitNumber(returnAssignment)}</p><p>Assigned to: {employeeName(returnAssignment)}</p></div><form className="register-form" onSubmit={submitReturn}><label>Condition After Return<select value={returnValues.condition_after} onChange={(event) => setReturnValues((current) => ({ ...current, condition_after: event.target.value }))}><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="needs_repair">Needs Repair</option><option value="damaged">Damaged</option></select></label><label>Inspection Notes<textarea rows={3} value={returnValues.notes} onChange={(event) => setReturnValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Record inspection findings or return notes" /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setReturnAssignment(null)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Recording..." : "Confirm Return"}</button></div></form></div></div>}
    </ModulePage>
  );
}

function EnhancedAssignmentsPage() {
  const makeEmptyForm = () => ({
    asset_id: "",
    assigned_to: "",
    assignment_type: "permanent",
    assigned_at: new Date().toISOString().slice(0, 10),
    due_date: "",
    quantity: "1",
    purpose: "",
    condition_before: "good",
    photo: null,
    employee_signature: "",
    custodian_signature: "",
    accept_now: false,
    remarks: "",
  });
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [assetsList, setAssetsList] = useState([]);
  const [assetUnits, setAssetUnits] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [verificationAssignment, setVerificationAssignment] = useState(null);
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [clearanceUserId, setClearanceUserId] = useState("");
  const [clearanceData, setClearanceData] = useState(null);
  const [clearanceLoading, setClearanceLoading] = useState(false);
  const [clearanceError, setClearanceError] = useState(null);
  const [clearanceSuccess, setClearanceSuccess] = useState(null);
  const [clearanceNotes, setClearanceNotes] = useState("");
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    assignment: null,
  });
  const [returnConfirmDialog, setReturnConfirmDialog] = useState({
    open: false,
    assignment: null,
    loading: false,
    error: null,
  });
  const [cancelConfirmDialog, setCancelConfirmDialog] = useState({
    open: false,
    assignment: null,
    loading: false,
    error: null,
  });
  const [acceptConfirmDialog, setAcceptConfirmDialog] = useState({
    open: false,
    assignment: null,
    loading: false,
    error: null,
  });
  const [printConfirmDialog, setPrintConfirmDialog] = useState({
    open: false,
    assignment: null,
  });
  const [returnDialog, setReturnDialog] = useState({
    open: false,
    assignment: null,
  });
  const [returnValues, setReturnValues] = useState({
    condition_after: "good",
    notes: "",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    assignment_type: "",
  });
  const [formValues, setFormValues] = useState(makeEmptyForm);
  const [assetQuery, setAssetQuery] = useState("");
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);

  const formatAssignmentDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  };

  const formatPhysicalUnitNumber = (assignment) => {
    const unit = assignment?.assetUnit || assignment?.asset_unit || {};
    const unitCode = unit.unit_code || "";
    const sequence = unitCode.match(/-(\d{3})$/)?.[1];
    return sequence || "N/A";
  };

  const getAssignmentUnit = (assignment) =>
    assignment?.assetUnit || assignment?.asset_unit || {};

  const loadAssignments = async (nextFilters = filters) => {
    const [assignments, dashboard] = await Promise.allSettled([
      pcmsApi.assignments({ ...nextFilters, limit: 200 }),
      pcmsApi.assignmentDashboard(),
    ]);
    if (assignments.status === "fulfilled")
      setAssignmentsData(assignments.value || []);
    if (dashboard.status === "fulfilled")
      setDashboardData(dashboard.value || null);
  };

  const loadAssets = async () => {
    const assets = await Promise.resolve(pcmsApi.assets({ limit: 200 }));
    setAssetsList(assets || []);
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [assignments, dashboard, assets, users] =
          await Promise.allSettled([
            pcmsApi.assignments({ limit: 200 }),
            pcmsApi.assignmentDashboard(),
            pcmsApi.assets({ limit: 200 }),
            pcmsApi.assignmentUsers(),
          ]);

        if (assignments.status === "fulfilled")
          setAssignmentsData(assignments.value || []);
        if (dashboard.status === "fulfilled")
          setDashboardData(dashboard.value || null);
        if (assets.status === "fulfilled") setAssetsList(assets.value || []);
        if (users.status === "fulfilled") setUsersList(users.value || []);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const activeQuantityByAsset = useMemo(
    () =>
      assignmentsData.reduce((map, assignment) => {
        if (assignment.status === "active") {
          map[assignment.asset_id] =
            (map[assignment.asset_id] || 0) + Number(assignment.quantity || 1);
        }
        return map;
      }, {}),
    [assignmentsData],
  );
  const getAvailableQuantity = (asset) =>
    String(asset?.id) === String(formValues.asset_id) && assetUnits.length > 0
      ? assetUnits.filter((unit) => unit.status === "available").length
      : Math.max(
          0,
          Number(asset?.quantity || 1) -
            Number(activeQuantityByAsset[asset?.id] || 0),
        );
  const selectedAsset = assetsList.find(
    (asset) => String(asset.id) === String(formValues.asset_id),
  );
  const selectedUser = usersList.find(
    (user) => String(user.id) === String(formValues.assigned_to),
  );
  const stats = dashboardData || {
    total_assigned_assets: assignmentsData
      .filter((item) => item.status === "active")
      .reduce((sum, item) => sum + Number(item.quantity || 1), 0),
    available_assets: assetsList.filter((asset) => asset.status === "available")
      .length,
    pending_assignments: assignmentsData.filter(
      (item) => item.status === "pending_acceptance",
    ).length,
    returned_assets: assignmentsData.filter(
      (item) => item.status === "returned",
    ).length,
    assets_due_for_return: assignmentsData.filter(
      (item) =>
        item.status === "active" &&
        item.due_date &&
        new Date(item.due_date) <=
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ).length,
    overdue_assignments: assignmentsData.filter(
      (item) =>
        item.status === "active" &&
        item.due_date &&
        new Date(item.due_date) < new Date(),
    ).length,
  };

  useEffect(() => {
    let ignore = false;
    if (!formValues.asset_id) {
      setRecommendations([]);
      return;
    }
    pcmsApi
      .assignmentRecommendations({
        asset_id: formValues.asset_id,
        assigned_to: formValues.assigned_to,
        quantity: formValues.quantity || 1,
      })
      .then((items) => {
        if (!ignore) setRecommendations(items || []);
      })
      .catch(() => {
        if (!ignore) setRecommendations([]);
      });
    return () => {
      ignore = true;
    };
  }, [formValues.asset_id, formValues.assigned_to, formValues.quantity]);

  useEffect(() => {
    let ignore = false;
    if (!formValues.assigned_to) {
      setEmployeeProfile(null);
      return;
    }
    pcmsApi
      .employeeAssetProfile(formValues.assigned_to)
      .then((profile) => {
        if (!ignore) setEmployeeProfile(profile || null);
      })
      .catch(() => {
        if (!ignore) setEmployeeProfile(null);
      });
    return () => {
      ignore = true;
    };
  }, [formValues.assigned_to]);

  useEffect(() => {
    let ignore = false;
    if (!formValues.asset_id) {
      setAssetUnits([]);
      return;
    }
    setAssetUnits([]);
    pcmsApi.assetUnits(formValues.asset_id).then((units) => {
      if (!ignore) setAssetUnits(units || []);
    }).catch(() => {
      if (!ignore) setAssetUnits([]);
    });
    return () => { ignore = true; };
  }, [formValues.asset_id]);

  const openCreateDialog = () => {
    setCreateError(null);
    setCreateSuccess(null);
    setFormValues(makeEmptyForm());
    setAssetQuery("");
    setShowAssetSuggestions(false);
    setRecommendations([]);
    setEmployeeProfile(null);
    setAssetUnits([]);
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateLoading(false);
    setShowAssetSuggestions(false);
  };

  const updateField = (field, value) =>
    setFormValues((current) => ({ ...current, [field]: value }));

  const resolveSelectedAssetId = () => {
    if (formValues.asset_id) return formValues.asset_id;
    const exact = assetsList.find(
      (asset) =>
        asset.property_number === assetQuery ||
        String(asset.id) === String(assetQuery) ||
        `${asset.name} - ${asset.property_number || asset.asset_id}` ===
          assetQuery,
    );
    if (!exact) throw new Error("Please select an asset from the suggestions.");
    return exact.id;
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);
    try {
      const assetId = resolveSelectedAssetId();
      const created = await pcmsApi.createAssignment({
        ...formValues,
        asset_id: Number(assetId) || assetId,
        quantity: Number(formValues.quantity || 1),
        due_date: formValues.due_date || null,
        assigned_at: formValues.assigned_at || null,
        purpose: formValues.purpose || null,
        remarks: formValues.remarks || null,
      });
      setAssignmentsData((current) => [created, ...current]);
      setCreateSuccess(
        created.status === "active"
          ? "Assignment completed successfully."
          : "Assignment is waiting for employee acceptance.",
      );
      await Promise.all([loadAssignments(), loadAssets()]);
      setTimeout(() => closeCreateDialog(), 700);
    } catch (err) {
      setCreateError(err?.message || "Failed to create assignment.");
    } finally {
      setCreateLoading(false);
    }
  };

  const updateFilters = (field, value) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    loadAssignments(nextFilters).catch(() => {});
  };

  const handleViewAssignment = async (assignment) => {
    setSelectedAssignment({ ...assignment, _detailsLoading: true });
    try {
      const details = await pcmsApi.fetchAssignment(assignment.id);
      setSelectedAssignment({
        ...(details.assignment || assignment),
        _details: details,
        _detailsLoading: false,
      });
    } catch (err) {
      const message = err?.message || "Unable to load accountability details.";
      const isAuthError = /authoriz|unauthoriz|forbidden/i.test(message);
      setSelectedAssignment({
        ...assignment,
        _detailsLoading: false,
        _detailsError: isAuthError ? null : message,
      });
    }
  };

  const handleVerifyClick = async (assignment) => {
    setVerificationAssignment({ ...assignment, _detailsLoading: true });
    try {
      const details = await pcmsApi.fetchAssignment(assignment.id);
      setVerificationAssignment({
        ...(details.assignment || assignment),
        _details: details,
        _detailsLoading: false,
      });
    } catch {
      setVerificationAssignment({ ...assignment, _detailsLoading: false });
    }
  };

  const handleReturnClick = (assignment) => {
    setReturnConfirmDialog({
      open: true,
      assignment,
      loading: false,
      error: null,
    });
  };

  const handleConfirmReturn = async () => {
    const assignment = returnConfirmDialog.assignment;
    setReturnConfirmDialog((c) => ({ ...c, loading: true, error: null }));
    try {
      await pcmsApi.returnAssignment(assignment.id, "", "good");
      setReturnConfirmDialog({
        open: false,
        assignment: null,
        loading: false,
        error: null,
      });
      await Promise.all([loadAssignments(), loadAssets()]);
      setActionSuccess("Asset return recorded successfully.");
    } catch (err) {
      setReturnConfirmDialog((c) => ({
        ...c,
        loading: false,
        error: err?.message || "Unable to return asset.",
      }));
    }
  };

  const handleCancelClick = (assignment) => {
    setCancelConfirmDialog({
      open: true,
      assignment,
      loading: false,
      error: null,
    });
  };

  const handleConfirmCancel = async () => {
    const assignment = cancelConfirmDialog.assignment;
    setCancelConfirmDialog((c) => ({ ...c, loading: true, error: null }));
    try {
      await pcmsApi.cancelAssignment(
        assignment.id,
        "Cancelled from assignment dashboard.",
      );
      setCancelConfirmDialog({
        open: false,
        assignment: null,
        loading: false,
        error: null,
      });
      await Promise.all([loadAssignments(), loadAssets()]);
      setActionSuccess("Assignment cancelled successfully.");
    } catch (err) {
      setCancelConfirmDialog((c) => ({
        ...c,
        loading: false,
        error: err?.message || "Unable to cancel assignment.",
      }));
    }
  };

  const handleAcceptClick = (assignment) => {
    setAcceptConfirmDialog({
      open: true,
      assignment,
      loading: false,
      error: null,
    });
  };

  const handleConfirmAccept = async () => {
    const assignment = acceptConfirmDialog.assignment;
    setAcceptConfirmDialog((c) => ({ ...c, loading: true, error: null }));
    try {
      await pcmsApi.acceptAssignment(assignment.id);
      setAcceptConfirmDialog({
        open: false,
        assignment: null,
        loading: false,
        error: null,
      });
      await Promise.all([loadAssignments(), loadAssets()]);
      setActionSuccess("Assignment accepted successfully.");
    } catch (err) {
      setAcceptConfirmDialog((c) => ({
        ...c,
        loading: false,
        error: err?.message || "Unable to accept assignment.",
      }));
    }
  };

  const handlePrintClick = async (assignment) => {
    setPrintConfirmDialog({ open: true, assignment, loading: true });
    try {
      const details = await pcmsApi.fetchAssignment(assignment.id);
      setPrintConfirmDialog({
        open: true,
        assignment: {
          ...assignment,
          ...(details.assignment || {}),
          _details: details,
        },
        loading: false,
      });
    } catch {
      setPrintConfirmDialog({ open: true, assignment, loading: false });
    }
  };

  const handleConfirmPrint = (assignment) => {
    printAccountabilityForm(assignment);
    setPrintConfirmDialog({ open: false, assignment: null });
  };

  const runClearanceCheck = async (userId = clearanceUserId) => {
    if (!userId) return;
    setClearanceLoading(true);
    setClearanceError(null);
    setClearanceSuccess(null);
    try {
      const response = await pcmsApi.checkClearance(userId);
      setClearanceData(response?.data || null);
    } catch (err) {
      setClearanceError(err?.message || "Unable to verify clearance.");
    } finally {
      setClearanceLoading(false);
    }
  };

  const finalizeSelectedClearance = async (decision) => {
    if (!clearanceUserId || !clearanceData) return;
    setClearanceLoading(true);
    setClearanceError(null);
    setClearanceSuccess(null);
    try {
      const response = await pcmsApi.finalizeClearance(
        clearanceUserId,
        decision,
        clearanceNotes,
      );
      setClearanceData((current) => ({
        ...current,
        clearance: response?.data?.clearance || current.clearance,
      }));
      setClearanceSuccess(`Clearance ${decision} decision recorded.`);
      setClearanceNotes("");
    } catch (err) {
      setClearanceError(err?.message || "Unable to finalize clearance.");
    } finally {
      setClearanceLoading(false);
    }
  };

  const handleReturnSubmit = async (event) => {
    event.preventDefault();
    if (!returnDialog.assignment) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await pcmsApi.returnAssignment(
        returnDialog.assignment.id,
        returnValues.notes,
        returnValues.condition_after,
      );
      setReturnDialog({ open: false, assignment: null });
      setReturnValues({ condition_after: "good", notes: "" });
      await Promise.all([loadAssignments(), loadAssets()]);
      setActionSuccess("Asset return recorded.");
    } catch (err) {
      setActionError(err?.message || "Unable to return asset.");
    }
  };

  const printAccountabilityForm = (assignment) => {
    const asset = assignment.asset || {};
    const employee = assignment.assigned_to || assignment.assignedTo || {};
    const accountabilityForm = assignment._details?.accountability_form;
    const payload = accountabilityForm?.payload || {};
    const parNumber =
      accountabilityForm?.form_number || `Assignment #${assignment.id}`;
    const accountabilityStatement = payload.accountability_statement || "N/A";
    const printWindow = window.open("", "_blank", "width=720,height=860");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Accountability Form</title></head>
        <body style="font-family:Arial,sans-serif;padding:32px;color:#111827;">
          <h1 style="font-size:22px;margin:0 0 4px;">Asset Accountability Form</h1>
          <p style="margin:0 0 24px;color:#6b7280;">PAR No.: ${parNumber}</p>
          <h2 style="font-size:15px;">Employee Information</h2>
          <p>${employee.full_name || employee.email || assignment.assigned_to}</p>
          <p>${employee.employee_id || ""} ${employee.department ? "- " + employee.department : ""}</p>
          <h2 style="font-size:15px;margin-top:24px;">Asset Information</h2>
          <p><strong>${asset.name || "Asset"}</strong></p>
          <p>${asset.property_number || ""} ${asset.brand ? "- " + asset.brand : ""} ${asset.model || ""}</p>
          <p>Location: ${asset.location || "N/A"}</p>
          <p>Serial Number: ${payload.asset?.serial_number || asset.serial_number || "N/A"}</p>
          <p>Physical Unit No.: ${formatPhysicalUnitNumber(assignment)}</p>
          <p>Acquisition Cost: ${formatCurrency(payload.asset?.acquisition_cost || asset.purchase_cost || 0)}</p>
          <p>Quantity: ${assignment.quantity || 1}</p>
          <p>Assigned: ${formatAssignmentDate(assignment.assigned_at)}</p>
          <p>Expected Return: ${formatAssignmentDate(assignment.due_date)}</p>
          <p>Purpose: ${assignment.purpose || assignment.notes || "N/A"}</p>
          <h2 style="font-size:15px;margin-top:24px;">Accountability Statement</h2>
          <p>${accountabilityStatement}</p>
          <div style="display:flex;gap:80px;margin-top:72px;">
            <div style="border-top:1px solid #111827;padding-top:8px;width:240px;">Employee Signature</div>
            <div style="border-top:1px solid #111827;padding-top:8px;width:240px;">Property Custodian Signature</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredAssets = assetsList
    .filter((asset) => {
      const query = assetQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        (asset.name || "").toLowerCase().includes(query) ||
        (asset.property_number || "").toLowerCase().includes(query) ||
        String(asset.asset_id || asset.id)
          .toLowerCase()
          .includes(query)
      );
    })
    .slice(0, 10);

  return (
    <>
      <ModulePage
        title="Asset Assignment"
        subtitle="Accountability, employee acceptance, return monitoring, and assignment history."
        primary="Create Assignment"
        icon={UserCheck}
        onPrimary={openCreateDialog}
        secondaryActions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setClearanceOpen((open) => !open)}
            >
              <ClipboardCheck size={16} /> Clearance
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                window.open(pcmsApi.assignmentExportUrl(), "_blank")
              }
            >
              <Download size={16} /> Export CSV
            </button>
          </>
        }
        stats={[
          ["Assigned Qty", `${stats.total_assigned_assets ?? 0}`, UserCheck],
          ["Available Assets", `${stats.available_assets ?? 0}`, PackageCheck],
          [
            "Pending Acceptance",
            `${stats.pending_assignments ?? 0}`,
            ClipboardList,
          ],
          ["Due Soon", `${stats.assets_due_for_return ?? 0}`, Bell],
          ["Returned Qty", `${stats.returned_assets ?? 0}`, PackageOpen],
          ["Overdue", `${stats.overdue_assignments ?? 0}`, AlertTriangle],
        ]}
      >
        {actionError && <div className="alert danger">{actionError}</div>}
        {actionSuccess && <div className="alert success">{actionSuccess}</div>}
        {clearanceOpen && (
          <div className="panel form-panel" style={{ marginBottom: 20 }}>
            <PanelHeader
              title="Clearance Verification"
              subtitle="Check assigned assets before recording a local final-clearance decision."
            />
            <div className="form-grid">
              <label>
                Employee / Custodian
                <select
                  value={clearanceUserId}
                  onChange={(event) => {
                    setClearanceUserId(event.target.value);
                    setClearanceData(null);
                    setClearanceError(null);
                  }}
                >
                  <option value="">Select an employee...</option>
                  {usersList.map((user) => (
                    <option key={user.id} value={user.id}>
                      {formatAssignmentUser(user)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Finalization Notes
                <input
                  value={clearanceNotes}
                  onChange={(event) => setClearanceNotes(event.target.value)}
                  placeholder="Optional verification notes"
                />
              </label>
            </div>
            <div className="inline-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => runClearanceCheck()}
                disabled={!clearanceUserId || clearanceLoading}
              >
                <ClipboardCheck size={16} />{" "}
                {clearanceLoading ? "Checking..." : "Run Clearance Check"}
              </button>
            </div>
            {clearanceError && (
              <div className="alert danger" style={{ marginTop: 12 }}>
                {clearanceError}
              </div>
            )}
            {clearanceSuccess && (
              <div className="alert success" style={{ marginTop: 12 }}>
                {clearanceSuccess}
              </div>
            )}
            {clearanceData && (
              <div className="asset-description-card" style={{ marginTop: 16 }}>
                <div
                  className="inline-actions"
                  style={{ justifyContent: "space-between" }}
                >
                  <strong>
                    Clearance #{clearanceData.clearance?.id || "N/A"}
                  </strong>
                  <span
                    className={`status ${clearanceData.clearance?.status === "cleared" ? "success" : clearanceData.clearance?.status === "hold" ? "danger" : "warning"}`}
                  >
                    {clearanceData.clearance?.status || "pending"}
                  </span>
                </div>
                <p>
                  Active assignments: {clearanceData.assignments?.length || 0}
                </p>
                <p>
                  Missing / unreturned items:{" "}
                  {clearanceData.missing_items?.length || 0}
                </p>
                {(clearanceData.missing_items || []).map((item) => (
                  <p key={item.assignment_id}>
                    <strong>
                      {item.property_number || "No property number"}
                    </strong>{" "}
                    - {item.asset_name} - {item.message}
                  </p>
                ))}
                <div className="inline-actions" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="small-button success"
                    onClick={() => finalizeSelectedClearance("cleared")}
                    disabled={
                      clearanceLoading ||
                      (clearanceData.missing_items || []).length > 0
                    }
                  >
                    Finalize Cleared
                  </button>
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => finalizeSelectedClearance("partial")}
                    disabled={clearanceLoading}
                  >
                    Finalize Partial
                  </button>
                  <button
                    type="button"
                    className="small-button danger-action"
                    onClick={() => finalizeSelectedClearance("hold")}
                    disabled={clearanceLoading}
                  >
                    Place on Hold
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="data-toolbar">
          <label>
            <Search size={16} />
            <input
              value={filters.search}
              onChange={(event) => updateFilters("search", event.target.value)}
              placeholder="Search assignments..."
            />
          </label>
          <select
            value={filters.status}
            onChange={(event) => updateFilters("status", event.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending_acceptance">Pending Acceptance</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.assignment_type}
            onChange={(event) =>
              updateFilters("assignment_type", event.target.value)
            }
          >
            <option value="">All Types</option>
            <option value="permanent">Permanent</option>
            <option value="temporary">Temporary</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Physical Unit No.</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton columns={7} rows={5} />
              ) : assignmentsData.length === 0 ? (
                <tr>
                  <td colSpan="8">No assignments found.</td>
                </tr>
              ) : (
                assignmentsData.map((assignment) => {
                  const employee =
                    assignment.assigned_to || assignment.assignedTo || {};
                  const overdue =
                    assignment.status === "active" &&
                    assignment.due_date &&
                    new Date(assignment.due_date) < new Date();
                  return (
                    <tr key={assignment.id}>
                      <td>
                        <strong>
                          {assignment.asset?.name ||
                            `Asset #${assignment.asset_id}`}
                        </strong>
                        <span>
                          {assignment.asset?.property_number ||
                            assignment.asset?.asset_id ||
                            "No property number"}
                        </span>
                      </td>
                      <td>
                        <strong>{formatAssignmentUser(employee)}</strong>
                        <span>{employee.department || "No department"}</span>
                      </td>
                      <td>{assignment.assignment_type || "permanent"}</td>
                      <td>{assignment.quantity || 1}</td>
                      <td>
                        {formatPhysicalUnitNumber(assignment)}
                        {getAssignmentUnit(assignment).serial_number && (
                          <span>SN {getAssignmentUnit(assignment).serial_number}</span>
                        )}
                      </td>
                      <td>
                        <span>
                          {formatAssignmentDate(assignment.assigned_at)}
                        </span>
                        <span>
                          Due {formatAssignmentDate(assignment.due_date)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${overdue ? "danger" : assignment.status === "returned" ? "success" : assignment.status === "pending_acceptance" ? "warning" : assignment.status === "cancelled" ? "danger" : "info"}`}
                        >
                          {overdue ? "overdue" : assignment.status}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions small">
                          <button
                            className="small-button"
                            type="button"
                            onClick={() => handleViewAssignment(assignment)}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            className="small-button"
                            type="button"
                            onClick={() => handleVerifyClick(assignment)}
                          >
                            <Shield size={14} /> Verify
                          </button>
                          {assignment.status === "pending_acceptance" && (
                            <button
                              className="small-button"
                              type="button"
                              onClick={() => handleAcceptClick(assignment)}
                            >
                              <CheckCircle2 size={14} /> Accept
                            </button>
                          )}
                          {["active", "pending_acceptance"].includes(
                            assignment.status,
                          ) && (
                            <button
                              className="small-button"
                              type="button"
                              onClick={() => handleReturnClick(assignment)}
                            >
                              <PackageCheck size={14} /> Return
                            </button>
                          )}
                          {["active", "pending_acceptance"].includes(
                            assignment.status,
                          ) && (
                            <button
                              className="small-button"
                              type="button"
                              onClick={() => handleCancelClick(assignment)}
                            >
                              <X size={14} /> Cancel
                            </button>
                          )}
                          <button
                            className="small-button"
                            type="button"
                            onClick={() => handlePrintClick(assignment)}
                          >
                            <Printer size={14} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="panel" style={{ marginTop: 20 }}>
          <PanelHeader
            title="Return Reminders"
            subtitle="Assignments due within seven days or already overdue."
          />
          <div className="activity-list expanded">
            {(dashboardData?.reminders || []).length === 0 ? (
              <p className="small-text">No return reminders right now.</p>
            ) : (
              dashboardData.reminders.map((reminder) => (
                <div key={reminder.assignment_id}>
                  <span className="activity-dot" />
                  <p>
                    {reminder.asset} assigned to {reminder.employee} is due{" "}
                    {reminder.due_date}
                  </p>
                  <time>
                    {reminder.days_remaining < 0
                      ? `${Math.abs(reminder.days_remaining)} days overdue`
                      : `${reminder.days_remaining} days left`}
                  </time>
                </div>
              ))
            )}
          </div>
        </div>
      </ModulePage>

      {showCreateDialog && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card wide-modal">
            <div className="modal-header">
              <h3>Create Asset Assignment</h3>
              <button
                className="icon-button"
                onClick={closeCreateDialog}
                aria-label="Close"
              >
                {" "}
                <X size={18} />{" "}
              </button>
            </div>
            <form className="register-form" onSubmit={handleCreateSubmit}>
              <div className="form-grid">
                <label style={{ position: "relative" }}>
                  Asset
                  <input
                    value={assetQuery}
                    onChange={(event) => {
                      setAssetQuery(event.target.value);
                      setShowAssetSuggestions(true);
                      updateField("asset_id", "");
                    }}
                    onFocus={() => setShowAssetSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowAssetSuggestions(false), 150)
                    }
                    placeholder="Type to search assets..."
                    required
                  />
                  {showAssetSuggestions && (
                    <ul
                      className="suggestions-list"
                      style={{
                        position: "absolute",
                        zIndex: 9999,
                        left: 0,
                        top: "calc(100% + 8px)",
                        width: "100%",
                        maxWidth: 560,
                        maxHeight: 220,
                        overflow: "auto",
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 8,
                        padding: 0,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                        listStyle: "none",
                        pointerEvents: "none",
                      }}
                    >
                      {filteredAssets.map((asset) => (
                        <li
                          key={asset.id}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.04)",
                            pointerEvents: "auto",
                          }}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            updateField("asset_id", asset.id);
                            setAssetQuery(
                              `${asset.name} - ${asset.property_number || asset.asset_id}`,
                            );
                            setShowAssetSuggestions(false);
                          }}
                        >
                          <strong style={{ display: "block" }}>
                            {asset.name}
                          </strong>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {asset.property_number || asset.asset_id} -{" "}
                            {formatDepartment(asset.department) ||
                              asset.location ||
                              "PPMO"}{" "}
                            - Available {getAvailableQuantity(asset)}
                          </div>
                        </li>
                      ))}
                      {filteredAssets.length === 0 &&
                        assetQuery.trim() !== "" && (
                          <li
                            style={{
                              padding: "10px 14px",
                              color: "#666",
                              pointerEvents: "auto",
                            }}
                          >
                            No assets found.
                          </li>
                        )}
                    </ul>
                  )}
                </label>
                <label>
                  Assigned To
                  {usersList.length > 0 ? (
                    <select
                      value={formValues.assigned_to}
                      onChange={(event) =>
                        updateField("assigned_to", event.target.value)
                      }
                      required
                    >
                      <option value="">Select a user...</option>
                      {usersList.map((user) => (
                        <option key={user.id} value={user.id}>
                          {formatAssignmentUser(user)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={formValues.assigned_to}
                      onChange={(event) =>
                        updateField("assigned_to", event.target.value)
                      }
                      placeholder="Paste user UUID"
                      required
                    />
                  )}
                </label>
                <label>
                  Assignment Type
                  <select
                    value={formValues.assignment_type}
                    onChange={(event) =>
                      updateField("assignment_type", event.target.value)
                    }
                  >
                    <option value="permanent">Permanent</option>
                    <option value="temporary">Temporary</option>
                    <option value="borrowed">Borrowed</option>
                  </select>
                </label>
                <label>
                  Assignment Date
                  <input
                    type="date"
                    value={formValues.assigned_at}
                    onChange={(event) =>
                      updateField("assigned_at", event.target.value)
                    }
                  />
                </label>
                <label>
                  Expected Return Date
                  <input
                    type="date"
                    value={formValues.due_date}
                    onChange={(event) =>
                      updateField("due_date", event.target.value)
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    max={
                      selectedAsset
                        ? getAvailableQuantity(selectedAsset)
                        : undefined
                    }
                    value={formValues.quantity}
                    onChange={(event) =>
                      updateField("quantity", event.target.value)
                    }
                    required
                  />
                </label>
                {Number(formValues.quantity || 1) === 1 && (
                  <label>
                    Physical Unit
                    <select
                      value={formValues.asset_unit_id || ""}
                      onChange={(event) =>
                        updateField("asset_unit_id", event.target.value)
                      }
                      disabled={!selectedAsset || assetUnits.length === 0}
                    >
                      <option value="">
                        {assetUnits.length
                          ? "Auto-select available unit"
                          : "No unit records available"}
                      </option>
                      {assetUnits
                        .filter((unit) => unit.status === "available")
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            ID {unit.id} - {unit.unit_code || "No unit code"}
                            {unit.serial_number
                              ? ` - SN ${unit.serial_number}`
                              : ""}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                <label>
                  Condition Before Assignment
                  <select
                    value={formValues.condition_before}
                    onChange={(event) =>
                      updateField("condition_before", event.target.value)
                    }
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </label>
                <label>
                  Photo Before Assignment
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      updateField("photo", event.target.files?.[0] || null)
                    }
                  />
                </label>
                <label>
                  Employee Signature
                  <input
                    value={formValues.employee_signature}
                    onChange={(event) =>
                      updateField("employee_signature", event.target.value)
                    }
                    placeholder="Typed name or signature reference"
                  />
                </label>
                <label>
                  Custodian Signature
                  <input
                    value={formValues.custodian_signature}
                    onChange={(event) =>
                      updateField("custodian_signature", event.target.value)
                    }
                    placeholder="Typed name or signature reference"
                  />
                </label>
                <label className="full-width">
                  Purpose
                  <textarea
                    value={formValues.purpose}
                    onChange={(event) =>
                      updateField("purpose", event.target.value)
                    }
                    rows={2}
                  />
                </label>
                <label className="full-width">
                  Notes
                  <textarea
                    value={formValues.remarks}
                    onChange={(event) =>
                      updateField("remarks", event.target.value)
                    }
                    rows={3}
                  />
                </label>
              </div>
              {selectedAsset && (
                <div className="alert info">
                  <strong>{selectedAsset.name}</strong>
                  <p style={{ margin: "6px 0 0" }}>
                    Property No.{" "}
                    {selectedAsset.property_number || selectedAsset.asset_id} -
                    Brand {selectedAsset.brand || "N/A"} - Model{" "}
                    {selectedAsset.model || "N/A"} - Location{" "}
                    {selectedAsset.location || "N/A"} - Available{" "}
                    {getAvailableQuantity(selectedAsset)} of{" "}
                    {selectedAsset.quantity || 1}
                  </p>
                  <p style={{ margin: "6px 0 0" }}>
                    Category{" "}
                    {selectedAsset.category?.name ||
                      selectedAsset.category ||
                      "N/A"}{" "}
                    - QR{" "}
                    {selectedAsset.qr_code_path ? "Attached" : "Not generated"}{" "}
                    - Warranty{" "}
                    {formatAssignmentDate(selectedAsset.warranty_until)}
                  </p>
                  {Number(formValues.quantity || 1) === 1 && (
                    <p style={{ margin: "6px 0 0" }}>
                      Unit ID: {formValues.asset_unit_id || "Auto-selected on save"} - Unit Code: {assetUnits.find((unit) => String(unit.id) === String(formValues.asset_unit_id))?.unit_code || "N/A"}
                    </p>
                  )}
                  {selectedAsset.qr_code_path && (
                    <img
                      src={assetQrCodeUrl(selectedAsset.qr_code_path)}
                      alt="Asset QR code"
                      style={{
                        width: 74,
                        height: 74,
                        marginTop: 10,
                        objectFit: "contain",
                      }}
                    />
                  )}
                </div>
              )}
              {selectedUser && (
                <div className="alert info">
                  <strong>{formatAssignmentUser(selectedUser)}</strong>
                  <p style={{ margin: "6px 0 0" }}>
                    Department {selectedUser.department || "N/A"} - Position{" "}
                    {selectedUser.position || selectedUser.role || "Employee"} -
                    Status {selectedUser.status || "active"}
                  </p>
                  {employeeProfile && (
                    <p style={{ margin: "6px 0 0" }}>
                      Active {employeeProfile.assigned_assets?.length || 0} -
                      Returned {employeeProfile.returned_assets?.length || 0} -
                      Overdue {employeeProfile.overdue_assets?.length || 0} -
                      Value {formatCurrency(employeeProfile.asset_value || 0)}
                    </p>
                  )}
                </div>
              )}
              {recommendations.length > 0 && (
                <div className="panel" style={{ margin: "12px 0" }}>
                  <PanelHeader
                    title="AI Recommendations"
                    subtitle="Assignment risk and inventory checks before saving."
                  />
                  <div className="activity-list expanded">
                    {recommendations.map((item, index) => (
                      <div key={`${item.type}-${index}`}>
                        <span className="activity-dot" />
                        <p>{item.message}</p>
                        <time>{item.severity}</time>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={formValues.accept_now}
                  onChange={(event) =>
                    updateField("accept_now", event.target.checked)
                  }
                />
                Employee already accepted this assignment
              </label>
              {createError && <div className="alert danger">{createError}</div>}
              {createSuccess && (
                <div className="alert success">{createSuccess}</div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={createLoading}
                >
                  {createLoading ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAssignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div
            className="modal-card wide-modal par-details-modal"
            style={{
              width: "min(1100px, calc(100vw - 32px))",
              maxWidth: "1100px",
              maxHeight: "calc(100vh - 32px)",
            }}
          >
            <div className="modal-header">
              <h3>Assignment Details</h3>
              <button
                className="icon-button"
                onClick={() => setSelectedAssignment(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body par-details-body">
              {selectedAssignment._detailsLoading && (
                <div className="loading-card">
                  Loading assignment history...
                </div>
              )}
              {selectedAssignment._detailsError && (
                <div className="alert danger">
                  {selectedAssignment._detailsError}
                </div>
              )}
              <div className="par-details-grid">
                <AssetDetailGrid asset={selectedAssignment.asset} />
                <div className="asset-description-card">
                  <span className="asset-detail-label">Accountability</span>
                  <p>
                    Employee:{" "}
                    {formatAssignmentUser(
                      selectedAssignment.assigned_to ||
                        selectedAssignment.assignedTo ||
                        {},
                    )}
                  </p>
                  <p>Quantity: {selectedAssignment.quantity || 1}</p>
                  <p>
                    Physical Unit No.: {formatPhysicalUnitNumber(selectedAssignment)}
                  </p>
                  <p>
                    Purpose:{" "}
                    {selectedAssignment.purpose ||
                      selectedAssignment.notes ||
                      "-"}
                  </p>
                  <p>Status: {selectedAssignment.status}</p>
                  <p>
                    Assigned:{" "}
                    {formatAssignmentDate(selectedAssignment.assigned_at)} -
                    Expected Return:{" "}
                    {formatAssignmentDate(selectedAssignment.due_date)}
                  </p>
                  <p>
                    Condition Before:{" "}
                    {selectedAssignment.condition_before || "N/A"} - Condition
                    After: {selectedAssignment.condition_after || "N/A"}
                  </p>
                  {selectedAssignment.asset?.qr_code_path && (
                    <img
                      src={assetQrCodeUrl(
                        selectedAssignment.asset.qr_code_path,
                      )}
                      alt="Assignment QR code"
                      style={{
                        width: 84,
                        height: 84,
                        objectFit: "contain",
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
                {selectedAssignment.asset && (
                  <div className="asset-description-card">
                    <span className="asset-detail-label">QR Scan Details</span>
                    <p>
                      Property Number:{" "}
                      {selectedAssignment.asset.property_number ||
                        selectedAssignment.asset.asset_id ||
                        "N/A"}
                    </p>
                    <p>
                      Assigned Employee:{" "}
                      {formatAssignmentUser(
                        selectedAssignment.assigned_to ||
                          selectedAssignment.assignedTo ||
                          {},
                      )}
                    </p>
                    <p>
                      Department:{" "}
                      {(
                        selectedAssignment.assigned_to ||
                        selectedAssignment.assignedTo ||
                        {}
                      ).department || "N/A"}
                    </p>
                    <p>
                      Status: {selectedAssignment.status} - Warranty:{" "}
                      {formatAssignmentDate(
                        selectedAssignment.asset.warranty_until,
                      )}
                    </p>
                    <p>
                      Location: {selectedAssignment.asset.location || "N/A"}
                    </p>
                  </div>
                )}
              </div>
              {selectedAssignment._details?.accountability_form && (
                <div className="asset-description-card">
                  <span className="asset-detail-label">
                    Digital Accountability Form
                  </span>
                  <p>
                    PAR No:{" "}
                    {
                      selectedAssignment._details.accountability_form
                        .form_number
                    }
                  </p>
                  <p>
                    Generated:{" "}
                    {formatAssignmentDate(
                      selectedAssignment._details.accountability_form
                        .generated_at,
                    )}
                  </p>
                  <p>
                    Property No.:{" "}
                    {selectedAssignment._details.accountability_form.payload
                      ?.asset?.property_number ||
                      selectedAssignment.asset?.property_number ||
                      "N/A"}
                  </p>
                  <p>
                    Serial No.:{" "}
                    {selectedAssignment._details.accountability_form.payload
                      ?.asset?.serial_number ||
                      selectedAssignment.asset?.serial_number ||
                      "N/A"}
                  </p>
                  <p>
                    Acquisition Cost:{" "}
                    {formatCurrency(
                      selectedAssignment._details.accountability_form.payload
                        ?.asset?.acquisition_cost ||
                        selectedAssignment.asset?.purchase_cost ||
                        0,
                    )}
                  </p>
                  <p>
                    Accountability Statement:{" "}
                    {selectedAssignment._details.accountability_form.payload
                      ?.accountability_statement || "N/A"}
                  </p>
                  <p>
                    Employee Signature:{" "}
                    {selectedAssignment.employee_signature || "Pending"}
                  </p>
                  <p>
                    Property Custodian Signature:{" "}
                    {selectedAssignment.custodian_signature || "Pending"}
                  </p>
                </div>
              )}
              {(selectedAssignment._details?.history || []).length > 0 && (
                <div className="asset-description-card">
                  <span className="asset-detail-label">Assignment History</span>
                  <div className="activity-list expanded">
                    {selectedAssignment._details.history.map((event) => (
                      <div key={event.id}>
                        <span className="activity-dot" />
                        <p>
                          {String(event.event_type || "updated").replaceAll(
                            "_",
                            " ",
                          )}
                        </p>
                        <time>{formatAssignmentDate(event.created_at)}</time>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => printAccountabilityForm(selectedAssignment)}
              >
                <Printer size={16} /> Print Form
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setSelectedAssignment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationAssignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>Assignment Verification</h3>
              <button
                className="icon-button"
                onClick={() => setVerificationAssignment(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {verificationAssignment._detailsLoading ? (
              <div className="loading-card">Loading verification details...</div>
            ) : (
              <div className="asset-description-card">
                <div className="inline-actions" style={{ justifyContent: "space-between" }}>
                  <strong>Verify assigned property</strong>
                  <span className="status success">Ready to verify</span>
                </div>
                <p><strong>Asset:</strong> {verificationAssignment.asset?.name || "N/A"}</p>
                <p><strong>Property Number:</strong> {verificationAssignment.asset?.property_number || verificationAssignment.asset?.asset_id || "N/A"}</p>
                <p><strong>Physical Unit No.:</strong> {formatPhysicalUnitNumber(verificationAssignment)}</p>
                <p><strong>Employee:</strong> {formatAssignmentUser(verificationAssignment.assigned_to || verificationAssignment.assignedTo || {})}</p>
                <p><strong>Department:</strong> {(verificationAssignment.assigned_to || verificationAssignment.assignedTo || {}).department || "N/A"}</p>
                <p><strong>Quantity:</strong> {verificationAssignment.quantity || 1}</p>
                <p><strong>Assignment Date:</strong> {formatAssignmentDate(verificationAssignment.assigned_at)}</p>
                <p><strong>Expected Return:</strong> {formatAssignmentDate(verificationAssignment.due_date)}</p>
                <p><strong>Condition:</strong> {verificationAssignment.condition_before || "N/A"}</p>
                <p><strong>Employee Signature:</strong> {verificationAssignment.employee_signature || "Pending"}</p>
                <p><strong>Custodian Signature:</strong> {verificationAssignment.custodian_signature || "Pending"}</p>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setVerificationAssignment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {returnDialog.open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Return Asset</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setReturnDialog({ open: false, assignment: null })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleReturnSubmit}>
              <label>
                Condition After Return
                <select
                  value={returnValues.condition_after}
                  onChange={(event) =>
                    setReturnValues((current) => ({
                      ...current,
                      condition_after: event.target.value,
                    }))
                  }
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_repair">Needs Repair</option>
                  <option value="damaged">Damaged</option>
                </select>
              </label>
              <label>
                Inspection Notes
                <textarea
                  value={returnValues.notes}
                  onChange={(event) =>
                    setReturnValues((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setReturnDialog({ open: false, assignment: null })
                  }
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Record Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsModal.open && detailsModal.assignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Asset Assignment Details</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setDetailsModal({ open: false, assignment: null })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <div className="asset-info-grid">
                <div className="asset-info-item">
                  <div className="asset-info-label">Asset</div>
                  <div className="asset-info-value">
                    {detailsModal.assignment.asset?.name ||
                      `Asset #${detailsModal.assignment.asset_id}`}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Property No.</div>
                  <div className="asset-info-value">
                    {detailsModal.assignment.asset?.property_number || "N/A"}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Employee</div>
                  <div className="asset-info-value">
                    {formatAssignmentUser(
                      detailsModal.assignment.assigned_to ||
                        detailsModal.assignment.assignedTo ||
                        {},
                    )}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Department</div>
                  <div className="asset-info-value">
                    {(
                      detailsModal.assignment.assigned_to ||
                      detailsModal.assignment.assignedTo ||
                      {}
                    ).department || "N/A"}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Quantity</div>
                  <div className="asset-info-value">
                    {detailsModal.assignment.quantity || 1}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Assignment Type</div>
                  <div className="asset-info-value">
                    {detailsModal.assignment.assignment_type || "N/A"}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Assigned Date</div>
                  <div className="asset-info-value">
                    {formatAssignmentDate(detailsModal.assignment.assigned_at)}
                  </div>
                </div>
                <div className="asset-info-item">
                  <div className="asset-info-label">Due Date</div>
                  <div className="asset-info-value">
                    {formatAssignmentDate(detailsModal.assignment.due_date)}
                  </div>
                </div>
                {detailsModal.assignment.accepted_at && (
                  <div className="asset-info-item">
                    <div className="asset-info-label">Accepted Date</div>
                    <div className="asset-info-value">
                      {formatAssignmentDate(
                        detailsModal.assignment.accepted_at,
                      )}
                    </div>
                  </div>
                )}
                {detailsModal.assignment.returned_at && (
                  <div className="asset-info-item">
                    <div className="asset-info-label">Returned Date</div>
                    <div className="asset-info-value">
                      {formatAssignmentDate(
                        detailsModal.assignment.returned_at,
                      )}
                    </div>
                  </div>
                )}
                <div className="asset-info-item">
                  <div className="asset-info-label">Status</div>
                  <span className={`status ${detailsModal.assignment.status}`}>
                    {detailsModal.assignment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDetailsModal({ open: false, assignment: null })
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {returnConfirmDialog.open && returnConfirmDialog.assignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Confirm Asset Return</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setReturnConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div className="confirmation-icon return">
                  <PackageCheck size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="confirmation-heading">
                    Are you sure you want to return this asset?
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "16px 20px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Asset
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#172033",
                      }}
                    >
                      {returnConfirmDialog.assignment.asset?.name ||
                        `Asset #${returnConfirmDialog.assignment.asset_id}`}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Property No.
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#172033",
                      }}
                    >
                      {returnConfirmDialog.assignment.asset?.property_number ||
                        "N/A"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Employee
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#172033",
                      }}
                    >
                      {formatAssignmentUser(
                        returnConfirmDialog.assignment.assigned_to ||
                          returnConfirmDialog.assignment.assignedTo ||
                          {},
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                      }}
                    >
                      Quantity
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#172033",
                      }}
                    >
                      {returnConfirmDialog.assignment.quantity || 1}
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-alert">
                <div className="info-alert-icon">ⓘ</div>
                <div className="info-alert-text">
                  This action will return the asset to available inventory.
                </div>
              </div>

              {returnConfirmDialog.error && (
                <div className="alert danger">{returnConfirmDialog.error}</div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setReturnConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                disabled={returnConfirmDialog.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmReturn}
                disabled={returnConfirmDialog.loading}
              >
                {returnConfirmDialog.loading
                  ? "Processing..."
                  : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelConfirmDialog.open && cancelConfirmDialog.assignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Cancel Asset Assignment</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setCancelConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <p>Are you sure you want to cancel this asset assignment?</p>
              {cancelConfirmDialog.assignment.status === "active" && (
                <p
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#d9534f",
                    fontWeight: "500",
                  }}
                >
                  ⚠ This asset is currently active. Cancelling may affect the
                  current assignment and inventory.
                </p>
              )}
              <p style={{ marginTop: "16px" }}>
                <strong>Asset:</strong>{" "}
                {cancelConfirmDialog.assignment.asset?.name ||
                  `Asset #${cancelConfirmDialog.assignment.asset_id}`}
              </p>
              <p>
                <strong>Employee:</strong>{" "}
                {formatAssignmentUser(
                  cancelConfirmDialog.assignment.assigned_to ||
                    cancelConfirmDialog.assignment.assignedTo ||
                    {},
                )}
              </p>
              <p>
                <strong>Quantity:</strong>{" "}
                {cancelConfirmDialog.assignment.quantity || 1}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                {cancelConfirmDialog.assignment.status}
              </p>
              {cancelConfirmDialog.error && (
                <div className="alert danger" style={{ marginTop: "12px" }}>
                  {cancelConfirmDialog.error}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setCancelConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                disabled={cancelConfirmDialog.loading}
              >
                Keep Assignment
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleConfirmCancel}
                disabled={cancelConfirmDialog.loading}
                style={{ backgroundColor: "#d9534f" }}
              >
                {cancelConfirmDialog.loading
                  ? "Processing..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {acceptConfirmDialog.open && acceptConfirmDialog.assignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Confirm Asset Acceptance</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setAcceptConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <p>Are you sure you want to accept this asset assignment?</p>
              <p style={{ marginTop: "16px" }}>
                <strong>Asset:</strong>{" "}
                {acceptConfirmDialog.assignment.asset?.name ||
                  `Asset #${acceptConfirmDialog.assignment.asset_id}`}
              </p>
              <p>
                <strong>Employee:</strong>{" "}
                {formatAssignmentUser(
                  acceptConfirmDialog.assignment.assigned_to ||
                    acceptConfirmDialog.assignment.assignedTo ||
                    {},
                )}
              </p>
              <p>
                <strong>Quantity:</strong>{" "}
                {acceptConfirmDialog.assignment.quantity || 1}
              </p>
              {acceptConfirmDialog.error && (
                <div className="alert danger" style={{ marginTop: "12px" }}>
                  {acceptConfirmDialog.error}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setAcceptConfirmDialog({
                    open: false,
                    assignment: null,
                    loading: false,
                    error: null,
                  })
                }
                disabled={acceptConfirmDialog.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmAccept}
                disabled={acceptConfirmDialog.loading}
              >
                {acceptConfirmDialog.loading
                  ? "Processing..."
                  : "Confirm Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {printConfirmDialog.open && printConfirmDialog.assignment && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Print Assignment</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setPrintConfirmDialog({ open: false, assignment: null })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <p>Print the asset assignment document?</p>
              <p style={{ marginTop: "16px" }}>
                <strong>Asset:</strong>{" "}
                {printConfirmDialog.assignment.asset?.name ||
                  `Asset #${printConfirmDialog.assignment.asset_id}`}
              </p>
              <p>
                <strong>Employee:</strong>{" "}
                {formatAssignmentUser(
                  printConfirmDialog.assignment.assigned_to ||
                    printConfirmDialog.assignment.assignedTo ||
                    {},
                )}
              </p>
              <p>
                <strong>Status:</strong> {printConfirmDialog.assignment.status}
              </p>
              {printConfirmDialog.assignment._details?.accountability_form && (
                <>
                  <p>
                    <strong>PAR No.:</strong>{" "}
                    {
                      printConfirmDialog.assignment._details.accountability_form
                        .form_number
                    }
                  </p>
                  <p>
                    <strong>Property No.:</strong>{" "}
                    {printConfirmDialog.assignment._details.accountability_form
                      .payload?.asset?.property_number || "N/A"}
                  </p>
                  <p>
                    <strong>Serial No.:</strong>{" "}
                    {printConfirmDialog.assignment._details.accountability_form
                      .payload?.asset?.serial_number || "N/A"}
                  </p>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setPrintConfirmDialog({ open: false, assignment: null })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  handleConfirmPrint(printConfirmDialog.assignment)
                }
              >
                Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RequesterHistory({ records = [] }) {
  const [search, setSearch] = useState("");
  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    if (!query) return true;
    return [
      record.reference_no,
      record.document_type,
      record.department,
      record.status,
      record.remarks,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    );
  });

  return (
    <section className="panel role-panel">
      <PanelHeader
        title="Request History"
        subtitle="All requester documents, approvals, remarks, and current workflow state."
      />
      <div className="data-toolbar">
        <label>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search history..."
          />
        </label>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Reference No</th>
              <th>Document Type</th>
              <th>Department</th>
              <th>Submitted</th>
              <th>Approved</th>
              <th>Status</th>
              <th>Current Approver</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.reference_no}</strong>
                </td>
                <td>{record.document_type}</td>
                <td>{record.department || "N/A"}</td>
                <td>
                  {record.submitted_date
                    ? new Date(record.submitted_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  {record.approved_date
                    ? new Date(record.approved_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <span
                    className={`status ${record.status === "rejected" ? "danger" : ["approved", "returned", "completed", "released", "transfer_completed"].includes(record.status) ? "success" : "warning"}`}
                  >
                    {record.status}
                  </span>
                </td>
                <td>{record.current_approver || "N/A"}</td>
                <td>{record.remarks || "-"}</td>
                <td>
                  <div className="inline-actions small">
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} /> Print
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      onClick={() =>
                        window.open(
                          pcmsApi.requesterExportUrl("requests"),
                          "_blank",
                        )
                      }
                    >
                      <Download size={14} /> CSV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9">No request history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RequesterNotifications({ notifications = [] }) {
  return (
    <section className="panel role-panel">
      <PanelHeader
        title="Notification Center"
        subtitle={`${notifications.length} requester workflow notification(s).`}
      />
      <div className="activity-list expanded">
        {notifications.map((notice) => (
          <div key={`${notice.type}-${notice.id}`}>
            <span className="activity-dot" />
            <p>
              <strong>{notice.title}</strong> {notice.message}
            </p>
            <time>
              {notice.created_at
                ? new Date(notice.created_at).toLocaleString()
                : ""}
            </time>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="empty-state">No requester notifications yet.</p>
        )}
      </div>
    </section>
  );
}

function RequesterAssignedAssets({ assignments = [], onChanged }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferUsers, setTransferUsers] = useState([]);
  const [transferDepartments, setTransferDepartments] = useState([]);
  const [transferRecipientsLoading, setTransferRecipientsLoading] =
    useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferForm, setTransferForm] = useState({
    to_department_id: "",
    to_custodian_id: "",
    quantity: "1",
    transfer_type: "permanent",
    expected_return_date: "",
    reason: "",
  });
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionForm, setActionForm] = useState({
    severity: "minor",
    priority: "medium",
    notes: "",
  });

  useEffect(() => {
    if (!transferTarget) return;
    setTransferForm({
      to_department_id: "",
      to_custodian_id: "",
      quantity: String(transferTarget.quantity || 1),
      transfer_type: "permanent",
      expected_return_date: "",
      reason: "",
    });
    setTransferRecipientsLoading(true);
    setError(null);
    Promise.all([pcmsApi.assignmentUsers(), pcmsApi.departments()])
      .then(([users, departments]) => {
        setTransferUsers(Array.isArray(users) ? users : users?.data || []);
        setTransferDepartments(
          Array.isArray(departments) ? departments : departments?.data || [],
        );
      })
      .catch((err) =>
        setError(err.message || "Unable to load transfer recipients."),
      )
      .finally(() => setTransferRecipientsLoading(false));
  }, [transferTarget]);

  const submitTransfer = async (event) => {
    event.preventDefault();
    if (!transferTarget) return;
    setTransferLoading(true);
    setError(null);
    setMessage(null);
    try {
      await pcmsApi.createTransfer({
        asset_id: transferTarget.asset_id,
        ...transferForm,
      });
      setMessage(
        "Transfer request submitted for staff and administrator verification.",
      );
      setTransferTarget(null);
      onChanged?.();
    } catch (err) {
      setError(err.message || "Unable to submit transfer request.");
    } finally {
      setTransferLoading(false);
    }
  };

  const openAssetAction = (assignment, type) => {
    setError(null);
    setActionTarget(assignment);
    setActionType(type);
    setActionForm({ severity: "minor", priority: "medium", notes: "" });
  };

  const submitAssetAction = async (event) => {
    event.preventDefault();
    if (!actionTarget || !actionType || !actionForm.notes.trim()) return;
    setActionLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (actionType === "damage") {
        await pcmsApi.createDamageReport({
          asset_id: actionTarget.asset_id,
          severity: actionForm.severity,
          description: actionForm.notes.trim(),
        });
        setMessage("Damage report submitted.");
      } else {
        await pcmsApi.createMaintenanceRecord({
          asset_id: actionTarget.asset_id,
          type: "requester_reported",
          priority: actionForm.priority,
          notes: actionForm.notes.trim(),
        });
        setMessage("Maintenance request submitted.");
      }
      setActionTarget(null);
      setActionType(null);
      onChanged?.();
    } catch (err) {
      setError(err.message || "Unable to submit asset report.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="panel role-panel">
      <PanelHeader
        title="My Assigned Assets"
        subtitle="Assigned assets with QR, condition, warranty, and integrated actions."
      />
      {message && <div className="form-message success">{message}</div>}
      {error && <div className="form-message error">{error}</div>}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>QR</th>
              <th>Serial</th>
              <th>Assigned Date</th>
              <th>Department</th>
              <th>Condition</th>
              <th>Warranty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <strong>
                    {assignment.asset?.name || `Asset #${assignment.asset_id}`}
                  </strong>
                  <span>
                    {assignment.asset?.property_number || "No property number"}
                  </span>
                </td>
                <td>
                  {assignment.asset?.qr_code_path ? (
                    <img
                      src={assetQrCodeUrl(assignment.asset.qr_code_path)}
                      alt="QR"
                      style={{ width: 42, height: 42, objectFit: "contain" }}
                    />
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{assignment.asset?.serial_number || "N/A"}</td>
                <td>
                  {assignment.assigned_at
                    ? new Date(assignment.assigned_at).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  {formatDepartment(assignment.asset?.department) ||
                    assignment.assigned_to?.department ||
                    "N/A"}
                </td>
                <td>
                  {assignment.asset?.condition ||
                    assignment.condition_before ||
                    "N/A"}
                </td>
                <td>
                  {assignment.asset?.warranty_until
                    ? new Date(
                        assignment.asset.warranty_until,
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td>
                  <span className="status info">{assignment.status}</span>
                </td>
                <td>
                  <div className="inline-actions small">
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => setTransferTarget(assignment)}
                    >
                      Request Transfer
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => openAssetAction(assignment, "damage")}
                    >
                      Report Damage
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => openAssetAction(assignment, "maintenance")}
                    >
                      Maintenance
                    </button>
                    <button
                      className="small-button"
                      type="button"
                      onClick={() =>
                        window.open(pcmsApi.assignmentExportUrl(), "_blank")
                      }
                    >
                      Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan="9">No assigned assets found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {actionTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => (actionLoading ? null : setActionTarget(null))}
        >
          <div
            className="modal-card requester-action-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>
                  {actionType === "damage"
                    ? "Report Asset Damage"
                    : "Request Asset Maintenance"}
                </h3>
                <p>
                  {actionTarget.asset?.name ||
                    actionTarget.item_name ||
                    `Asset #${actionTarget.asset_id}`}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setActionTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="modal-body" onSubmit={submitAssetAction}>
              {actionType === "damage" ? (
                <label>
                  Severity
                  <select
                    value={actionForm.severity}
                    onChange={(event) =>
                      setActionForm((current) => ({
                        ...current,
                        severity: event.target.value,
                      }))
                    }
                  >
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              ) : (
                <label>
                  Priority
                  <select
                    value={actionForm.priority}
                    onChange={(event) =>
                      setActionForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
              )}
              <label>
                {actionType === "damage"
                  ? "Damage Description"
                  : "Maintenance Details"}
                <textarea
                  rows="4"
                  value={actionForm.notes}
                  onChange={(event) =>
                    setActionForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder={
                    actionType === "damage"
                      ? "Describe the damage or issue."
                      : "Describe the maintenance needed."
                  }
                  required
                />
              </label>
              {error && <div className="form-message error">{error}</div>}
              <div className="modal-footer">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setActionTarget(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {transferTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => (transferLoading ? null : setTransferTarget(null))}
        >
          <div
            className="modal-card requester-transfer-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>Request Asset Transfer</h3>
                <p>
                  Submit this transfer for staff and administrator verification.
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setTransferTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form className="modal-body" onSubmit={submitTransfer}>
              <div className="form-message info">
                Asset:{" "}
                {transferTarget.asset?.name ||
                  transferTarget.item_name ||
                  `Asset #${transferTarget.asset_id}`}
              </div>
              {transferRecipientsLoading && (
                <div className="form-message info">
                  Loading departments and recipients...
                </div>
              )}
              <label>
                To Department
                <select
                  value={transferForm.to_department_id}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      to_department_id: event.target.value,
                    }))
                  }
                  required
                  disabled={transferRecipientsLoading}
                >
                  <option value="">Select department</option>
                  {transferDepartments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To User
                <select
                  value={transferForm.to_custodian_id}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      to_custodian_id: event.target.value,
                    }))
                  }
                  required
                  disabled={transferRecipientsLoading}
                >
                  <option value="">Select recipient</option>
                  {transferUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name ||
                        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                        user.email}
                      {user.role ? ` (${user.role})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  max={transferTarget.quantity || 1}
                  value={transferForm.quantity}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                Transfer Type
                <select
                  value={transferForm.transfer_type}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      transfer_type: event.target.value,
                      expected_return_date:
                        event.target.value === "temporary"
                          ? current.expected_return_date
                          : "",
                    }))
                  }
                >
                  <option value="permanent">Permanent</option>
                  <option value="temporary">Temporary</option>
                </select>
              </label>
              {transferForm.transfer_type === "temporary" && (
                <label>
                  Expected Return Date
                  <input
                    type="date"
                    value={transferForm.expected_return_date}
                    onChange={(event) =>
                      setTransferForm((current) => ({
                        ...current,
                        expected_return_date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              )}
              <label>
                Reason
                <textarea
                  rows="3"
                  value={transferForm.reason}
                  onChange={(event) =>
                    setTransferForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              {error && <div className="form-message error">{error}</div>}
              <div className="modal-footer">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  disabled={transferLoading}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    transferLoading ||
                    transferRecipientsLoading ||
                    transferUsers.length === 0
                  }
                >
                  {transferLoading
                    ? "Submitting..."
                    : "Submit Transfer Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function RequesterDownloads() {
  const downloads = [
    ["My Requests", "requests"],
    ["Purchase Orders", "purchase_orders"],
    ["Gate Passes", "gate_passes"],
    ["Assigned Assets", "assigned_assets"],
    ["Transfer Requests", "transfer_requests"],
  ];

  return (
    <section className="panel role-panel">
      <PanelHeader
        title="Download Documents"
        subtitle="Export requester records from integrated PCMS modules."
      />
      <div className="approval-list">
        {downloads.map(([label, type]) => (
          <article className="approval-card" key={type}>
            <div>
              <strong>{label}</strong>
              <p>CSV export from the live module data.</p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                window.open(pcmsApi.requesterExportUrl(type), "_blank")
              }
            >
              <Download size={16} /> Download
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AssignmentsPage() {
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [formValues, setFormValues] = useState({
    asset_id: "",
    assigned_to: "",
    due_date: "",
    remarks: "",
  });
  const [assetQuery, setAssetQuery] = useState("");
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [assignments, assets, users] = await Promise.allSettled([
          pcmsApi.assignments(),
          pcmsApi.assets(),
          pcmsApi.assignmentUsers(),
        ]);

        if (assignments.status === "fulfilled")
          setAssignmentsData(assignments.value || []);
        if (assets.status === "fulfilled") setAssetsList(assets.value || []);
        if (users.status === "fulfilled") setUsersList(users.value || []);
      } catch (err) {
        // ignore - show empty
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const openCreateDialog = () => {
    setCreateError(null);
    setCreateSuccess(null);
    setFormValues({ asset_id: "", assigned_to: "", due_date: "", remarks: "" });
    setAssetQuery("");
    setShowAssetSuggestions(false);
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateLoading(false);
    setShowAssetSuggestions(false);
  };

  const updateField = (field, value) =>
    setFormValues((c) => ({ ...c, [field]: value }));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    setCreateLoading(true);
    try {
      let selectedAssetId = formValues.asset_id;
      if (!selectedAssetId) {
        const exact = assetsList.find(
          (a) =>
            `${a.name} · ${a.property_number || a.asset_id}` === assetQuery ||
            (a.property_number && a.property_number === assetQuery) ||
            String(a.id) === String(assetQuery),
        );
        if (exact) {
          selectedAssetId = exact.id;
        } else {
          throw new Error("Please select an asset from the suggestions.");
        }
      }

      const payload = {
        asset_id: Number(selectedAssetId) || selectedAssetId,
        assigned_to: formValues.assigned_to,
        due_date: formValues.due_date || null,
        remarks: formValues.remarks || null,
      };
      const created = await pcmsApi.createAssignment(payload);
      setAssignmentsData((c) => [created, ...c]);
      setCreateSuccess("Assignment request created.");
      setTimeout(() => closeCreateDialog(), 700);
    } catch (err) {
      setCreateError(err?.message || "Failed to create assignment.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <WorkflowPage
        title="Asset Assignment"
        icon={UserCheck}
        items={assignmentsData}
        statusLabel="Assigned"
        onPrimary={openCreateDialog}
      />

      {showCreateDialog && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Assignment Request</h3>
              <button
                className="icon-button"
                onClick={closeCreateDialog}
                aria-label="Close"
              >
                {" "}
                <X size={18} />{" "}
              </button>
            </div>
            <form className="register-form" onSubmit={handleCreateSubmit}>
              <div className="form-grid">
                <label style={{ position: "relative" }}>
                  Asset
                  <input
                    value={assetQuery}
                    onChange={(ev) => {
                      setAssetQuery(ev.target.value);
                      setShowAssetSuggestions(true);
                      updateField("asset_id", "");
                    }}
                    onFocus={() => setShowAssetSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowAssetSuggestions(false), 150)
                    }
                    placeholder="Type to search assets..."
                    required
                  />
                  {showAssetSuggestions && (
                    <ul
                      className="suggestions-list"
                      style={{
                        position: "absolute",
                        zIndex: 9999,
                        left: 0,
                        top: "calc(100% + 8px)",
                        width: "100%",
                        maxWidth: 560,
                        maxHeight: "220px",
                        overflow: "auto",
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 8,
                        padding: 0,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                        listStyle: "none",
                        pointerEvents: "none",
                      }}
                    >
                      {assetsList
                        .filter((a) => {
                          const q = assetQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (a.name || "").toLowerCase().includes(q) ||
                            (a.property_number || "")
                              .toLowerCase()
                              .includes(q) ||
                            (String(a.asset_id || a.id) || "")
                              .toLowerCase()
                              .includes(q)
                          );
                        })
                        .slice(0, 10)
                        .map((a) => (
                          <li
                            key={a.id}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(0,0,0,0.04)",
                              pointerEvents: "auto",
                            }}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              updateField("asset_id", a.id);
                              setAssetQuery(
                                `${a.name} · ${a.property_number || a.asset_id}`,
                              );
                              setShowAssetSuggestions(false);
                            }}
                          >
                            <strong style={{ display: "block" }}>
                              {a.name}
                            </strong>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {a.property_number || a.asset_id} ·{" "}
                              {formatDepartment(a.department) ||
                                a.location ||
                                "PPMO"}
                            </div>
                          </li>
                        ))}
                      {assetsList.filter((a) => {
                        const q = assetQuery.trim().toLowerCase();
                        if (!q) return false;
                        return (
                          (a.name || "").toLowerCase().includes(q) ||
                          (a.property_number || "").toLowerCase().includes(q) ||
                          (String(a.asset_id || a.id) || "")
                            .toLowerCase()
                            .includes(q)
                        );
                      }).length === 0 &&
                        assetQuery.trim() !== "" && (
                          <li
                            style={{
                              padding: "10px 14px",
                              color: "#666",
                              pointerEvents: "auto",
                            }}
                          >
                            No assets found.
                          </li>
                        )}
                    </ul>
                  )}
                </label>
                <label>
                  Assigned To
                  {usersList.length > 0 ? (
                    <select
                      value={formValues.assigned_to}
                      onChange={(ev) =>
                        updateField("assigned_to", ev.target.value)
                      }
                      required
                    >
                      <option value="">Select a user...</option>
                      {usersList.map((user) => (
                        <option key={user.id} value={user.id}>
                          {formatAssignmentUser(user)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={formValues.assigned_to}
                      onChange={(ev) =>
                        updateField("assigned_to", ev.target.value)
                      }
                      placeholder="Paste user UUID"
                      required
                    />
                  )}
                </label>
                <label>
                  Due Date
                  <input
                    type="date"
                    value={formValues.due_date}
                    onChange={(ev) => updateField("due_date", ev.target.value)}
                  />
                </label>
                <label className="full-width">
                  Remarks
                  <textarea
                    value={formValues.remarks}
                    onChange={(ev) => updateField("remarks", ev.target.value)}
                    rows={3}
                  />
                </label>
              </div>
              {createError && <div className="alert danger">{createError}</div>}
              {createSuccess && (
                <div className="alert success">{createSuccess}</div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCreateDialog}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={createLoading}
                >
                  {createLoading ? "Creating…" : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function TransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [assetsList, setAssetsList] = useState([]);
  const [assetUnits, setAssetUnits] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    transfer_type: "",
  });
  const [formData, setFormData] = useState({
    asset_id: "",
    to_department_id: "",
    to_custodian_id: "",
    quantity: "1",
    transfer_type: "permanent",
    expected_return_date: "",
    reason: "",
  });
  const [assetQuery, setAssetQuery] = useState("");
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [executeDialog, setExecuteDialog] = useState({
    open: false,
    transfer: null,
  });
  const [executeValues, setExecuteValues] = useState({
    transfer_date: new Date().toISOString().slice(0, 10),
    actual_quantity: "1",
    condition_before: "good",
    condition_after: "good",
    photo_before: null,
    photo_after: null,
    receiving_signature: "",
    releasing_signature: "",
    remarks: "",
  });

  useEffect(() => {
    loadTransfers();
    pcmsApi
      .assets({ limit: 200 })
      .then(setAssetsList)
      .catch(() => {});
    pcmsApi
      .departments()
      .then(setDepartmentsList)
      .catch(() => {});
    pcmsApi
      .assignmentUsers()
      .then(setUsersList)
      .catch(() => {});
  }, []);

  const loadTransfers = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const [list, stats] = await Promise.allSettled([
        pcmsApi.fetchTransfers({ ...nextFilters, limit: 200 }),
        pcmsApi.transferDashboard(),
      ]);
      if (list.status === "fulfilled") setTransfers(list.value || []);
      if (stats.status === "fulfilled") setDashboard(stats.value || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assetsList.find(
    (asset) => String(asset.id) === String(formData.asset_id),
  );

  useEffect(() => {
    let ignore = false;
    if (!formData.asset_id) {
      setAssetUnits([]);
      return;
    }
    pcmsApi.assetUnits(formData.asset_id).then((units) => {
      if (!ignore) setAssetUnits(units || []);
    }).catch(() => {
      if (!ignore) setAssetUnits([]);
    });
    return () => { ignore = true; };
  }, [formData.asset_id]);
  const selectedDestinationDepartment = departmentsList.find(
    (department) => String(department.id) === String(formData.to_department_id),
  );
  const destinationUsers = usersList.filter(
    (user) => user.status === "active" &&
      selectedDestinationDepartment &&
      String(user.department || "").toLowerCase() ===
        String(selectedDestinationDepartment.name || "").toLowerCase(),
  );

  useEffect(() => {
    let ignore = false;
    if (!formData.asset_id) {
      setRecommendations([]);
      return;
    }
    pcmsApi
      .transferRecommendations({
        asset_id: formData.asset_id,
        quantity: formData.quantity || 1,
      })
      .then((items) => {
        if (!ignore) setRecommendations(items || []);
      })
      .catch(() => {
        if (!ignore) setRecommendations([]);
      });
    return () => {
      ignore = true;
    };
  }, [formData.asset_id, formData.quantity]);

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await pcmsApi.createTransfer(formData);
      setSuccess("Transfer request submitted for Department Head review.");
      setFormData({
        asset_id: "",
        asset_unit_id: "",
        to_department_id: "",
        to_custodian_id: "",
        quantity: "1",
        transfer_type: "permanent",
        expected_return_date: "",
        reason: "",
      });
      setAssetQuery("");
      setRecommendations([]);
      setShowForm(false);
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApproveTransfer = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      const result = await pcmsApi.approveTransfer(id);
      setSuccess(
        result.status === "ready_for_transfer"
          ? "Transfer is ready for execution."
          : "Department approval recorded.",
      );
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectTransfer = async (transfer) => {
    const reason = window.prompt("Reason for rejecting this transfer:");
    if (!reason) return;
    setError(null);
    setSuccess(null);
    try {
      await pcmsApi.rejectTransfer(transfer.id, reason);
      setSuccess("Transfer rejected and requester notified.");
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleHoldTransfer = async (transfer) => {
    const reason = window.prompt("Reason for placing this transfer on hold:");
    if (!reason) return;
    setError(null);
    setSuccess(null);
    try {
      await pcmsApi.holdTransfer(transfer.id, reason);
      setSuccess("Transfer placed on hold.");
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRevisionTransfer = async (transfer) => {
    const reason = window.prompt("Revision or information needed:");
    if (!reason) return;
    setError(null);
    setSuccess(null);
    try {
      await pcmsApi.requestTransferRevision(transfer.id, reason);
      setSuccess("Revision request sent to requester.");
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewTransfer = async (transfer) => {
    setSelectedTransfer({ ...transfer, _detailsLoading: true });
    try {
      const details = await pcmsApi.transfer(transfer.id);
      setSelectedTransfer({
        ...(details.transfer || transfer),
        _details: details,
        _detailsLoading: false,
      });
    } catch {
      setSelectedTransfer({ ...transfer, _detailsLoading: false });
    }
  };

  const openExecuteDialog = (transfer) => {
    setExecuteValues({
      transfer_date: new Date().toISOString().slice(0, 10),
      actual_quantity: String(transfer.quantity || 1),
      condition_before: transfer.asset?.condition || "good",
      condition_after: transfer.asset?.condition || "good",
      photo_before: null,
      photo_after: null,
      receiving_signature: "",
      releasing_signature: "",
      remarks: "",
    });
    setExecuteDialog({ open: true, transfer });
  };

  const handleExecuteSubmit = async (event) => {
    event.preventDefault();
    if (!executeDialog.transfer) return;
    setError(null);
    setSuccess(null);
    try {
      await pcmsApi.executeTransfer(executeDialog.transfer.id, {
        ...executeValues,
        actual_quantity: Number(executeValues.actual_quantity || 1),
      });
      setExecuteDialog({ open: false, transfer: null });
      setSuccess("Transfer completed and asset registry updated.");
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateFilters = (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    loadTransfers(next);
  };

  const stats = dashboard || {
    pending_transfers: transfers.filter((item) =>
      ["transfer_requested", "revision_requested", "pending"].includes(
        item.status,
      ),
    ).length,
    approved: transfers.filter((item) =>
      ["department_approved", "ready_for_transfer", "approved"].includes(
        item.status,
      ),
    ).length,
    completed: transfers.filter((item) => item.status === "transfer_completed")
      .length,
    rejected: transfers.filter((item) => item.status === "rejected").length,
    on_hold: transfers.filter((item) => item.status === "on_hold").length,
    temporary_transfers: transfers.filter(
      (item) => item.transfer_type === "temporary",
    ).length,
  };

  const transferStatusTone = (status) => {
    if (
      ["transfer_completed", "approved", "ready_for_transfer"].includes(status)
    )
      return "success";
    if (["rejected", "cancelled"].includes(status)) return "danger";
    if (["on_hold", "revision_requested"].includes(status)) return "warning";
    return "info";
  };

  const formatTransferDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  };

  const printTransfer = (transfer) => {
    const unit = transfer.assetUnit || {};
    const printWindow = window.open("", "_blank", "width=720,height=860");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Asset Transfer ${transfer.transfer_number || transfer.id}</title></head>
      <body style="font-family:Arial,sans-serif;padding:32px;color:#111827;">
        <h1 style="font-size:22px;margin:0 0 4px;">Asset Transfer Record</h1>
        <p style="color:#6b7280;">Transfer No.: ${transfer.transfer_number || transfer.id}</p>
        <h2 style="font-size:15px;">Asset Identity</h2>
        <p><strong>${transfer.asset?.name || "Asset"}</strong></p>
        <p>Property Number: ${transfer.asset?.property_number || "N/A"}</p>
        <p>Asset Unit ID: ${transfer.asset_unit_id || unit.id || "N/A"}</p>
        <p>Unit Code: ${unit.unit_code || "N/A"}</p>
        <p>Serial Number: ${unit.serial_number || transfer.asset?.serial_number || "N/A"}</p>
        <p>Quantity: ${transfer.actual_quantity || transfer.quantity || 1}</p>
        <p>From: ${formatDepartment(transfer.from_department) || "N/A"}</p>
        <p>To: ${formatDepartment(transfer.to_department) || "N/A"}</p>
        <p>Transfer Date: ${formatTransferDate(transfer.transfer_date)}</p>
        <p>Status: ${String(transfer.status || "").replaceAll("_", " ")}</p>
        <p>Reason: ${transfer.reason || "N/A"}</p>
        <script>window.print();<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <ModulePage
      title="Asset Transfer"
      subtitle="Request, review, approve, and execute department-to-department property movement."
      primary="New Transfer"
      icon={Truck}
      onPrimary={() => setShowForm(!showForm)}
      secondaryActions={
        <button
          type="button"
          className="secondary-button"
          onClick={() => window.open(pcmsApi.transferExportUrl(), "_blank")}
        >
          <Download size={16} /> Export CSV
        </button>
      }
      stats={[
        ["Pending", `${stats.pending_transfers || 0}`, ClipboardList],
        ["Approved", `${stats.approved || 0}`, CheckCircle2],
        ["Completed", `${stats.completed || 0}`, PackageCheck],
        ["Rejected", `${stats.rejected || 0}`, X],
        ["On Hold", `${stats.on_hold || 0}`, AlertTriangle],
        ["Temporary", `${stats.temporary_transfers || 0}`, History],
      ]}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Create Transfer Request</h3>
          <form onSubmit={handleCreateTransfer}>
            <div className="field-row">
              <label>Asset</label>
              <div style={{ position: "relative" }}>
                <input
                  value={assetQuery}
                  onChange={(e) => {
                    setAssetQuery(e.target.value);
                    setShowAssetSuggestions(true);
                    setFormData({ ...formData, asset_id: "" });
                  }}
                  onFocus={() => setShowAssetSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowAssetSuggestions(false), 150)
                  }
                  placeholder="Type to search assets..."
                  required
                />
                {showAssetSuggestions && (
                  <ul
                    className="suggestions-list"
                    style={{
                      position: "absolute",
                      zIndex: 9999,
                      left: 0,
                      top: "calc(100% + 8px)",
                      width: "100%",
                      maxWidth: 560,
                      maxHeight: 220,
                      overflow: "auto",
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 8,
                      padding: 0,
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      listStyle: "none",
                    }}
                  >
                    {assetsList
                      .filter((a) => {
                        const q = assetQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (a.name || "").toLowerCase().includes(q) ||
                          (a.property_number || "").toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 10)
                      .map((a) => (
                        <li
                          key={a.id}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.04)",
                          }}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setFormData({ ...formData, asset_id: a.id });
                            setAssetQuery(
                              `${a.name} · ${a.property_number || a.asset_id}`,
                            );
                            setShowAssetSuggestions(false);
                          }}
                        >
                          <strong style={{ display: "block" }}>{a.name}</strong>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {a.property_number || a.asset_id} · Currently:{" "}
                            {formatDepartment(a.department) || "Unassigned"}
                          </div>
                        </li>
                      ))}
                    {assetsList.filter((a) => {
                      const q = assetQuery.trim().toLowerCase();
                      if (!q) return false;
                      return (
                        (a.name || "").toLowerCase().includes(q) ||
                        (a.property_number || "").toLowerCase().includes(q)
                      );
                    }).length === 0 &&
                      assetQuery.trim() !== "" && (
                        <li style={{ padding: "10px 14px", color: "#666" }}>
                          No assets found.
                        </li>
                      )}
                  </ul>
                )}
              </div>
            </div>
            <div className="field-row">
              <label>To Department</label>
              <select
                value={formData.to_department_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    to_department_id: e.target.value,
                    to_custodian_id: "",
                  })
                }
                required
              >
                <option value="">Select department</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label>Destination Custodian</label>
              <select
                value={formData.to_custodian_id}
                onChange={(e) =>
                  setFormData({ ...formData, to_custodian_id: e.target.value })
                }
                required
              >
                <option value="">Select custodian</option>
                {destinationUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatAssignmentUser(user)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedAsset?.quantity || undefined}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
            {Number(formData.quantity || 1) === 1 && (
              <div className="field-row">
                <label>Physical Unit</label>
                <select
                  value={formData.asset_unit_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, asset_unit_id: e.target.value })
                  }
                  disabled={!selectedAsset || assetUnits.length === 0}
                >
                  <option value="">
                    {assetUnits.length ? "Auto-select unit" : "No unit records available"}
                  </option>
                  {assetUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      ID {unit.id} - {unit.unit_code || "No unit code"}
                      {unit.serial_number ? ` - SN ${unit.serial_number}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="field-row">
              <label>Transfer Type</label>
              <select
                value={formData.transfer_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    transfer_type: e.target.value,
                    expected_return_date:
                      e.target.value === "temporary"
                        ? formData.expected_return_date
                        : "",
                  })
                }
              >
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            {formData.transfer_type === "temporary" && (
              <div className="field-row">
                <label>Expected Return Date</label>
                <input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_return_date: e.target.value,
                    })
                  }
                  required
                />
              </div>
            )}
            <div className="field-row">
              <label>Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={3}
                required
              />
            </div>
            {selectedAsset && (
              <div className="alert info">
                <strong>{selectedAsset.name}</strong>
                <p style={{ margin: "6px 0 0" }}>
                  Property No.{" "}
                  {selectedAsset.property_number || selectedAsset.asset_id} -
                  Current Department{" "}
                  {formatDepartment(selectedAsset.department) || "Unassigned"} -
                  Quantity {selectedAsset.quantity || 1} - Condition{" "}
                  {selectedAsset.condition || "good"}
                </p>
                {Number(formData.quantity || 1) === 1 && (
                  <p style={{ margin: "6px 0 0" }}>
                    Unit ID: {formData.asset_unit_id || "Auto-selected on save"} - Unit Code: {assetUnits.find((unit) => String(unit.id) === String(formData.asset_unit_id))?.unit_code || "N/A"}
                  </p>
                )}
              </div>
            )}
            {recommendations.length > 0 && (
              <div className="panel" style={{ marginBottom: 12 }}>
                <PanelHeader
                  title="AI Recommendations"
                  subtitle="Risk signals before submitting this transfer."
                />
                <div className="activity-list expanded">
                  {recommendations.map((item, index) => (
                    <div key={`${item.type}-${index}`}>
                      <span className="activity-dot" />
                      <p>{item.message}</p>
                      <time>{item.severity}</time>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Submit Request
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setAssetQuery("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="data-toolbar">
        <label>
          <Search size={16} />
          <input
            value={filters.search}
            onChange={(event) => updateFilters("search", event.target.value)}
            placeholder="Search transfers..."
          />
        </label>
        <select
          value={filters.status}
          onChange={(event) => updateFilters("status", event.target.value)}
        >
          <option value="">All Status</option>
          <option value="transfer_requested">Requested</option>
          <option value="department_approved">Department Approved</option>
          <option value="ready_for_transfer">Ready for Transfer</option>
          <option value="transfer_completed">Completed</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="on_hold">On Hold</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filters.transfer_type}
          onChange={(event) =>
            updateFilters("transfer_type", event.target.value)
          }
        >
          <option value="">All Types</option>
          <option value="permanent">Permanent</option>
          <option value="temporary">Temporary</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Transfer No.</th>
              <th>Asset</th>
              <th>From</th>
              <th>To</th>
              <th>Type / Qty</th>
              <th>Unit ID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan="8">No transfers yet</td>
              </tr>
            ) : (
              transfers.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.transfer_number || `TR-${item.id}`}</strong>
                  </td>
                  <td>
                    <strong>
                      {item.asset?.name || `Asset #${item.asset_id}`}
                    </strong>
                    <span>
                      {item.asset?.property_number || "No property number"}
                    </span>
                  </td>
                  <td>
                    <span>
                      {formatDepartment(item.from_department) ||
                        `Dept ${item.from_department_id}`}
                    </span>
                    <span>
                      {formatAssignmentUser(item.from_custodian || {})}
                    </span>
                  </td>
                  <td>
                    <span>
                      {formatDepartment(item.to_department) ||
                        `Dept ${item.to_department_id}`}
                    </span>
                    <span>{formatAssignmentUser(item.to_custodian || {})}</span>
                  </td>
                  <td>
                    <span>{item.transfer_type || "permanent"}</span>
                    <span>
                      Qty {item.actual_quantity || item.quantity || 1}
                    </span>
                  </td>
                  <td>
                    {item.assetUnit?.unit_code || item.asset_unit_id || "N/A"}
                    {(item.assetUnit?.unit_code || item.assetUnit?.serial_number) && (
                      <span>{item.assetUnit?.unit_code || item.assetUnit?.serial_number}</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status ${transferStatusTone(item.status)}`}
                    >
                      {String(item.status || "").replaceAll("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div className="inline-actions small">
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => handleViewTransfer(item)}
                      >
                        <Eye size={14} /> View
                      </button>
                      {[
                        "pending",
                        "transfer_requested",
                        "department_approved",
                        "on_hold",
                      ].includes(item.status) && (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => handleApproveTransfer(item.id)}
                        >
                          <CheckCircle2 size={14} /> Approve
                        </button>
                      )}
                      {item.status === "ready_for_transfer" && (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => openExecuteDialog(item)}
                        >
                          <Truck size={14} /> Execute
                        </button>
                      )}
                      {[
                        "transfer_requested",
                        "department_approved",
                        "ready_for_transfer",
                        "on_hold",
                      ].includes(item.status) && (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => handleRejectTransfer(item)}
                        >
                          <X size={14} /> Reject
                        </button>
                      )}
                      {["department_approved", "ready_for_transfer"].includes(
                        item.status,
                      ) && (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => handleHoldTransfer(item)}
                        >
                          <AlertTriangle size={14} /> Hold
                        </button>
                      )}
                      {[
                        "transfer_requested",
                        "department_approved",
                        "on_hold",
                      ].includes(item.status) && (
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => handleRevisionTransfer(item)}
                        >
                          <Pencil size={14} /> Revise
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {dashboard?.temporary_due?.length > 0 && (
        <div className="panel" style={{ marginTop: 20 }}>
          <PanelHeader
            title="Temporary Transfer Returns"
            subtitle="Temporary transfers due within seven days or already due."
          />
          <div className="activity-list expanded">
            {dashboard.temporary_due.map((item) => (
              <div key={item.id}>
                <span className="activity-dot" />
                <p>
                  {item.transfer_number} -{" "}
                  {item.asset?.name || `Asset #${item.asset_id}`}
                </p>
                <time>Due {formatTransferDate(item.expected_return_date)}</time>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTransfer && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Transfer Details</h3>
              <button
                className="icon-button"
                onClick={() => setSelectedTransfer(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="asset-description-card">
              <span className="asset-detail-label">
                {selectedTransfer.transfer_number}
              </span>
              <p>
                Asset:{" "}
                {selectedTransfer.asset?.name ||
                  `Asset #${selectedTransfer.asset_id}`}
              </p>
              <p>
                Type: {selectedTransfer.transfer_type || "permanent"} -
                Quantity:{" "}
                {selectedTransfer.actual_quantity ||
                  selectedTransfer.quantity ||
                  1}
              </p>
              <p>
                Asset Unit ID: {selectedTransfer.assetUnit?.unit_code || selectedTransfer.asset_unit_id || "N/A"}
              </p>
              <p>
                From:{" "}
                {formatDepartment(selectedTransfer.from_department) || "N/A"} to{" "}
                {formatDepartment(selectedTransfer.to_department) || "N/A"}
              </p>
              <p>
                Custodian:{" "}
                {formatAssignmentUser(selectedTransfer.from_custodian || {})} to{" "}
                {formatAssignmentUser(selectedTransfer.to_custodian || {})}
              </p>
              <p>
                Status:{" "}
                {String(selectedTransfer.status || "").replaceAll("_", " ")}
              </p>
              <p>Reason: {selectedTransfer.reason || "-"}</p>
              {selectedTransfer.transfer_type === "temporary" && (
                <p>
                  Expected Return:{" "}
                  {formatTransferDate(selectedTransfer.expected_return_date)}
                </p>
              )}
            </div>
            {(selectedTransfer._details?.recommendations || []).length > 0 && (
              <div className="asset-description-card">
                <span className="asset-detail-label">AI Recommendations</span>
                {(selectedTransfer._details.recommendations || []).map(
                  (item, index) => (
                    <p key={`${item.type}-${index}`}>{item.message}</p>
                  ),
                )}
              </div>
            )}
            {(selectedTransfer._details?.history || []).length > 0 && (
              <div className="asset-description-card">
                <span className="asset-detail-label">Transfer History</span>
                <div className="activity-list expanded">
                  {selectedTransfer._details.history.map((event) => (
                    <div key={event.id}>
                      <span className="activity-dot" />
                      <p>
                        {String(event.event_type || "").replaceAll("_", " ")}
                      </p>
                      <time>{formatTransferDate(event.created_at)}</time>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => printTransfer(selectedTransfer)}
              >
                <Printer size={16} /> Print Transfer
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setSelectedTransfer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {executeDialog.open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card wide-modal">
            <div className="modal-header">
              <h3>Execute Transfer</h3>
              <button
                className="icon-button"
                onClick={() =>
                  setExecuteDialog({ open: false, transfer: null })
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleExecuteSubmit}>
              <div className="form-grid">
                <label>
                  Transfer Date
                  <input
                    type="date"
                    value={executeValues.transfer_date}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        transfer_date: e.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Actual Quantity
                  <input
                    type="number"
                    min="1"
                    max={executeDialog.transfer?.quantity || 1}
                    value={executeValues.actual_quantity}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        actual_quantity: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Condition Before
                  <select
                    value={executeValues.condition_before}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        condition_before: e.target.value,
                      }))
                    }
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost_parts">Lost Parts</option>
                  </select>
                </label>
                <label>
                  Condition After
                  <select
                    value={executeValues.condition_after}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        condition_after: e.target.value,
                      }))
                    }
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost_parts">Lost Parts</option>
                  </select>
                </label>
                <label>
                  Photo Before
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        photo_before: e.target.files?.[0] || null,
                      }))
                    }
                  />
                </label>
                <label>
                  Photo After
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        photo_after: e.target.files?.[0] || null,
                      }))
                    }
                  />
                </label>
                <label>
                  Receiving Custodian Signature
                  <input
                    value={executeValues.receiving_signature}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        receiving_signature: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Releasing Custodian Signature
                  <input
                    value={executeValues.releasing_signature}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        releasing_signature: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="full-width">
                  Remarks
                  <textarea
                    rows={3}
                    value={executeValues.remarks}
                    onChange={(e) =>
                      setExecuteValues((current) => ({
                        ...current,
                        remarks: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setExecuteDialog({ open: false, transfer: null })
                  }
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: "",
    maintenance_type: "",
    description: "",
    scheduled_date: "",
    technician_name: "",
    status: "pending",
  });
  const [assetQuery, setAssetQuery] = useState("");
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);

  useEffect(() => {
    loadRecords();
    loadPredictions();
    pcmsApi
      .assets({ limit: 200 })
      .then(setAssetsList)
      .catch(() => {});
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.fetchMaintenanceRecords();
      setRecords(response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async () => {
    try {
      setLoadingPredictions(true);
      const response = await pcmsApi.fetchMaintenancePredictions();
      setPredictions(response || []);
    } catch (err) {
      // non-fatal - predictions are a bonus panel, don't block the page on it
    } finally {
      setLoadingPredictions(false);
    }
  };

  const scheduleFromPrediction = (prediction) => {
    setFormData({
      asset_id: String(prediction.asset_id),
      maintenance_type: "preventive",
      description: `Preventive maintenance (projected from ${prediction.avg_interval_days}-day repair pattern).`,
      scheduled_date: "",
      technician_name: "",
      status: "pending",
    });
    setAssetQuery(`${prediction.asset_name} · ${prediction.property_number}`);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pcmsApi.createMaintenanceRecord(formData);
      setSuccess("Maintenance record created successfully");
      setFormData({
        asset_id: "",
        maintenance_type: "",
        description: "",
        scheduled_date: "",
        technician_name: "",
        status: "pending",
      });
      setAssetQuery("");
      setShowForm(false);
      loadRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await pcmsApi.updateMaintenanceRecord(id, { status: "completed" });
      setSuccess("Maintenance marked as completed");
      loadRecords();
      loadPredictions();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModulePage
      title="Maintenance"
      subtitle="Preventive and corrective maintenance scheduling with technician history."
      primary="Schedule Maintenance"
      icon={Wrench}
      onPrimary={() => setShowForm(!showForm)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Schedule Maintenance</h3>
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <label>Asset</label>
              <div style={{ position: "relative" }}>
                <input
                  value={assetQuery}
                  onChange={(e) => {
                    setAssetQuery(e.target.value);
                    setShowAssetSuggestions(true);
                    setFormData({ ...formData, asset_id: "" });
                  }}
                  onFocus={() => setShowAssetSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowAssetSuggestions(false), 150)
                  }
                  placeholder="Type to search assets..."
                  required
                />
                {showAssetSuggestions && (
                  <ul
                    className="suggestions-list"
                    style={{
                      position: "absolute",
                      zIndex: 9999,
                      left: 0,
                      top: "calc(100% + 8px)",
                      width: "100%",
                      maxWidth: 560,
                      maxHeight: 220,
                      overflow: "auto",
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 8,
                      padding: 0,
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      listStyle: "none",
                    }}
                  >
                    {assetsList
                      .filter((a) => {
                        const q = assetQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (a.name || "").toLowerCase().includes(q) ||
                          (a.property_number || "").toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 10)
                      .map((a) => (
                        <li
                          key={a.id}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.04)",
                          }}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setFormData({ ...formData, asset_id: a.id });
                            setAssetQuery(
                              `${a.name} · ${a.property_number || a.asset_id}`,
                            );
                            setShowAssetSuggestions(false);
                          }}
                        >
                          <strong style={{ display: "block" }}>{a.name}</strong>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {a.property_number || a.asset_id}
                          </div>
                        </li>
                      ))}
                    {assetsList.filter((a) => {
                      const q = assetQuery.trim().toLowerCase();
                      if (!q) return false;
                      return (
                        (a.name || "").toLowerCase().includes(q) ||
                        (a.property_number || "").toLowerCase().includes(q)
                      );
                    }).length === 0 &&
                      assetQuery.trim() !== "" && (
                        <li style={{ padding: "10px 14px", color: "#666" }}>
                          No assets found.
                        </li>
                      )}
                  </ul>
                )}
              </div>
            </div>
            <div className="field-row">
              <label>Maintenance Type</label>
              <select
                value={formData.maintenance_type}
                onChange={(e) =>
                  setFormData({ ...formData, maintenance_type: e.target.value })
                }
                required
              >
                <option value="">Select type</option>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div className="field-row">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>
            {movementData.movement_type === "in" && (
              <>
                <div className="field-row">
                  <label>Supplier / Source</label>
                  <input
                    value={movementData.supplier_source}
                    onChange={(e) =>
                      setMovementData({
                        ...movementData,
                        supplier_source: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="field-row">
                  <label>Reference No. / PO No.</label>
                  <input
                    value={movementData.reference_no}
                    onChange={(e) =>
                      setMovementData({
                        ...movementData,
                        reference_no: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="field-row">
                  <label>Date</label>
                  <input
                    type="date"
                    value={movementData.date}
                    onChange={(e) =>
                      setMovementData({ ...movementData, date: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div className="field-row">
              <label>Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Technician Name</label>
              <input
                value={formData.technician_name}
                onChange={(e) =>
                  setFormData({ ...formData, technician_name: e.target.value })
                }
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Create Record
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setAssetQuery("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel">
        <PanelHeader
          title="Predicted Maintenance Due"
          subtitle="Projected from each asset's own repair-interval history"
        />
        {loadingPredictions ? (
          <div className="loading-card">Analyzing repair history…</div>
        ) : predictions.length === 0 ? (
          <p className="small-text">
            No predictions yet — assets need at least 2 completed maintenance
            records before a pattern can be projected.
          </p>
        ) : (
          <div className="alert-list">
            {predictions.map((prediction) => (
              <article className="anomaly-card" key={prediction.asset_id}>
                <div>
                  <strong>{prediction.asset_name}</strong>
                  <p>
                    {prediction.is_overdue
                      ? "Overdue since "
                      : "Projected around "}
                    {new Date(prediction.predicted_date).toLocaleDateString()}{" "}
                    (~{prediction.avg_interval_days}-day repair pattern,{" "}
                    {prediction.sample_size} past records)
                  </p>
                </div>
                <div className="card-actions">
                  <span
                    className={`status ${prediction.is_overdue ? "danger" : "warning"}`}
                  >
                    {prediction.is_overdue
                      ? "Overdue"
                      : `Due in ${prediction.days_until_due}d`}
                  </span>
                  <button
                    className="small-button"
                    onClick={() => scheduleFromPrediction(prediction)}
                  >
                    Schedule Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-card">Loading maintenance records...</div>
      ) : (
        <div className="timeline">
          {records.length === 0 ? (
            <p>No maintenance records yet</p>
          ) : (
            records.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div
                  className={`timeline-dot ${(item.status || "pending").toLowerCase()}`}
                />
                <div>
                  <strong>
                    {item.asset?.name || `Asset #${item.asset_id}`}
                  </strong>
                  <p>
                    {item.type} · {item.technician || "Unassigned"} ·{" "}
                    {item.scheduled_at
                      ? new Date(item.scheduled_at).toLocaleDateString()
                      : "No date set"}
                  </p>
                </div>
                <div className="item-actions">
                  <span
                    className={`status ${item.status === "completed" ? "success" : item.status === "failed" ? "danger" : "warning"}`}
                  >
                    {item.status}
                  </span>
                  {item.status !== "completed" && (
                    <button
                      className="small-button"
                      onClick={() => handleMarkComplete(item.id)}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </ModulePage>
  );
}

function DamagePage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: "",
    incident_type: "damaged",
    severity: "moderate",
    description: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.fetchDamageReports();
      setReports(response?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (file) => {
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        asset_id: parseInt(formData.asset_id),
        incident_type: formData.incident_type,
        severity: formData.severity,
        description: formData.description,
      };

      if (photoFile) {
        const formDataWithPhoto = new FormData();
        Object.keys(submitData).forEach((key) => {
          formDataWithPhoto.append(key, submitData[key]);
        });
        formDataWithPhoto.append("photo", photoFile);
        await pcmsApi.createDamageReport(formDataWithPhoto);
      } else {
        await pcmsApi.createDamageReport(submitData);
      }

      setSuccess("Damage report submitted successfully");
      setFormData({
        asset_id: "",
        incident_type: "damaged",
        severity: "moderate",
        description: "",
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowForm(false);
      loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await pcmsApi.updateDamageReport(id, { status: newStatus });
      setSuccess("Status updated successfully");
      loadReports();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModulePage
      title="Damage Reports"
      subtitle="Employee photo reports, severity tracking, and PPMO resolution."
      primary="Report Damage"
      icon={AlertTriangle}
      onPrimary={() => setShowForm(!showForm)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Report Damage</h3>
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <label>Asset ID</label>
              <input
                type="number"
                value={formData.asset_id}
                onChange={(e) =>
                  setFormData({ ...formData, asset_id: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Photo</label>
              <div className="photo-upload">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="damage preview"
                    style={{ maxWidth: "200px" }}
                  />
                ) : (
                  <Camera size={48} />
                )}
              </div>
              <label className="primary-button upload-button">
                <Camera size={16} /> Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                  hidden
                />
              </label>
            </div>
            <div className="field-row">
              <label>Incident Type</label>
              <select
                value={formData.incident_type}
                onChange={(e) =>
                  setFormData({ ...formData, incident_type: e.target.value })
                }
                required
              >
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
                <option value="unserviceable">Unserviceable</option>
              </select>
            </div>
            <div className="field-row">
              <label>Severity</label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value })
                }
                required
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="field-row">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Submit Report
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-card">Loading damage reports...</div>
      ) : (
        <div className="card-grid">
          {reports.length === 0 ? (
            <p>No damage reports yet</p>
          ) : (
            reports.map((report) => (
              <div className="mini-card" key={report.id}>
                <div
                  className={`mini-icon tone-${report.severity === "critical" ? "red" : report.severity === "high" ? "orange" : "yellow"}`}
                >
                  <AlertTriangle size={20} />
                </div>
                <strong>Asset {report.asset_id}</strong>
                <p>
                  {report.incident_type} · Severity: {report.severity}
                </p>
                <p className="small-text">{report.description}</p>
                <div className="inline-actions small">
                  <span
                    className={`status ${["repaired", "disposed"].includes(report.status) ? "success" : report.status === "under_repair" ? "warning" : "info"}`}
                  >
                    {report.status}
                  </span>
                  {report.status === "submitted" && (
                    <button className="small-button" onClick={() => handleUpdateStatus(report.id, "in_review")}>Review</button>
                  )}
                  {report.status === "in_review" && (
                    <>
                      <button className="small-button" onClick={() => handleUpdateStatus(report.id, "under_repair")}>Start Repair</button>
                      <button className="small-button" onClick={() => handleUpdateStatus(report.id, "declared_lost")}>Declare Lost</button>
                      <button className="small-button" onClick={() => handleUpdateStatus(report.id, "declared_unserviceable")}>Unserviceable</button>
                    </>
                  )}
                  {report.status === "under_repair" && (
                    <button className="small-button success" onClick={() => handleUpdateStatus(report.id, "repaired")}>Mark Repaired</button>
                  )}
                  {report.status === "declared_unserviceable" && (
                    <button className="small-button danger-action" onClick={() => handleUpdateStatus(report.id, "disposed")}>Record Disposal</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </ModulePage>
  );
}

function SuppliesPage({ currentUser }) {
  const canDeleteRecords = currentUser?.role === ROLES.SYSTEM_ADMIN;
  const [supplies, setSupplies] = useState([]);
  const [supplyRequests, setSupplyRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [movementSaving, setMovementSaving] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [releaseRequest, setReleaseRequest] = useState(null);
  const [releaseQuantity, setReleaseQuantity] = useState(0);
  const [releaseDepartmentId, setReleaseDepartmentId] = useState("");
  const [releaseSaving, setReleaseSaving] = useState(false);
  const [printingSupplyRequests, setPrintingSupplyRequests] = useState(false);
  const [requestFilters, setRequestFilters] = useState({
    search: "",
    status: "",
    department_id: "",
  });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [addDepartmentId, setAddDepartmentId] = useState("");
  const [movementDepartmentId, setMovementDepartmentId] = useState("");
  const [generatedSupplySku, setGeneratedSupplySku] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "pieces",
    category: "",
    quantity: 0,
    minimum_quantity: 0,
    supplier_id: "",
    unit_price: 0,
    description: "",
  });
  const [movementData, setMovementData] = useState({
    supply_id: "",
    movement_type: "in",
    quantity: 0,
    notes: "",
    reference_no: "",
    supplier_source: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [supplyQuery, setSupplyQuery] = useState("");
  const [showSupplySuggestions, setShowSupplySuggestions] = useState(false);

  // NEW: edit/delete state
  const [editingSupply, setEditingSupply] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    unit: "pieces",
    category: "",
    department_id: "",
    minimum_stock: 0,
    unit_price: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingSupply, setDeletingSupply] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    // Inventory is deliberately empty until a department is selected.
    // This prevents a cross-department/general supplies table from appearing.
    setSupplies([]);
    setLoading(false);
    loadSupplyRequests({ ...requestFilters, department_id: "" });
    pcmsApi
      .departments()
      .then(setDepartments)
      .catch(() => {});
    loadAllocations("");
  }, []);

  useEffect(() => {
    if (!printingSupplyRequests) return undefined;
    const printFrame = window.requestAnimationFrame(() => window.print());
    const finishPrinting = () => setPrintingSupplyRequests(false);
    window.addEventListener("afterprint", finishPrinting);
    return () => {
      window.cancelAnimationFrame(printFrame);
      window.removeEventListener("afterprint", finishPrinting);
    };
  }, [printingSupplyRequests]);

  const loadSupplies = async (departmentId = selectedDepartmentId) => {
    if (!departmentId) {
      setSupplies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await pcmsApi.fetchSupplies({
        department_id: departmentId,
      });
      setSupplies(response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplyRequests = async (filters = requestFilters) => {
    try {
      setRequestsLoading(true);
      const requests = await pcmsApi.fetchSupplyRequestQueue({
        limit: 200,
        ...filters,
      });
      setSupplyRequests(requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadAllocations = async (
    departmentId = requestFilters.department_id,
  ) => {
    try {
      const movements = await pcmsApi.fetchStockMovements({
        limit: 200,
        department_id: departmentId,
        movement_type: "out",
      });
      setAllocations(movements || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSupply = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    setError(null);
    try {
      if (!addDepartmentId) throw new Error("Select a department first.");
      const response = await pcmsApi.createSupply({
        ...formData,
        department_id: addDepartmentId,
      });
      setGeneratedSupplySku(response?.sku || "");
      setSelectedDepartmentId(addDepartmentId);
      setRequestFilters((current) => ({
        ...current,
        department_id: addDepartmentId,
      }));
      setSuccess(
        response?.sku
          ? `Supply added successfully. SKU: ${response.sku}`
          : "Supply added successfully",
      );
      setFormData({
        name: "",
        unit: "pieces",
        category: "",
        quantity: 0,
        minimum_quantity: 0,
        supplier_id: "",
        unit_price: 0,
        description: "",
      });
      setShowForm(false);
      await Promise.all([
        loadSupplies(addDepartmentId),
        loadSupplyRequests({
          ...requestFilters,
          department_id: addDepartmentId,
        }),
        loadAllocations(addDepartmentId),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const openAddSupplyForm = () => {
    if (!selectedDepartmentId) {
      setError("Select a department first.");
      return;
    }
    setError(null);
    setAddDepartmentId(selectedDepartmentId);
    setGeneratedSupplySku("");
    setShowForm(true);
  };

  const openMovementForm = (type) => {
    if (!selectedDepartmentId) {
      setError("Select a department first.");
      return;
    }
    setMovementDepartmentId(selectedDepartmentId);
    if (type === "out") {
      const eligibleRequest = supplyRequests.find(
        (request) =>
          requestStatus(request) === "Approved" &&
          requestQuantities(request).remaining > 0,
      );
      if (eligibleRequest) {
        setReleaseQuantity(0);
        setReleaseDepartmentId(selectedDepartmentId);
        setReleaseRequest(eligibleRequest);
        return;
      }
    }
    setMovementData({
      supply_id: "",
      movement_type: type,
      quantity: 0,
      notes: "",
      reference_no: "",
      supplier_source: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setSupplyQuery("");
    setShowMovement(true);
  };

  const handleRecordMovement = async (e) => {
    e.preventDefault();
    setMovementSaving(true);
    setError(null);
    try {
      if (!movementDepartmentId) throw new Error("Select a department first.");
      const selectedSupply = supplies.find(
        (item) => String(item.id) === String(movementData.supply_id),
      );
      if (!selectedSupply || Number(movementData.quantity) <= 0)
        throw new Error(
          "Select a supply and enter a quantity greater than zero.",
        );
      if (movementData.movement_type === "out")
        throw new Error("Use an approved supply request to issue supplies.");
      await pcmsApi.recordStockMovement({
        ...movementData,
        department_id: movementDepartmentId,
        notes: [
          movementData.reference_no,
          movementData.supplier_source,
          movementData.notes,
        ]
          .filter(Boolean)
          .join(" · "),
      });
      setSuccess("Stock movement recorded successfully");
      setMovementData({
        supply_id: "",
        movement_type: "in",
        quantity: 0,
        notes: "",
      });
      setSupplyQuery("");
      setShowMovement(false);
      await Promise.all([
        loadSupplies(movementDepartmentId),
        loadSupplyRequests({
          ...requestFilters,
          department_id: movementDepartmentId,
        }),
        loadAllocations(movementDepartmentId),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setMovementSaving(false);
    }
  };

  const supplyLine = (request) =>
    (request?.line_items || []).find(
      (item) => (item.source_type || item.type) === "supply",
    );
  const requestSupply = (request) => {
    const line = supplyLine(request) || {};
    return (
      request?.supply ||
      supplies.find((item) => String(item.id) === String(line.source_id)) || {
        id: line.source_id,
        name: line.item || line.particular || "Supply",
        stock: 0,
        sku: line.source_ref || "N/A",
      }
    );
  };
  const requestQuantities = (request) => {
    const line = supplyLine(request) || {};
    const requested = Number(
      line.requested_qty ?? line.qty ?? line.quantity ?? 0,
    );
    const approved = Number(
      line.approved_qty ?? line.approved_quantity ?? requested,
    );
    const released = Number(line.released_qty ?? 0);
    return {
      requested,
      approved,
      released,
      remaining: Math.max(0, approved - released),
    };
  };
  const requestStatus = (request) => {
    const quantities = requestQuantities(request);
    if (request.queue_status === "cancelled" || request.status === "cancelled")
      return "Cancelled";
    if (request.queue_status === "rejected" || request.status === "rejected")
      return "Rejected";
    if (request.queue_status === "released") return "Released";
    if (request.queue_status === "partially_released")
      return "Partially Released";
    if (quantities.remaining === 0 && quantities.approved > 0)
      return "Released";
    if (quantities.released > 0) return "Partially Released";
    return request.queue_status === "approved" || request.status === "approved"
      ? "Approved"
      : "Pending";
  };
  const visibleSupplies = selectedDepartmentId
    ? supplies.filter(
        (supply) =>
          String(supply.department_id) === String(selectedDepartmentId),
      )
    : [];
  const handleReleaseRequest = async (event) => {
    event.preventDefault();
    const quantities = requestQuantities(releaseRequest);
    const supply = requestSupply(releaseRequest);
    const quantity = Number(releaseQuantity);
    if (
      !releaseDepartmentId ||
      String(releaseDepartmentId) !== String(releaseRequest.department_id)
    ) {
      setError("Select the request department before releasing supplies.");
      return;
    }
    if (
      quantity <= 0 ||
      quantity > quantities.remaining ||
      quantity > Number(supply.stock || 0)
    ) {
      setError(
        "Release quantity must be greater than zero and within both available stock and approved remaining quantity.",
      );
      return;
    }
    setReleaseSaving(true);
    setError(null);
    try {
      await pcmsApi.releaseSupplyRequest(
        releaseRequest.request_id || releaseRequest.id,
        { supply_id: supply.id, quantity },
      );
      setSuccess("Supply release recorded successfully.");
      setReleaseRequest(null);
      await Promise.all([
        loadSupplies(selectedDepartmentId),
        loadSupplyRequests({
          ...requestFilters,
          department_id: selectedDepartmentId,
        }),
        loadAllocations(selectedDepartmentId),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setReleaseSaving(false);
    }
  };

  const handleExport = () => {
    if (!selectedDepartmentId) {
      setError("Select a department before exporting its inventory.");
      return;
    }

    exportRowsToCsv("supplies-inventory.csv", visibleSupplies, [
      { label: "Supply", value: (item) => item.name },
      { label: "Category", value: (item) => item.category },
      { label: "SKU", value: (item) => item.sku },
      {
        label: "Unit Price",
        value: (item) => (item.unit_price != null ? item.unit_price : 0),
      },
      { label: "Stock", value: (item) => item.stock },
      { label: "Minimum", value: (item) => item.minimum_stock },
      {
        label: "Status",
        value: (item) =>
          item.stock <= item.minimum_stock ? "Low Stock" : "Healthy",
      },
    ]);
  };

  const handlePrintSupplyRequests = () => {
    setPrintingSupplyRequests(true);
  };

  const handleNotificationClick = async (item) => {
    if (item && !item.read && item.source && item.id) {
      try {
        await pcmsApi.markNotificationRead(item.source, item.id);
        setItems((current) =>
          current.map((notice) =>
            notice.id === item.id && notice.source === item.source
              ? { ...notice, read: true }
              : notice,
          ),
        );
      } catch {
        // keep navigation available even if read-state update fails
      }
    }

    if (item?.anomaly_id || item?.url?.includes("anomaly=")) {
      const anomalyId =
        item.anomaly_id ||
        new URL(item.url, window.location.origin).searchParams.get("anomaly");
      window.history.pushState({}, "", `/?anomaly=${anomalyId}`);
      onNavigate?.("monitoring");
    }
  };

  // NEW: edit/delete handlers
  const openEditDialog = (item) => {
    setError(null);
    setSuccess(null);
    setEditingSupply(item);
    setEditFormData({
      name: item.name || "",
      sku: item.sku || "",
      unit: item.unit || "pieces",
      category: item.category || "",
      department_id: item.department_id || "",
      minimum_stock: item.minimum_stock || 0,
      unit_price: item.unit_price ?? 0,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setError(null);
    try {
      await pcmsApi.updateSupply(editingSupply.id, editFormData);
      setSuccess("Supply updated successfully");
      setEditingSupply(null);
      loadSupplies();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteSaving(true);
    setError(null);
    try {
      await pcmsApi.deleteSupply(deletingSupply.id);
      setSuccess("Supply deleted successfully");
      setDeletingSupply(null);
      loadSupplies();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteSaving(false);
    }
  };

  return (
    <ModulePage
      title="Supplies Inventory"
      subtitle="Consumables, stock-in, stock-out, minimum stock alerts, and issuance."
      icon={Archive}
      actions={
        <>
          <select
            aria-label="Inventory department"
            value={selectedDepartmentId}
            onChange={(event) => {
              const departmentId = event.target.value;
              const filters = {
                ...requestFilters,
                department_id: departmentId,
              };
              setSelectedDepartmentId(departmentId);
              setRequestFilters(filters);
              loadSupplies(departmentId);
              loadSupplyRequests(filters);
              loadAllocations(departmentId);
            }}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              showForm ? setShowForm(false) : openAddSupplyForm()
            }
          >
            <Package size={16} /> Add Supply
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => openMovementForm("in")}
          >
            <Archive size={16} /> Stock In
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => openMovementForm("out")}
          >
            <PackageOpen size={16} /> Stock Out
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={handleExport}
          >
            <Download size={16} /> Export
          </button>
        </>
      }
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showMovement && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card supply-modal-card">
            <div className="modal-header">
              <h3>
                {movementData.movement_type === "in"
                  ? "Stock In Supplies"
                  : "Inventory Adjustment"}
              </h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowMovement(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordMovement}>
              <div className="field-row">
                <label>Department</label>
                <select
                  value={movementDepartmentId}
                  onChange={(e) => {
                    const departmentId = e.target.value;
                    setMovementDepartmentId(departmentId);
                    setSelectedDepartmentId(departmentId);
                    loadSupplies(departmentId);
                  }}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-row">
                <label>Supply</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={supplyQuery}
                    onChange={(e) => {
                      setSupplyQuery(e.target.value);
                      setShowSupplySuggestions(true);
                      setMovementData({ ...movementData, supply_id: "" });
                    }}
                    onFocus={() => setShowSupplySuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowSupplySuggestions(false), 150)
                    }
                    placeholder="Type to search supplies..."
                    required
                  />
                  {showSupplySuggestions && (
                    <ul
                      className="suggestions-list"
                      style={{
                        position: "absolute",
                        zIndex: 9999,
                        left: 0,
                        top: "calc(100% + 8px)",
                        width: "100%",
                        maxWidth: 560,
                        maxHeight: "220px",
                        overflow: "auto",
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 8,
                        padding: 0,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                        listStyle: "none",
                        pointerEvents: "none",
                      }}
                    >
                      {supplies
                        .filter((s) => {
                          const q = supplyQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (s.name || "").toLowerCase().includes(q) ||
                            (s.sku || "").toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 10)
                        .map((s) => (
                          <li
                            key={s.id}
                            style={{
                              padding: "10px 14px",
                              cursor: "pointer",
                              borderBottom: "1px solid rgba(0,0,0,0.04)",
                              pointerEvents: "auto",
                            }}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              setMovementData({
                                ...movementData,
                                supply_id: s.id,
                              });
                              setSupplyQuery(`${s.name} · ${s.sku}`);
                              setShowSupplySuggestions(false);
                            }}
                          >
                            <strong style={{ display: "block" }}>
                              {s.name}
                            </strong>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {s.sku} · Stock: {s.stock}
                            </div>
                          </li>
                        ))}
                      {supplies.filter((s) => {
                        const q = supplyQuery.trim().toLowerCase();
                        if (!q) return false;
                        return (
                          (s.name || "").toLowerCase().includes(q) ||
                          (s.sku || "").toLowerCase().includes(q)
                        );
                      }).length === 0 &&
                        supplyQuery.trim() !== "" && (
                          <li
                            style={{
                              padding: "10px 14px",
                              color: "#666",
                              pointerEvents: "auto",
                            }}
                          >
                            No supplies found.
                          </li>
                        )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="field-row">
                <label>Movement Type</label>
                <select
                  value={movementData.movement_type}
                  onChange={(e) =>
                    setMovementData({
                      ...movementData,
                      movement_type: e.target.value,
                    })
                  }
                  required
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>
              <div className="field-row">
                {movementData.movement_type === "out" && (
                  <div className="form-message error">
                    No approved supply request is available for this supply.
                    Stock Out should only be used for authorized inventory
                    adjustments.
                  </div>
                )}
                {movementData.movement_type === "in" &&
                  movementData.supply_id && (
                    <p className="supply-modal-summary">
                      Current Stock:{" "}
                      <strong>
                        {supplies.find(
                          (item) =>
                            String(item.id) === String(movementData.supply_id),
                        )?.stock || 0}
                      </strong>{" "}
                      &nbsp; New Stock:{" "}
                      <strong>
                        {Number(
                          supplies.find(
                            (item) =>
                              String(item.id) ===
                              String(movementData.supply_id),
                          )?.stock || 0,
                        ) + Number(movementData.quantity || 0)}
                      </strong>
                    </p>
                  )}
                <label>
                  Quantity per {supplies.find(
                    (item) =>
                      String(item.id) === String(movementData.supply_id),
                  )?.unit || "piece"}
                </label>
                <input
                  type="number"
                  value={movementData.quantity}
                  onChange={(e) =>
                    setMovementData({
                      ...movementData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="field-row">
                <label>Notes</label>
                <textarea
                  value={movementData.notes}
                  onChange={(e) =>
                    setMovementData({ ...movementData, notes: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="inline-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={movementSaving}
                >
                  {movementSaving
                    ? "Processing..."
                    : movementData.movement_type === "in"
                      ? "Confirm Stock In"
                      : "Confirm Adjustment"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowMovement(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card supply-modal-card">
            <div className="modal-header">
              <h3>Add New Supply</h3>
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
              <form onSubmit={handleAddSupply}>
                <div className="field-row">
                  <label>Department</label>
                  <select
                    value={addDepartmentId}
                    onChange={(e) => {
                      const departmentId = e.target.value;
                      setAddDepartmentId(departmentId);
                      setSelectedDepartmentId(departmentId);
                    }}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-row">
                  <label>Supply Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field-row">
                  <label>SKU</label>
                  <input
                    value={generatedSupplySku || "Generated automatically"}
                    readOnly
                    placeholder="Generated automatically"
                  />
                </div>
                <div className="field-row">
                  <label>Quantity Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="packs">Packs</option>
                    <option value="boxes">Boxes</option>
                    <option value="bundles">Bundles</option>
                    <option value="reams">Reams</option>
                    <option value="bottles">Bottles</option>
                    <option value="rolls">Rolls</option>
                    <option value="sets">Sets</option>
                  </select>
                </div>
                <div className="field-row">
                  <label>Category</label>
                  <input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div className="field-row">
                  <label>Initial Quantity ({formData.unit || "pieces"})</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    min="0"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="field-row">
                  <label>Minimum Quantity ({formData.unit || "pieces"})</label>
                  <input
                    type="number"
                    value={formData.minimum_quantity}
                    min="0"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimum_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="field-row">
                  <label>Unit Price (PHP)</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    min="0"
                    step="0.01"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
                <div className="field-row">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="inline-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={addSaving}
                  >
                    {addSaving ? "Adding Supply..." : "Add Supply"}
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setGeneratedSupplySku("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Supply</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>Stock</th>
              <th>Minimum</th>
              <th>Status</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr
                  className="skeleton-row"
                  key={`supply-skeleton-${index}`}
                  aria-hidden="true"
                >
                  <td>
                    <span className="skeleton-line supply-name-skeleton" />
                    <span className="skeleton-line supply-category-skeleton" />
                  </td>
                  <td>
                    <span className="skeleton-line" />
                  </td>
                  <td>
                    <span className="skeleton-line supply-price-skeleton" />
                  </td>
                  <td>
                    <span className="skeleton-line supply-number-skeleton" />
                  </td>
                  <td>
                    <span className="skeleton-line supply-number-skeleton" />
                  </td>
                  <td>
                    <span className="skeleton-pill" />
                  </td>
                  <td className="actions-column">
                    <span className="skeleton-actions" />
                  </td>
                </tr>
              ))
            ) : !selectedDepartmentId ? (
              <tr>
                <td colSpan="7">Select a department to view its inventory.</td>
              </tr>
            ) : visibleSupplies.length === 0 ? (
              <tr>
                <td colSpan="7">No supplies added yet for this department.</td>
              </tr>
            ) : (
              visibleSupplies.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </td>
                  <td>{item.sku}</td>
                  <td>{formatCurrency(Number(item.unit_price || 0))}</td>
                  <td>{item.stock}</td>
                  <td>{item.minimum_stock}</td>
                  <td>
                    <span
                      className={`status ${item.stock <= item.minimum_stock ? "danger" : "success"}`}
                    >
                      {item.stock <= item.minimum_stock
                        ? "Low Stock"
                        : "Healthy"}
                    </span>
                  </td>
                  <td className="actions-column">
                    <div className="inline-actions small">
                      <button
                        className="icon-button"
                        type="button"
                        title="Edit supply"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      {canDeleteRecords && <button
                        className="icon-button danger-action"
                        type="button"
                        title="Delete supply"
                        onClick={() => {
                          setError(null);
                          setSuccess(null);
                          setDeletingSupply(item);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="supply-requests-section">
        <div className="supply-section-heading">
          <div>
            <h3>Supply Requests</h3>
            <p>Approved requester supplies ready for controlled issuance.</p>
          </div>
          <div className="supply-request-summary">
            {["Pending", "Approved", "Partially Released", "Released"].map(
              (label) => (
                <span key={label}>
                  <strong>
                    {
                      supplyRequests.filter(
                        (request) => requestStatus(request) === label,
                      ).length
                    }
                  </strong>
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="supply-request-filters">
          <input
            placeholder="Search request or requester..."
            value={requestFilters.search}
            onChange={(event) => {
              const filters = { ...requestFilters, search: event.target.value };
              setRequestFilters(filters);
              loadSupplyRequests(filters);
            }}
          />
          <select
            value={requestFilters.status}
            onChange={(event) => {
              const filters = { ...requestFilters, status: event.target.value };
              setRequestFilters(filters);
              loadSupplyRequests(filters);
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="partially_released">Partially Released</option>
            <option value="released">Released</option>
          </select>
          <select
            value={requestFilters.department_id}
            onChange={(event) => {
              const filters = {
                ...requestFilters,
                department_id: event.target.value,
              };
              setSelectedDepartmentId(event.target.value);
              setRequestFilters(filters);
              loadSupplies(event.target.value);
              loadSupplyRequests(filters);
              loadAllocations(filters.department_id);
            }}
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-card supply-request-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Requester / Employee</th>
                <th>Department</th>
                <th>Supply</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Released</th>
                <th>Remaining</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requestsLoading ? (
                Array.from({ length: 4 }, (_, index) => (
                  <tr
                    className="skeleton-row"
                    key={`request-skeleton-${index}`}
                    aria-hidden="true"
                  >
                    <td>
                      <span className="skeleton-line request-number-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-person-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-department-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-supply-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-number-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-number-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-number-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-number-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-line request-date-skeleton" />
                    </td>
                    <td>
                      <span className="skeleton-pill" />
                    </td>
                    <td>
                      <span className="skeleton-actions" />
                    </td>
                  </tr>
                ))
              ) : supplyRequests.length === 0 ? (
                <tr>
                  <td colSpan="11">No supply requests found.</td>
                </tr>
              ) : (
                supplyRequests.map((request) => {
                  const quantities = requestQuantities(request);
                  const supply = requestSupply(request);
                  const status = requestStatus(request);
                  const requester =
                    request.requester?.full_name ||
                    request.requested_by_name ||
                    request.requester?.email ||
                    "Requester";
                  return (
                    <tr key={request.id}>
                      <td>
                        <strong>
                          {request.request_number || `Request #${request.id}`}
                        </strong>
                      </td>
                      <td>{requester}</td>
                      <td>
                        {request.department?.name ||
                          request.department_name ||
                          "N/A"}
                      </td>
                      <td>{supply.name}</td>
                      <td>{quantities.requested}</td>
                      <td>{quantities.approved}</td>
                      <td>{quantities.released}</td>
                      <td>{quantities.remaining}</td>
                      <td>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>
                        <span
                          className={`status ${status.toLowerCase().replaceAll(" ", "-")}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions small">
                          <button
                            className="small-button"
                            type="button"
                            onClick={() => setRequestDetails(request)}
                          >
                            <Eye size={14} /> View
                          </button>
                          {["Approved", "Partially Released"].includes(
                            status,
                          ) &&
                            quantities.remaining > 0 && (
                              <button
                                className="small-button primary"
                                type="button"
                                onClick={() => {
                                  setReleaseQuantity(0);
                                  setReleaseRequest(request);
                                }}
                              >
                                <PackageOpen size={14} /> Process
                              </button>
                            )}
                          <button
                            className="icon-button"
                            type="button"
                            title="Print supply requests report"
                            onClick={handlePrintSupplyRequests}
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="supply-requests-section">
        <div className="supply-section-heading">
          <div>
            <h3>Department Allocation History</h3>
            <p>Supplies issued to departments through approved requests.</p>
          </div>
        </div>
        <div className="table-card supply-request-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Department</th>
                <th>Supply</th>
                <th>Quantity Issued</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    No allocations found for the selected department.
                  </td>
                </tr>
              ) : (
                allocations.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      {movement.created_at
                        ? new Date(movement.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>{movement.department?.name || "N/A"}</td>
                    <td>{movement.supply?.name || "Supply"}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.notes || "Approved supply request"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="supply-request-print-report" aria-hidden="true">
        <header className="supply-print-header">
          <div>
            <p>Property Custodian Management System</p>
            <h1>Supply Requests Report</h1>
            <span>
              Approved requester supplies ready for controlled issuance.
            </span>
          </div>
          <time>Generated: {new Date().toLocaleString()}</time>
        </header>
        <div className="supply-print-meta">
          <span>
            Search: <strong>{requestFilters.search || "All requests"}</strong>
          </span>
          <span>
            Status: <strong>{requestFilters.status || "All statuses"}</strong>
          </span>
        </div>
        <div className="supply-print-summary">
          {["Pending", "Approved", "Partially Released", "Released"].map(
            (label) => (
              <span key={label}>
                <strong>
                  {
                    supplyRequests.filter(
                      (request) => requestStatus(request) === label,
                    ).length
                  }
                </strong>
                {label}
              </span>
            ),
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>Request No.</th>
              <th>Requester / Employee</th>
              <th>Department</th>
              <th>Supply</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Released</th>
              <th>Remaining</th>
              <th>Request Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {supplyRequests.map((request) => {
              const quantities = requestQuantities(request);
              const supply = requestSupply(request);
              const status = requestStatus(request);
              return (
                <tr key={`print-${request.id}`}>
                  <td>{request.request_number || `Request #${request.id}`}</td>
                  <td>
                    {request.requester?.full_name ||
                      request.requested_by_name ||
                      request.requester?.email ||
                      "Requester"}
                  </td>
                  <td>
                    {request.department?.name ||
                      request.department_name ||
                      "N/A"}
                  </td>
                  <td>{supply.name}</td>
                  <td>{quantities.requested}</td>
                  <td>{quantities.approved}</td>
                  <td>{quantities.released}</td>
                  <td>{quantities.remaining}</td>
                  <td>
                    {request.created_at
                      ? new Date(request.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {releaseRequest &&
        (() => {
          const quantities = requestQuantities(releaseRequest);
          const supply = requestSupply(releaseRequest);
          const after =
            Number(supply.stock || 0) - Number(releaseQuantity || 0);
          return (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal-card supply-modal-card">
                <div className="modal-header">
                  <h3>Issue Supplies</h3>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setReleaseRequest(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <form
                  className="supply-release-form"
                  onSubmit={handleReleaseRequest}
                >
                  <label>
                    Department
                    <select
                      value={releaseDepartmentId}
                      onChange={(event) =>
                        setReleaseDepartmentId(event.target.value)
                      }
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="supply-release-grid">
                    <div>
                      <span>Request No.</span>
                      <strong>
                        {releaseRequest.request_number ||
                          `Request #${releaseRequest.id}`}
                      </strong>
                    </div>
                    <div>
                      <span>Requester</span>
                      <strong>
                        {releaseRequest.requester?.full_name ||
                          releaseRequest.requested_by_name ||
                          "Requester"}
                      </strong>
                    </div>
                    <div>
                      <span>Department</span>
                      <strong>
                        {releaseRequest.department?.name ||
                          releaseRequest.department_name ||
                          "N/A"}
                      </strong>
                    </div>
                    <div>
                      <span>Supply</span>
                      <strong>{supply.name}</strong>
                    </div>
                    <div>
                      <span>Available Stock</span>
                      <strong>{supply.stock || 0}</strong>
                    </div>
                    <div>
                      <span>Approved Quantity</span>
                      <strong>{quantities.approved}</strong>
                    </div>
                    <div>
                      <span>Already Released</span>
                      <strong>{quantities.released}</strong>
                    </div>
                    <div>
                      <span>Remaining Quantity</span>
                      <strong>{quantities.remaining}</strong>
                    </div>
                  </div>
                  <label>
                    Quantity to Release ({supply.unit || "pieces"})
                    <input
                      type="number"
                      min="1"
                      max={Math.min(
                        quantities.remaining,
                        Number(supply.stock || 0),
                      )}
                      value={releaseQuantity}
                      onChange={(event) =>
                        setReleaseQuantity(event.target.value)
                      }
                      required
                    />
                  </label>
                  <div className="supply-release-preview">
                    <span>
                      Available Stock: <strong>{supply.stock || 0}</strong>
                    </span>
                    <span>
                      Release Qty: <strong>{releaseQuantity || 0}</strong>
                    </span>
                    <span>
                      Stock After Release: <strong>{after}</strong>
                    </span>
                    <span>
                      Remaining Request Qty:{" "}
                      <strong>
                        {Math.max(
                          0,
                          quantities.remaining - Number(releaseQuantity || 0),
                        )}
                      </strong>
                    </span>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setReleaseRequest(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={releaseSaving}
                    >
                      {releaseSaving ? "Processing..." : "Confirm Release"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      {requestDetails &&
        (() => {
          const quantities = requestQuantities(requestDetails);
          const supply = requestSupply(requestDetails);
          return (
            <div className="modal-overlay" role="dialog" aria-modal="true">
              <div className="modal-card supply-modal-card">
                <div className="modal-header">
                  <h3>Supply Request Details</h3>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setRequestDetails(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="supply-details-body">
                  <h4>Request Information</h4>
                  <div className="supply-details-grid">
                    <span>
                      Request No.
                      <strong>
                        {requestDetails.request_number ||
                          `Request #${requestDetails.id}`}
                      </strong>
                    </span>
                    <span>
                      Requester
                      <strong>
                        {requestDetails.requester?.full_name ||
                          requestDetails.requested_by_name ||
                          "Requester"}
                      </strong>
                    </span>
                    <span>
                      Department
                      <strong>
                        {requestDetails.department?.name ||
                          requestDetails.department_name ||
                          "N/A"}
                      </strong>
                    </span>
                    <span>
                      Request Date
                      <strong>
                        {requestDetails.created_at
                          ? new Date(
                              requestDetails.created_at,
                            ).toLocaleDateString()
                          : "N/A"}
                      </strong>
                    </span>
                    <span>
                      Purpose<strong>{requestDetails.purpose || "N/A"}</strong>
                    </span>
                    <span>
                      Current Status
                      <strong>{requestStatus(requestDetails)}</strong>
                    </span>
                  </div>
                  <h4>Supply Details</h4>
                  <div className="supply-details-grid">
                    <span>
                      Supply<strong>{supply.name}</strong>
                    </span>
                    <span>
                      SKU<strong>{supply.sku || "N/A"}</strong>
                    </span>
                    <span>
                      Requested Qty<strong>{quantities.requested}</strong>
                    </span>
                    <span>
                      Approved Qty<strong>{quantities.approved}</strong>
                    </span>
                    <span>
                      Released Qty<strong>{quantities.released}</strong>
                    </span>
                    <span>
                      Remaining Qty<strong>{quantities.remaining}</strong>
                    </span>
                  </div>
                  <h4>Workflow Timeline</h4>
                  <div className="supply-timeline">
                    {(requestDetails.timeline || [])
                      .filter((entry) =>
                        [
                          "Submitted",
                          "Approved",
                          "Partial Release",
                          "Released",
                          "Department Head Review",
                          "President Review",
                          "Property Custodian Review",
                        ].includes(entry.stage),
                      )
                      .map((entry, index) => (
                        <div key={`${entry.stage}-${index}`}>
                          <span>{entry.stage}</span>
                          <small>
                            {entry.timestamp
                              ? new Date(entry.timestamp).toLocaleString()
                              : "Pending"}
                            {entry.performed_by_name
                              ? ` · ${entry.performed_by_name}`
                              : ""}
                          </small>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setRequestDetails(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {editingSupply && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Supply</h3>
              <button
                className="icon-button"
                onClick={() => setEditingSupply(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <label>
                  Supply Name
                  <input
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Department
                  <select
                    value={editFormData.department_id}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        department_id: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity Unit
                  <select
                    value={editFormData.unit}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, unit: e.target.value })
                    }
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="packs">Packs</option>
                    <option value="boxes">Boxes</option>
                    <option value="bundles">Bundles</option>
                    <option value="reams">Reams</option>
                    <option value="bottles">Bottles</option>
                    <option value="rolls">Rolls</option>
                    <option value="sets">Sets</option>
                  </select>
                </label>
                <label>
                  SKU
                  <input
                    value={editFormData.sku}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, sku: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Category
                  <input
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Minimum Stock
                  <input
                    type="number"
                    min="0"
                    value={editFormData.minimum_stock}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        minimum_stock: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Unit Price
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.unit_price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        unit_price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingSupply(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingSupply && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card confirm-dialog">
            <div className="modal-header">
              <h3>Delete Supply</h3>
              <button
                className="icon-button"
                onClick={() => setDeletingSupply(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="confirm-dialog-body">
              <p>Are you sure you want to delete this supply item?</p>
              <div className="delete-summary">
                <span>Supply Name</span>
                <strong>{deletingSupply.name}</strong>
                <span>SKU</span>
                <strong>{deletingSupply.sku}</strong>
              </div>
              <p>This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDeletingSupply(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleteSaving}
                >
                  {deleteSaving ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function PurchasePage({ currentUser }) {
  return <PurchaseWorkflowMonitor currentUser={currentUser} />;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    items: "",
    estimated_cost: 0,
    justification: "",
    current_stage: "employee",
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.fetchPurchaseRequests();
      setRequests(response?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await pcmsApi.createPurchaseRequest(formData);
      setSuccess("Purchase request created successfully");
      setFormData({
        title: "",
        description: "",
        items: "",
        estimated_cost: 0,
        justification: "",
        current_stage: "employee",
      });
      setShowForm(false);
      loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdvanceStage = async (id) => {
    try {
      await pcmsApi.advancePurchaseRequest(id);
      setSuccess("Request advanced to next stage");
      loadRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const stages = [
    "employee",
    "department_head",
    "recommending_approver",
    "president",
    "property_custodian",
    "released",
  ];
  const stageLabels = [
    "Submitted",
    "Department Head",
    "Recommending Approver",
    "President / CEO",
    "Processing / Release",
    "Released",
  ];

  return (
    <ModulePage
      title="Purchase Workflow"
      subtitle="Complete request-to-receiving workflow for property and supplies."
      primary="New Purchase Request"
      icon={ShoppingCart}
      onPrimary={() => setShowForm(!showForm)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Create Purchase Request</h3>
          <form onSubmit={handleCreateRequest}>
            <div className="field-row">
              <label>Title</label>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                required
              />
            </div>
            <div className="field-row">
              <label>Items</label>
              <textarea
                value={formData.items}
                onChange={(e) =>
                  setFormData({ ...formData, items: e.target.value })
                }
                rows={2}
                placeholder="List items, one per line"
                required
              />
            </div>
            <div className="field-row">
              <label>Estimated Cost</label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_cost: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Justification</label>
              <textarea
                value={formData.justification}
                onChange={(e) =>
                  setFormData({ ...formData, justification: e.target.value })
                }
                rows={2}
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Create Request
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stage-strip">
        {stageLabels.map((stage, index) => (
          <div className="stage" key={stage}>
            <span>{index + 1}</span>
            {stage}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="loading-card">Loading purchase requests...</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Title</th>
                <th>Amount</th>
                <th>Current Stage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6">No purchase requests yet</td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>PR-{item.id}</strong>
                    </td>
                    <td>{item.title}</td>
                    <td>{formatCurrency(item.estimated_cost)}</td>
                    <td>{stageLabels[stages.indexOf(item.current_stage)]}</td>
                    <td>
                      <span
                        className={`status ${item.current_stage === "released" ? "success" : "warning"}`}
                      >
                        {item.current_stage}
                      </span>
                    </td>
                    <td>
                      {item.current_stage !== "released" && (
                        <button
                          className="small-button"
                          onClick={() => handleAdvanceStage(item.id)}
                        >
                          Advance
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </ModulePage>
  );
}

function GatePassPage() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    asset_id: "",
    purpose: "",
    receiver_name: "",
    valid_until: "",
    status: "pending",
  });
  const [scanId, setScanId] = useState("");

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.fetchGatePasses();
      setPasses(response?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    try {
      await pcmsApi.createGatePass(formData);
      setSuccess("Gate pass created successfully");
      setFormData({
        asset_id: "",
        purpose: "",
        receiver_name: "",
        valid_until: "",
        status: "pending",
      });
      setShowForm(false);
      loadPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprovPass = async (id) => {
    try {
      await pcmsApi.approveGatePass(id);
      setSuccess("Gate pass approved");
      loadPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReturn = async (id) => {
    try {
      const response = await pcmsApi.returnGatePass(id);
      setSuccess("Asset marked as returned");
      loadPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    try {
      await pcmsApi.scanGatePass(scanId);
      setSuccess("Gate pass scanned successfully");
      setScanId("");
      setShowScanner(false);
      loadPasses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ModulePage
      title="Gate Pass"
      subtitle="Digital QR gate passes with approval, print, PDF download, and return tracking."
      primary="Generate Gate Pass"
      icon={QrCode}
      onPrimary={() => setShowForm(!showForm)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Generate Gate Pass</h3>
          <form onSubmit={handleCreatePass}>
            <div className="field-row">
              <label>Asset ID</label>
              <input
                type="number"
                value={formData.asset_id}
                onChange={(e) =>
                  setFormData({ ...formData, asset_id: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Purpose</label>
              <select
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({ ...formData, purpose: e.target.value })
                }
                required
              >
                <option value="">Select purpose</option>
                <option value="repair">Repair</option>
                <option value="maintenance">Maintenance</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field-row">
              <label>Receiver Name</label>
              <input
                value={formData.receiver_name}
                onChange={(e) =>
                  setFormData({ ...formData, receiver_name: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Valid Until</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) =>
                  setFormData({ ...formData, valid_until: e.target.value })
                }
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Create Pass
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showScanner && (
        <div className="panel form-panel">
          <h3>Scan Gate Pass</h3>
          <form onSubmit={handleScan}>
            <div className="field-row">
              <label>Gate Pass ID or QR Code</label>
              <input
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
                placeholder="GP-2026-XXXX"
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Scan
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowScanner(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-card">Loading gate passes...</div>
      ) : (
        <>
          <div className="inline-actions">
            <button
              className="secondary-button"
              onClick={() => setShowScanner(!showScanner)}
            >
              <QrCode size={16} /> Scan QR
            </button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Gate Pass ID</th>
                  <th>Asset ID</th>
                  <th>Purpose</th>
                  <th>Receiver</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {passes.length === 0 ? (
                  <tr>
                    <td colSpan="7">No gate passes yet</td>
                  </tr>
                ) : (
                  passes.map((pass) => (
                    <tr key={pass.id}>
                      <td>
                        <strong>GP-{pass.id}</strong>
                      </td>
                      <td>{pass.asset_id}</td>
                      <td>{pass.purpose}</td>
                      <td>{pass.receiver_name}</td>
                      <td>{new Date(pass.valid_until).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`status ${pass.status === "approved" ? "success" : pass.status === "returned" ? "info" : "warning"}`}
                        >
                          {pass.status}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions small">
                          {pass.status === "pending" && (
                            <button
                              className="small-button"
                              onClick={() => handleApprovPass(pass.id)}
                            >
                              Approve
                            </button>
                          )}
                          {pass.status === "approved" && (
                            <button
                              className="small-button success"
                              onClick={() => handleReturn(pass.id)}
                            >
                              Return
                            </button>
                          )}
                          <button
                            className="small-button"
                            onClick={() =>
                              window.open(
                                `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GP-${pass.id}`,
                                "_blank",
                              )
                            }
                          >
                            QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </ModulePage>
  );
}

function AuditPage({ currentUser }) {
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showMobileScan, setShowMobileScan] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [auditDetails, setAuditDetails] = useState(null);
  const [editAudit, setEditAudit] = useState(null);
  const [deleteAudit, setDeleteAudit] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    scheduled_date: "",
    auditor_name: "",
    status: "pending",
  });
  const [scanData, setScanData] = useState({
    audit_id: "",
    asset_id: "",
    found_department_id: "",
    result: "verified",
  });
  const [assetsList, setAssetsList] = useState([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);

  useEffect(() => {
    loadAudits();
    pcmsApi
      .departments()
      .then(setDepartments)
      .catch(() => {});
    pcmsApi
      .assets({ limit: 200 })
      .then(setAssetsList)
      .catch(() => {});
  }, []);

  const loadAudits = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.fetchAudits();
      setAudits(response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    try {
      await pcmsApi.createAudit(formData);
      setSuccess("Audit scheduled successfully");
      setFormData({
        name: "",
        department_id: "",
        scheduled_date: "",
        auditor_name: "",
        status: "pending",
      });
      setShowForm(false);
      loadAudits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScanAsset = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...scanData,
        audit_id: parseInt(scanData.audit_id),
        asset_id: parseInt(scanData.asset_id),
        found_department_id: scanData.found_department_id
          ? parseInt(scanData.found_department_id)
          : null,
      };
      await pcmsApi.scanAuditAsset(scanData.audit_id, payload);
      setSuccess("Asset scanned successfully");
      setScanData({
        audit_id: "",
        asset_id: "",
        found_department_id: "",
        result: "verified",
      });
      loadAudits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteAudit = async (id) => {
    try {
      await pcmsApi.completeAudit(id);
      setSuccess("Audit completed and summary generated");
      loadAudits();
    } catch (err) {
      setError(err.message);
    }
  };

  const canEditDelete = currentUser?.role === ROLES.SYSTEM_ADMIN;

  const handleViewAudit = async (audit) => {
    setError(null);
    try {
      setAuditDetails(await pcmsApi.fetchAudit(audit.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateAudit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await pcmsApi.updateAudit(editAudit.id, editAudit);
      setSuccess("Audit updated successfully");
      setEditAudit(null);
      await loadAudits();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAudit = async () => {
    if (!deleteAudit) return;
    setActionLoading(true);
    try {
      await pcmsApi.deleteAudit(deleteAudit.id);
      setSuccess("Audit deleted successfully");
      setDeleteAudit(null);
      await loadAudits();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const printAudit = (audit, details = {}) => {
    const printWindow = window.open("", "_blank", "width=900,height=760");
    if (!printWindow) return;
    const scans = details.audit?.audit_scans || audit.audit_scans || audit.auditScans || [];
    const summary = details.summary || {};
    const rows = scans.map((scan) => `<tr><td>${scan.asset?.property_number || scan.asset_id || "-"}</td><td>${scan.asset?.name || "-"}</td><td>${scan.found_department?.name || scan.foundDepartment?.name || scan.found_department_id || "-"}</td><td>${scan.result || "-"}</td></tr>`).join("");
    printWindow.document.write(`<!doctype html><html><head><title>${audit.audit_number || "Audit"}</title><style>body{font:14px Arial,sans-serif;color:#172033;margin:36px}h1{margin:0}p{margin:6px 0 20px;color:#64748b}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0}.meta b{display:block;color:#64748b;font-size:11px;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d8dee9;padding:8px;text-align:left}th{background:#f1f5f9;font-size:11px;text-transform:uppercase}</style></head><body><h1>Physical Audit</h1><p>${audit.audit_number || "-"}</p><div class="meta"><div><b>Area</b>${audit.area || "-"}</div><div><b>Department</b>${audit.department?.name || audit.department_name || audit.department_id || "-"}</div><div><b>Scheduled</b>${audit.scheduled_at ? new Date(audit.scheduled_at).toLocaleDateString() : "-"}</div><div><b>Status</b>${audit.status || "-"}</div><div><b>Verified</b>${summary.verified ?? scans.filter((scan) => scan.result === "verified").length}</div><div><b>Wrong Department</b>${summary.wrong_department ?? scans.filter((scan) => scan.result === "wrong_department").length}</div></div><table><thead><tr><th>Property No.</th><th>Asset</th><th>Found Department</th><th>Result</th></tr></thead><tbody>${rows || '<tr><td colspan="4">No scans recorded.</td></tr>'}</tbody></table><script>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <ModulePage
      title="Physical Audit"
      subtitle="Schedule audits, scan QR tags, verify OCR labels, and report missing assets."
      primary="Schedule Audit"
      icon={ClipboardCheck}
      onPrimary={() => setShowForm(!showForm)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {showForm && (
        <div className="panel form-panel">
          <h3>Schedule Audit</h3>
          <form onSubmit={handleCreateAudit}>
            <div className="field-row">
              <label>Audit Name</label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Department</label>
              <select
                value={formData.department_id}
                onChange={(e) =>
                  setFormData({ ...formData, department_id: e.target.value })
                }
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label>Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_date: e.target.value })
                }
                required
              />
            </div>
            <div className="field-row">
              <label>Auditor Name</label>
              <input
                value={formData.auditor_name}
                onChange={(e) =>
                  setFormData({ ...formData, auditor_name: e.target.value })
                }
                required
              />
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Schedule Audit
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showScan && selectedAudit && (
        <div className="panel form-panel">
          <h3>Scan Asset - {selectedAudit.area}</h3>
          <form onSubmit={handleScanAsset}>
            <div className="field-row">
              <label>Asset</label>
              <div style={{ position: "relative" }}>
                <input
                  value={assetQuery}
                  onChange={(e) => {
                    setAssetQuery(e.target.value);
                    setShowAssetSuggestions(true);
                    setScanData({ ...scanData, asset_id: "" });
                  }}
                  onFocus={() => setShowAssetSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowAssetSuggestions(false), 150)
                  }
                  placeholder="Type to search assets..."
                  required
                />
                {showAssetSuggestions && (
                  <ul
                    className="suggestions-list"
                    style={{
                      position: "absolute",
                      zIndex: 9999,
                      left: 0,
                      top: "calc(100% + 8px)",
                      width: "100%",
                      maxWidth: 560,
                      maxHeight: 220,
                      overflow: "auto",
                      background: "#fff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 8,
                      padding: 0,
                      boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                      listStyle: "none",
                    }}
                  >
                    {assetsList
                      .filter((a) => {
                        const q = assetQuery.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (a.name || "").toLowerCase().includes(q) ||
                          (a.property_number || "").toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 10)
                      .map((a) => (
                        <li
                          key={a.id}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            borderBottom: "1px solid rgba(0,0,0,0.04)",
                          }}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            setScanData({ ...scanData, asset_id: a.id });
                            setAssetQuery(
                              `${a.name} · ${a.property_number || a.asset_id}`,
                            );
                            setShowAssetSuggestions(false);
                          }}
                        >
                          <strong style={{ display: "block" }}>{a.name}</strong>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {a.property_number || a.asset_id}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="field-row">
              <label>Found Department</label>
              <select
                value={scanData.found_department_id}
                onChange={(e) =>
                  setScanData({
                    ...scanData,
                    found_department_id: e.target.value,
                  })
                }
                required
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label>Result</label>
              <select
                value={scanData.result}
                onChange={(e) =>
                  setScanData({ ...scanData, result: e.target.value })
                }
                required
              >
                <option value="verified">Verified</option>
                <option value="missing">Missing</option>
                <option value="wrong_department">Wrong Department</option>
              </select>
            </div>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                Record Scan
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowScan(false)}
              >
                Done Scanning
              </button>
            </div>
          </form>
        </div>
      )}

      {showMobileScan && selectedAudit && (
        <MobileAuditScanner
          audit={selectedAudit}
          departments={departments}
          onClose={() => {
            setShowMobileScan(false);
            loadAudits();
          }}
        />
      )}

      {loading ? (
        <div className="loading-card">Loading audits...</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Audit Area</th>
                <th>Audit No.</th>
                <th>Department</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan="6">No audits scheduled yet</td>
                </tr>
              ) : (
                audits.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.area}</strong>
                    </td>
                    <td>{item.audit_number}</td>
                    <td>
                      {departments.find((d) => d.id === item.department_id)
                        ?.name ||
                        (item.department_id
                          ? `Dept ${item.department_id}`
                          : "—")}
                    </td>
                    <td>
                      {item.scheduled_at
                        ? new Date(item.scheduled_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status ${item.status === "completed" ? "success" : "info"}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions small">
                        <button
                          className="icon-button"
                          type="button"
                          title="View audit verification"
                          aria-label={`View ${item.audit_number}`}
                          onClick={() => handleViewAudit(item)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          title="Print audit"
                          aria-label={`Print ${item.audit_number}`}
                          onClick={() => printAudit(item)}
                        >
                          <Printer size={14} />
                        </button>
                        {canEditDelete && item.status !== "completed" && (
                          <button
                            className="icon-button"
                            type="button"
                            title="Edit audit"
                            aria-label={`Edit ${item.audit_number}`}
                            onClick={() =>
                              setEditAudit({
                                ...item,
                                name: item.area || "",
                                scheduled_date: item.scheduled_at
                                  ? item.scheduled_at.slice(0, 10)
                                  : "",
                              })
                            }
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canEditDelete && item.status !== "completed" && (
                          <button
                            className="icon-button danger-action"
                            type="button"
                            title="Delete audit"
                            aria-label={`Delete ${item.audit_number}`}
                            onClick={() => setDeleteAudit(item)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {item.status !== "completed" && (
                          <>
                            <button
                              className="small-button"
                              onClick={() => {
                                setSelectedAudit(item);
                                setScanData({
                                  ...scanData,
                                  audit_id: item.id,
                                  found_department_id: item.department_id || "",
                                });
                                setShowScan(true);
                              }}
                            >
                              Manual Scan
                            </button>
                            <button
                              className="small-button"
                              onClick={() => {
                                setSelectedAudit(item);
                                setShowMobileScan(true);
                              }}
                            >
                              <Camera size={14} /> Scan with Camera
                            </button>
                            <button
                              className="small-button success"
                              onClick={() => handleCompleteAudit(item.id)}
                            >
                              Complete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {auditDetails && (
        <AuditVerificationModal
          details={auditDetails}
          onClose={() => setAuditDetails(null)}
          onPrint={() => printAudit(auditDetails.audit, auditDetails)}
        />
      )}

      {editAudit && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Audit</h3>
              <button className="icon-button" type="button" onClick={() => setEditAudit(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleUpdateAudit}>
              <label>Audit Name<input value={editAudit.name || editAudit.area || ""} onChange={(e) => setEditAudit({ ...editAudit, name: e.target.value })} required /></label>
              <label>Department<select value={editAudit.department_id || ""} onChange={(e) => setEditAudit({ ...editAudit, department_id: e.target.value })} required><option value="">Select department</option>{departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></label>
              <label>Scheduled Date<input type="date" value={editAudit.scheduled_date || ""} onChange={(e) => setEditAudit({ ...editAudit, scheduled_date: e.target.value })} required /></label>
              <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setEditAudit(null)} disabled={actionLoading}>Cancel</button><button className="primary-button" type="submit" disabled={actionLoading}>{actionLoading ? "Saving..." : "Save Changes"}</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteAudit && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card confirm-dialog">
            <div className="modal-header"><h3>Delete Audit?</h3><button className="icon-button" type="button" onClick={() => setDeleteAudit(null)} aria-label="Close"><X size={18} /></button></div>
            <p>Delete audit <strong>{deleteAudit.audit_number}</strong>? This action cannot be undone.</p>
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setDeleteAudit(null)} disabled={actionLoading}>Cancel</button><button className="danger-button" type="button" onClick={handleDeleteAudit} disabled={actionLoading}><Trash2 size={15} /> {actionLoading ? "Deleting..." : "Delete Audit"}</button></div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function AuditVerificationModal({ details, onClose, onPrint }) {
  const audit = details.audit || {};
  const scans = audit.audit_scans || audit.auditScans || [];
  const summary = details.summary || {};
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="audit-verification-title">
      <div className="modal-card wide-modal">
        <div className="modal-header"><h3 id="audit-verification-title">Audit Verification</h3><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="asset-detail-grid"><div><span className="asset-detail-label">Audit No.</span><strong>{audit.audit_number || "-"}</strong></div><div><span className="asset-detail-label">Area</span><strong>{audit.area || "-"}</strong></div><div><span className="asset-detail-label">Status</span><strong>{audit.status || "-"}</strong></div><div><span className="asset-detail-label">Verified</span><strong>{summary.verified ?? 0}</strong></div><div><span className="asset-detail-label">Wrong Department</span><strong>{summary.wrong_department ?? 0}</strong></div><div><span className="asset-detail-label">Missing</span><strong>{summary.missing ?? 0}</strong></div></div>
        <div className="table-card" style={{ marginTop: 16, maxHeight: 320, overflow: "auto" }}><table><thead><tr><th>Property No.</th><th>Asset</th><th>Found Department</th><th>Result</th></tr></thead><tbody>{scans.length === 0 ? <tr><td colSpan="4">No scans recorded.</td></tr> : scans.map((scan) => <tr key={scan.id}><td>{scan.asset?.property_number || scan.asset_id || "-"}</td><td>{scan.asset?.name || "-"}</td><td>{scan.found_department?.name || scan.foundDepartment?.name || scan.found_department_id || "-"}</td><td><span className={`status ${scan.result === "verified" ? "success" : "warning"}`}>{scan.result || "-"}</span></td></tr>)}</tbody></table></div>
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Close</button><button className="primary-button" type="button" onClick={onPrint}><Printer size={15} /> Print Verification</button></div>
      </div>
    </div>
  );
}

const QR_SCAN_COOLDOWN_MS = 3000;

function MobileAuditScanner({ audit, departments, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastCodeRef = useRef({ text: null, at: 0 });
  const scannedAssetIdsRef = useRef(new Set());

  const [cameraError, setCameraError] = useState(null);
  const [foundDepartmentId, setFoundDepartmentId] = useState(
    audit.department_id || "",
  );
  const [feed, setFeed] = useState([]);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const processCode = async (code) => {
    const trimmed = (code || "").trim();
    if (!trimmed || !foundDepartmentId) return;

    const now = Date.now();
    if (
      lastCodeRef.current.text === trimmed &&
      now - lastCodeRef.current.at < QR_SCAN_COOLDOWN_MS
    ) {
      return;
    }
    lastCodeRef.current = { text: trimmed, at: now };

    setBusy(true);
    setToast(null);
    try {
      const matches = await pcmsApi.assets({ search: trimmed, limit: 5 });
      const asset =
        matches.find(
          (a) =>
            (a.property_number || "").toLowerCase() === trimmed.toLowerCase(),
        ) || matches[0];

      if (!asset) {
        setToast({ type: "error", text: `No asset found for "${trimmed}".` });
        return;
      }

      if (scannedAssetIdsRef.current.has(asset.id)) {
        setToast({
          type: "info",
          text: `${asset.property_number} already scanned this session.`,
        });
        return;
      }

      const scan = await pcmsApi.scanAuditAsset(audit.id, {
        asset_id: asset.id,
        found_department_id: foundDepartmentId,
      });

      scannedAssetIdsRef.current.add(asset.id);
      const result = scan?.result || scan?.data?.result || "verified";
      setFeed((current) => [
        {
          id: `${asset.id}-${now}`,
          name: asset.name,
          property_number: asset.property_number,
          result,
        },
        ...current,
      ]);
      setToast({
        type: result === "verified" ? "success" : "warning",
        text: `${asset.property_number} · ${result.replace("_", " ")}`,
      });
    } catch (err) {
      setToast({ type: "error", text: err?.message || "Scan failed." });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch (err) {
        setCameraError(
          err?.message || "Camera unavailable. Use manual entry below.",
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          processCode(code.data);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundDepartmentId]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCode(manualCode);
    setManualCode("");
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Scan with Camera - {audit.area}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="field-row">
          <label>Found In Department</label>
          <select
            value={foundDepartmentId}
            onChange={(e) => setFoundDepartmentId(e.target.value)}
            required
          >
            <option value="">Select department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {!foundDepartmentId && (
          <div className="form-message error">
            Select the department before scanning.
          </div>
        )}

        {cameraError ? (
          <div className="form-message error">{cameraError}</div>
        ) : (
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 360,
              margin: "0 auto",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", borderRadius: 8 }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {toast && (
          <div
            className={`form-message ${toast.type === "error" ? "error" : "success"}`}
          >
            {toast.text}
          </div>
        )}

        <form
          onSubmit={handleManualSubmit}
          className="inline-actions"
          style={{ marginTop: 12 }}
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or type property number..."
            disabled={busy}
          />
          <button
            className="secondary-button"
            type="submit"
            disabled={busy || !foundDepartmentId}
          >
            Look Up
          </button>
        </form>

        <div
          className="table-card"
          style={{ marginTop: 16, maxHeight: 240, overflow: "auto" }}
        >
          <table>
            <thead>
              <tr>
                <th>Property No.</th>
                <th>Asset</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {feed.length === 0 ? (
                <tr>
                  <td colSpan="3">No scans yet this session.</td>
                </tr>
              ) : (
                feed.map((row) => (
                  <tr key={row.id}>
                    <td>{row.property_number}</td>
                    <td>{row.name}</td>
                    <td>
                      <span
                        className={`status ${row.result === "verified" ? "success" : "warning"}`}
                      >
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>
            Done Scanning ({feed.length} scanned)
          </button>
        </div>
      </div>
    </div>
  );
}

function OcrPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrHistory, setOcrHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [departmentsList, setDepartmentsList] = useState([]);
  const lastOcrImageKeyRef = useRef("");
  const ocrProcessingRef = useRef(false);
  const [formValues, setFormValues] = useState({
    property_number: "",
    serial_number: "",
    brand: "",
    model: "",
    name: "",
    description: "",
    department_id: "",
    location: "",
    purchase_date: "",
    purchase_cost: "",
    quantity: "1",
    warranty_until: "",
    condition: "good",
    status: "available",
  });

  useEffect(() => {
    pcmsApi
      .departments()
      .then(setDepartmentsList)
      .catch(() => {});
    pcmsApi
      .ocrHistory({ limit: 6 })
      .then(setOcrHistory)
      .catch(() => {});
  }, []);

  const imageKey = (file) =>
    file
      ? `${file.name || "capture"}-${file.size}-${file.lastModified || 0}`
      : "";

  const handleImageSelect = (file) => {
    if (!file) return;
    setError("");
    setSuccessMessage("");
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrResult(null);
    runOcrForImage(file);
  };

  const resolveDepartmentId = (departmentName) => {
    if (!departmentName) {
      return "";
    }

    const normalizedName = String(departmentName).trim().toLowerCase();
    const matchedDepartment = departmentsList.find(
      (department) =>
        String(department.name).trim().toLowerCase() === normalizedName,
    );

    return matchedDepartment ? String(matchedDepartment.id) : "";
  };

  const runOcrForImage = async (imageFile, { force = false } = {}) => {
    if (!imageFile) {
      setError("Choose an image first.");
      return;
    }

    const key = imageKey(imageFile);
    if (
      ocrProcessingRef.current ||
      isScanning ||
      (!force && lastOcrImageKeyRef.current === key)
    ) {
      return;
    }

    lastOcrImageKeyRef.current = key;
    ocrProcessingRef.current = true;
    setIsScanning(true);
    setError("");
    setSuccessMessage(
      "Processing asset label... Extracting information using OCR...",
    );

    try {
      const session = await getCurrentSession();
      if (!session) {
        setError("Please sign in to run OCR scan.");
        lastOcrImageKeyRef.current = "";
        setIsScanning(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", imageFile);
      const response = await pcmsApi.scanOcr(formData);
      const structuredData = response?.details || response?.data || {};
      const isSuccessful = response?.success !== false;

      if (!isSuccessful) {
        const message =
          response?.message || "OCR returned an unsuccessful response.";
        throw new Error(message);
      }

      const condition = (structuredData.condition || "").toLowerCase();
      const normalizedCondition = [
        "good",
        "needs_repair",
        "damaged",
        "under_inspection",
      ].includes(condition)
        ? condition
        : "good";
      setOcrResult(response);
      setError("");
      setSuccessMessage(
        response?.message ||
          "OCR completed. Please review the extracted information.",
      );
      setFormValues((current) => {
        const departmentId =
          current.department_id ||
          resolveDepartmentId(structuredData.department);

        return {
          ...current,
          property_number:
            structuredData.property_number || current.property_number,
          serial_number: structuredData.serial_number || current.serial_number,
          brand: structuredData.brand || current.brand,
          model: structuredData.model || current.model,
          name: structuredData.asset_name || current.name,
          description: structuredData.description || current.description,
          department_id: departmentId,
          location: structuredData.location || current.location,
          purchase_date: structuredData.purchase_date || current.purchase_date,
          purchase_cost: structuredData.purchase_cost
            ? String(structuredData.purchase_cost)
            : current.purchase_cost,
          quantity: structuredData.quantity
            ? String(structuredData.quantity)
            : current.quantity,
          warranty_until:
            structuredData.warranty_until || current.warranty_until,
          condition: normalizedCondition,
        };
      });
    } catch (scanError) {
      console.error("OCR scan error:", scanError);
      const message =
        scanError?.message ||
        "OCR could not process this image. Please try again or enter the information manually.";
      setError(message);
      setSuccessMessage("");
      setOcrResult(null);
      lastOcrImageKeyRef.current = "";
    } finally {
      ocrProcessingRef.current = false;
      setIsScanning(false);
    }
  };

  const handleScan = async () => {
    await runOcrForImage(selectedImage, { force: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const quantity = Number(formValues.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a whole number of at least 1.");
      }

      const payload = {
        ...formValues,
        category_id: null,
        department_id: formValues.department_id
          ? Number(formValues.department_id)
          : null,
        purchase_cost: formValues.purchase_cost
          ? Number(formValues.purchase_cost)
          : null,
        quantity,
        purchase_date: formValues.purchase_date || null,
        warranty_until: formValues.warranty_until || null,
        ocr_scan_id: ocrResult?.scan_id || null,
      };

      await pcmsApi.createAsset(payload);
      setSuccessMessage("Asset registered successfully.");
      setSelectedImage(null);
      setPreviewUrl("");
      setOcrResult(null);
      lastOcrImageKeyRef.current = "";
      pcmsApi
        .ocrHistory({ limit: 6 })
        .then(setOcrHistory)
        .catch(() => {});
      setFormValues({
        property_number: "",
        serial_number: "",
        brand: "",
        model: "",
        name: "",
        description: "",
        department_id: "",
        location: "",
        purchase_date: "",
        purchase_cost: "",
        quantity: "1",
        warranty_until: "",
        condition: "good",
        status: "available",
      });
    } catch (submitError) {
      setError(submitError.message || "Asset registration failed.");
    }
  };

  const updateField = (field, value) =>
    setFormValues((current) => ({ ...current, [field]: value }));

  return (
    <ModulePage
      title="OCR Asset Tagging"
      subtitle="Capture labels, extract fields, show confidence, and auto-fill registration."
      primary="Scan Asset Label"
      icon={Camera}
    >
      <div className="ocr-layout">
        <div className="capture-panel">
          <div className="camera-frame">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="OCR preview"
                className="ocr-preview-image"
              />
            ) : (
              <Camera size={52} />
            )}
            <strong>
              {isScanning
                ? "Processing Asset Label"
                : previewUrl
                  ? "Image Ready for Review"
                  : "Asset Label Capture"}
            </strong>
            <p>
              {isScanning
                ? "Extracting information using OCR..."
                : previewUrl
                  ? "OCR runs automatically after capture or upload. Review the extracted fields before registering."
                  : "Upload an image or open the camera to scan property tags."}
            </p>
            <div className="inline-actions">
              <label
                className={`primary-button upload-button ${isScanning ? "disabled" : ""}`}
              >
                <Camera size={16} /> Capture / Upload
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={isScanning}
                  onChange={(event) => {
                    handleImageSelect(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  hidden
                />
              </label>
              {error && selectedImage && (
                <button
                  className="secondary-button"
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  {isScanning ? "Processing..." : "Retry OCR"}
                </button>
              )}
            </div>
            {ocrResult && (
              <div
                className={`status-pill ${ocrResult.confidence >= 85 ? "success" : ocrResult.confidence >= 70 ? "warning" : "info"}`}
              >
                {ocrResult.processing_status === "completed"
                  ? "Completed"
                  : "Needs Review"}{" "}
                - Confidence {ocrResult.confidence}%
              </div>
            )}
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <PanelHeader
              title="OCR History"
              subtitle="Recent scans and registration status."
            />
            <div className="activity-list expanded">
              {ocrHistory.length === 0 ? (
                <p className="small-text">No OCR history yet.</p>
              ) : (
                ocrHistory.map((scan) => (
                  <div key={scan.id}>
                    <span className="activity-dot" />
                    <p>
                      Scan #{scan.id} - {Math.round(scan.confidence)}%
                      confidence -{" "}
                      {(scan.status || "pending_review").replace("_", " ")}
                    </p>
                    <time>{formatRelativeTime(scan.created_at)}</time>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="panel ocr-result">
          <PanelHeader
            title="Review & Register Asset"
            subtitle={
              isScanning
                ? "OCR is processing. Please wait before registering."
                : ocrResult
                  ? `OCR confidence: ${ocrResult.confidence}%`
                  : "Upload an image and confirm the extracted values."
            }
            action="Register Asset"
          />
          {error && <div className="form-message error">{error}</div>}
          {successMessage && (
            <div className="form-message success">{successMessage}</div>
          )}
          <form onSubmit={handleSubmit} className="ocr-form">
            <div className="field-row">
              <label>Property Number</label>
              <input
                value={formValues.property_number}
                onChange={(event) =>
                  updateField("property_number", event.target.value)
                }
              />
              <small>{ocrResult?.confidence >= 85 ? "High" : "Review"}</small>
            </div>
            <div className="field-row">
              <label>Asset Name</label>
              <input
                value={formValues.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <small>Required</small>
            </div>
            <div className="field-row">
              <label>Brand</label>
              <input
                value={formValues.brand}
                onChange={(event) => updateField("brand", event.target.value)}
              />
              <small>OCR</small>
            </div>
            <div className="field-row">
              <label>Model</label>
              <input
                value={formValues.model}
                onChange={(event) => updateField("model", event.target.value)}
              />
              <small>OCR</small>
            </div>
            <div className="field-row">
              <label>Serial Number</label>
              <input
                value={formValues.serial_number}
                onChange={(event) =>
                  updateField("serial_number", event.target.value)
                }
              />
              <small>OCR</small>
            </div>
            <div className="field-row">
              <label>Description</label>
              <textarea
                value={formValues.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={3}
              />
            </div>
            <div className="field-row">
              <label>Department</label>
              <select
                value={formValues.department_id}
                onChange={(event) =>
                  updateField("department_id", event.target.value)
                }
              >
                <option value="">Select department</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <label>Location</label>
              <input
                value={formValues.location}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
              />
            </div>
            <div className="field-row">
              <label>Purchase Date</label>
              <input
                type="date"
                value={formValues.purchase_date}
                onChange={(event) =>
                  updateField("purchase_date", event.target.value)
                }
              />
            </div>
            <div className="field-row">
              <label>Purchase Cost</label>
              <input
                type="number"
                value={formValues.purchase_cost}
                onChange={(event) =>
                  updateField("purchase_cost", event.target.value)
                }
              />
            </div>
            <div className="field-row">
              <label>Quantity</label>
              <input
                type="number"
                value={formValues.quantity}
                onChange={(event) =>
                  updateField("quantity", event.target.value)
                }
                required
                min="1"
                step="1"
                placeholder="Enter quantity"
              />
            </div>
            <div className="field-row">
              <label>Warranty Until</label>
              <input
                type="date"
                value={formValues.warranty_until}
                onChange={(event) =>
                  updateField("warranty_until", event.target.value)
                }
              />
            </div>
            <div className="field-row">
              <label>Condition</label>
              <select
                value={formValues.condition}
                onChange={(event) =>
                  updateField("condition", event.target.value)
                }
              >
                <option value="good">Good</option>
                <option value="needs_repair">Needs Repair</option>
                <option value="damaged">Damaged</option>
                <option value="under_inspection">Under Inspection</option>
              </select>
            </div>
            <div className="inline-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={isScanning}
              >
                Register Asset
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={isScanning}
                onClick={() =>
                  setFormValues((current) => ({
                    ...current,
                    property_number: "",
                    serial_number: "",
                    brand: "",
                    model: "",
                    name: "",
                    description: "",
                    department_id: "",
                    location: "",
                    purchase_date: "",
                    purchase_cost: "",
                    quantity: "1",
                    warranty_until: "",
                    condition: "good",
                  }))
                }
              >
                Clear OCR Fields
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModulePage>
  );
}

function MonitoringPage({ currentUser }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    department: "all",
    risk: "all",
    status: "open",
    date: "",
  });
  const [summaryData, setSummaryData] = useState(null);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [explaining, setExplaining] = useState({});
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionResult, setResolutionResult] = useState(null);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const [response, summaryResponse] = await Promise.all([
        pcmsApi.fetchAnomalies(),
        pcmsApi.fetchAnomalySummary(),
      ]);
      const nextAnomalies = response || [];
      setAnomalies(nextAnomalies);
      setSummaryData(summaryResponse || null);

      const anomalyId = new URLSearchParams(window.location.search).get(
        "anomaly",
      );
      if (anomalyId) {
        const selected = nextAnomalies.find(
          (item) => String(item.id) === String(anomalyId),
        );
        if (selected) {
          setSelectedAnomaly(selected);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAnomaly = async (id) => {
    try {
      const anomaly = anomalies.find((item) => String(item.id) === String(id));
      const response = await pcmsApi.resolveAnomaly(id);
      setResolutionResult({
        anomaly: { ...anomaly, status: "resolved" },
        nextAction: response?.next_action || getNextProcess(anomaly),
      });
      setSuccess(response?.message || "Anomaly marked as resolved.");
      await loadAnomalies();
      setSelectedAnomaly((current) =>
        current?.id === id ? { ...current, status: "resolved" } : current,
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRunAnalysis = async () => {
    setError(null);
    setSuccess(null);
    setAnalysisRunning(true);
    try {
      const result = await pcmsApi.analyzeAnomalies();
      setSuccess(result?.message || "Analysis complete.");
      await loadAnomalies();
    } catch (err) {
      setError(err?.message || "Analysis service is unavailable.");
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleExplainAnomaly = async (id) => {
    setError(null);
    setSuccess(null);
    setExplaining((current) => ({ ...current, [id]: true }));

    try {
      const response = await pcmsApi.explainAnomaly(id);
      const updated = response?.anomaly;

      if (updated) {
        setAnomalies((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...updated } : item,
          ),
        );
        setSelectedAnomaly((current) =>
          current?.id === id ? { ...current, ...updated } : current,
        );
      }

      setSuccess(response?.message || "AI explanation generated.");
    } catch (err) {
      setError(
        err?.message || "AI explanation could not be generated right now.",
      );
      loadAnomalies();
    } finally {
      setExplaining((current) => ({ ...current, [id]: false }));
    }
  };

  const isQuantityAnomaly = (flag) => flag.source_type === "quantity_anomaly";
  const isLowStockAlert = (flag) => flag.source_type === "low_stock";
  const supplyName = (flag) =>
    flag.asset_name ||
    (flag?.source_type === "untracked_transfer"
      ? `Asset #${flag.source_id || "Unknown"}`
      : null) ||
    flag.supply ||
    parseLowStockSupplyName(flag.reason) ||
    `Supply #${flag.source_id || "Unknown"}`;
  const anomalyLabel = (flag) => {
    if (flag?.source_type === "untracked_transfer") {
      return `${flag.asset_name} found in ${flag.found_department || "another department"} but recorded in ${flag.recorded_department || "a different department"}.`;
    }
    return flag?.reason || "No description provided.";
  };
  const riskTone = (priority) =>
    priority === "high" ? "danger" : priority === "medium" ? "warning" : "info";
  const formatValue = (value) =>
    value === null || value === undefined || value === ""
      ? "Not provided"
      : value;
  const formatDate = (value) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString();
  };

  const updateFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const departmentOptions = [
    ...new Set(anomalies.map((item) => item.department).filter(Boolean)),
  ].sort();
  const summary = {
    total: summaryData?.total_alerts ?? anomalies.length,
    high:
      summaryData?.high_risk ??
      anomalies.filter((item) => item.priority === "high").length,
    medium:
      summaryData?.medium_risk ??
      anomalies.filter((item) => item.priority === "medium").length,
    lowStock:
      summaryData?.low_stock ?? anomalies.filter(isLowStockAlert).length,
    open:
      summaryData?.open_unresolved ??
      anomalies.filter((item) => item.status !== "resolved").length,
  };

  const filteredAnomalies = anomalies.filter((flag) => {
    const query = filters.search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [
        supplyName(flag),
        flag.department,
        flag.reason,
        flag.recommended_action,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    const matchesType =
      filters.type === "all" ||
      (filters.type === "low_stock" && isLowStockAlert(flag)) ||
      (filters.type === "quantity_anomaly" && isQuantityAnomaly(flag));
    const matchesDepartment =
      filters.department === "all" || flag.department === filters.department;
    const matchesRisk =
      filters.risk === "all" ||
      (flag.priority || "").toLowerCase() === filters.risk;
    const matchesStatus =
      filters.status === "all" ||
      (flag.status || "").toLowerCase() === filters.status;
    const matchesDate =
      !filters.date ||
      String(flag.created_at || "").slice(0, 10) === filters.date;

    return (
      matchesSearch &&
      matchesType &&
      matchesDepartment &&
      matchesRisk &&
      matchesStatus &&
      matchesDate
    );
  });

  const formatAnomalyType = (sourceType) =>
    (sourceType || "anomaly")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getNextProcess = (flag) => {
    if (!flag) return "Review the monitoring center for remaining alerts.";
    if (isLowStockAlert(flag)) {
      return "Check the supply balance and create a stock-in or purchase request if restocking is needed.";
    }
    if (isQuantityAnomaly(flag)) {
      return "Review the related stock movement and confirm the request was authorized.";
    }
    if (flag.source_type === "untracked_transfer") {
      return "Verify the asset department and update the transfer record if the movement was authorized.";
    }
    if (flag.source_type === "repeat_repair") {
      return "Inspect the asset and schedule maintenance or replacement if the condition remains unsafe.";
    }
    return "Review the recommended action and monitor the related record for recurrence.";
  };

  const downloadMonitoringExcel = () => {
    const columns = [
      ["Alert ID", (flag) => flag.id],
      ["Type", (flag) => formatAnomalyType(flag.source_type)],
      ["Asset / Supply", (flag) => flag.asset_name || supplyName(flag)],
      ["Source ID", (flag) => flag.source_id],
      ["Department", (flag) => flag.department || flag.found_department || ""],
      ["Recorded Department", (flag) => flag.recorded_department || ""],
      ["Current Stock", (flag) => flag.current_stock],
      ["Minimum Stock", (flag) => flag.minimum_stock],
      ["Current Quantity", (flag) => flag.quantity],
      ["Historical Average", (flag) => flag.historical_average],
      ["Risk Level", (flag) => flag.priority],
      ["Risk Score", (flag) => flag.risk_score],
      ["Status", (flag) => flag.status],
      ["Reason", anomalyLabel],
      ["Recommended Action", (flag) => flag.recommended_action],
      ["Created At", (flag) => flag.created_at],
      ["Updated At", (flag) => flag.updated_at],
    ];
    const escapeCell = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rows = anomalies.map((flag) =>
      `<tr>${columns.map(([, value]) => `<td>${escapeCell(value(flag))}</td>`).join("")}</tr>`,
    ).join("");
    const html = `<table><thead><tr>${columns.map(([label]) => `<th>${escapeCell(label)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-monitoring-${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const canUseAiExplanation = [
    "System Administrator",
    "Property Custodian",
    "PPMO Staff",
    "OIC",
  ].includes(currentUser?.role);

  const chartDataFor = (flag) => {
    const historical = Array.isArray(flag?.historical_quantities)
      ? flag.historical_quantities
      : [];
    const average = Number(flag?.historical_average || 0);
    const rows = historical.map((quantity, index) => ({
      label: `H${index + 1}`,
      quantity: Number(quantity || 0),
      average,
    }));

    if (flag?.quantity !== undefined && flag?.quantity !== null) {
      rows.push({
        label: "Current",
        quantity: Number(flag.quantity || 0),
        average,
      });
    }

    return rows;
  };

  const zScoreExplanation = (flag) => {
    if (flag?.z_score === null || flag?.z_score === undefined) {
      return "Z-score was not provided by the backend.";
    }

    return `${flag.z_score} standard deviations from the historical average.`;
  };

  const selectedChartData = chartDataFor(selectedAnomaly);

  return (
    <ModulePage
      title="Inventory Risk & Anomaly Monitoring Center"
      subtitle="Operational alerts, low-stock conditions, and statistical supply anomalies."
      primary={analysisRunning ? "Running..." : "Run Analysis"}
      icon={Sparkles}
      actions={
        <div className="inline-actions">
          <button className="secondary-button" type="button" onClick={downloadMonitoringExcel}>
            <Download size={16} /> Download Excel
          </button>
          <button className="primary-button" type="button" onClick={handleRunAnalysis} disabled={analysisRunning}>
            <Sparkles size={16} /> {analysisRunning ? "Running..." : "Run Analysis"}
          </button>
        </div>
      }
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}
      {resolutionResult && (
        <div className="asset-description-card" style={{ marginBottom: 16 }}>
          <div className="inline-actions" style={{ justifyContent: "space-between" }}>
            <strong>Resolution recorded</strong>
            <span className="status success">Resolved</span>
          </div>
          <p>
            {resolutionResult.anomaly
              ? `${formatAnomalyType(resolutionResult.anomaly.source_type)}: ${supplyName(resolutionResult.anomaly)}`
              : "The monitoring alert was resolved."}
          </p>
          <p><strong>Next process:</strong> {resolutionResult.nextAction}</p>
          <div className="inline-actions">
            <button
              className="small-button"
              type="button"
              onClick={() => setFilters((current) => ({ ...current, status: "resolved" }))}
            >
              <Eye size={14} /> Show Resolved Alerts
            </button>
            <button
              className="small-button"
              type="button"
              onClick={handleRunAnalysis}
              disabled={analysisRunning}
            >
              <RotateCcw size={14} /> Run Follow-up Analysis
            </button>
          </div>
        </div>
      )}

      <section className="inventory-risk-summary">
        <StatCard
          label="Total Alerts"
          value={summary.total}
          change="All monitoring records"
          icon={AlertTriangle}
          tone="blue"
        />
        <StatCard
          label="High Risk"
          value={summary.high}
          change="Needs immediate review"
          icon={Shield}
          tone="red"
        />
        <StatCard
          label="Medium Risk"
          value={summary.medium}
          change="Watch list"
          icon={Gauge}
          tone="orange"
        />
        <StatCard
          label="Low Stock"
          value={summary.lowStock}
          change="Below minimum"
          icon={PackageOpen}
          tone="green"
        />
        <StatCard
          label="Open/Unresolved"
          value={summary.open}
          change="Active workload"
          icon={Timer}
          tone="purple"
        />
      </section>

      <section className="inventory-filter-bar">
        <label className="search-field">
          <Search size={16} />
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search supply..."
          />
        </label>
        <select
          value={filters.type}
          onChange={(event) => updateFilter("type", event.target.value)}
        >
          <option value="all">All Types</option>
          <option value="low_stock">Low Stock</option>
          <option value="quantity_anomaly">Supply Stock Anomaly</option>
        </select>
        <select
          value={filters.department}
          onChange={(event) => updateFilter("department", event.target.value)}
        >
          <option value="all">All Departments</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <select
          value={filters.risk}
          onChange={(event) => updateFilter("risk", event.target.value)}
        >
          <option value="all">All Risks</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filters.status}
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(event) => updateFilter("date", event.target.value)}
        />
      </section>

      {loading ? (
        <div className="loading-card">Loading anomalies...</div>
      ) : (
        <div className="alert-list expanded">
          {filteredAnomalies.length === 0 ? (
            <p className="empty-state">
              No monitoring alerts match the selected filters.
            </p>
          ) : (
            filteredAnomalies.map((flag) => (
              <article
                className={`anomaly-card monitoring-alert-card ${isQuantityAnomaly(flag) ? "statistical" : "low-stock"}`}
                key={flag.id}
              >
                <div className="monitoring-card-main">
                  <div className="monitoring-card-title">
                    <strong>
                      {isQuantityAnomaly(flag)
                        ? "Supply Stock Anomaly"
                        : formatAnomalyType(flag.source_type)}
                    </strong>
                    <span className={`status ${riskTone(flag.priority)}`}>
                      {flag.priority || "risk"}
                    </span>
                    {flag.status === "resolved" && (
                      <span className="status success">resolved</span>
                    )}
                  </div>
                  <p>
                    {isQuantityAnomaly(flag)
                      ? "Unusual supply consumption detected"
                      : anomalyLabel(flag)}
                  </p>
                  <h3>{supplyName(flag)}</h3>
                  {isQuantityAnomaly(flag) && (
                    <small>Department: {formatValue(flag.department)}</small>
                  )}
                  {isLowStockAlert(flag) && (
                    <div className="monitoring-card-metrics compact">
                      <span>
                        Current Stock{" "}
                        <strong>{formatValue(flag.current_stock)}</strong>
                      </span>
                      <span>
                        Minimum Stock{" "}
                        <strong>{formatValue(flag.minimum_stock)}</strong>
                      </span>
                    </div>
                  )}
                  {isQuantityAnomaly(flag) && (
                    <div className="monitoring-card-metrics">
                      <span>
                        Current Quantity{" "}
                        <strong>{formatValue(flag.quantity)}</strong>
                      </span>
                      <span>
                        Historical Average{" "}
                        <strong>{formatValue(flag.historical_average)}</strong>
                      </span>
                      <span>
                        Z-Score <strong>{formatValue(flag.z_score)}</strong>
                      </span>
                      <span>
                        Recent Similar Spikes{" "}
                        <strong>
                          {formatValue(flag.similar_recent_spikes)}
                        </strong>
                      </span>
                    </div>
                  )}
                  {isQuantityAnomaly(flag) && canUseAiExplanation && (
                    <span
                      className={`ai-state ${flag.ai_explanation ? "ready" : flag.ai_explanation_status === "failed" ? "failed" : "pending"}`}
                    >
                      {flag.ai_explanation
                        ? "AI Risk Explanation Available"
                        : flag.ai_explanation_status === "failed"
                          ? "AI explanation failed, retry available"
                          : "AI explanation pending"}
                    </span>
                  )}
                  {flag.recommended_action && (
                    <small>Recommended: {flag.recommended_action}</small>
                  )}
                  {flag.status === "resolved" && (
                    <small>Next process: {getNextProcess(flag)}</small>
                  )}
                </div>
                <div className="card-actions monitoring-actions">
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => setSelectedAnomaly(flag)}
                  >
                    <Eye size={14} />{" "}
                    {isQuantityAnomaly(flag) ? "View Analysis" : "View Details"}
                  </button>
                  {flag.status !== "resolved" && (
                    <button
                      className="small-button"
                      type="button"
                      onClick={() => handleResolveAnomaly(flag.id)}
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {selectedAnomaly && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedAnomaly(null)}
        >
          <div
            className="modal-card inventory-analysis-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3>
                  {isQuantityAnomaly(selectedAnomaly)
                    ? "Supply Stock Anomaly"
                    : isLowStockAlert(selectedAnomaly)
                      ? "Low Stock Alert"
                      : formatAnomalyType(selectedAnomaly.source_type)}
                </h3>
                <p>{supplyName(selectedAnomaly)}</p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSelectedAnomaly(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="inventory-analysis-body">
              {isQuantityAnomaly(selectedAnomaly) ? (
                <>
                  <div className="summary-grid">
                    <div>
                      <span>Supply</span>
                      <strong>{supplyName(selectedAnomaly)}</strong>
                    </div>
                    <div>
                      <span>Department</span>
                      <strong>{formatValue(selectedAnomaly.department)}</strong>
                    </div>
                    <div>
                      <span>Current Quantity</span>
                      <strong>{formatValue(selectedAnomaly.quantity)}</strong>
                    </div>
                    <div>
                      <span>Historical Average</span>
                      <strong>
                        {formatValue(selectedAnomaly.historical_average)}
                      </strong>
                    </div>
                    <div>
                      <span>Standard Deviation</span>
                      <strong>
                        {formatValue(selectedAnomaly.historical_stddev)}
                      </strong>
                    </div>
                    <div>
                      <span>Z-Score</span>
                      <strong>{formatValue(selectedAnomaly.z_score)}</strong>
                    </div>
                    <div>
                      <span>Risk Level</span>
                      <strong>{formatValue(selectedAnomaly.priority)}</strong>
                    </div>
                    <div>
                      <span>Detection Date</span>
                      <strong>{formatDate(selectedAnomaly.created_at)}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{formatValue(selectedAnomaly.status)}</strong>
                    </div>
                    <div>
                      <span>Recent Similar Spikes</span>
                      <strong>
                        {formatValue(selectedAnomaly.similar_recent_spikes)}
                      </strong>
                    </div>
                  </div>
                  <div className="zscore-note">
                    <strong>Z-Score Explanation</strong>
                    <p>{zScoreExplanation(selectedAnomaly)}</p>
                  </div>
                  <section className="inventory-chart-panel">
                    <h4>Historical Usage</h4>
                    {selectedChartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart
                          data={selectedChartData}
                          margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="average"
                            stroke="#64748B"
                            fill="#E2E8F0"
                            strokeWidth={2}
                            name="Historical Average"
                          />
                          <Area
                            type="monotone"
                            dataKey="quantity"
                            stroke="#DC2626"
                            fill="#FEE2E2"
                            strokeWidth={2}
                            name="Quantity"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="small-text">
                        Historical movement quantities are not available for
                        this anomaly.
                      </p>
                    )}
                  </section>
                  {canUseAiExplanation && (
                    <section className="ai-explanation analysis">
                      <strong>AI Risk Explanation</strong>
                      {selectedAnomaly.ai_explanation ? (
                        <p>{selectedAnomaly.ai_explanation}</p>
                      ) : selectedAnomaly.ai_explanation_status === "failed" ? (
                        <p className="error-text">
                          AI explanation cannot be generated right now. Please
                          try again later.
                        </p>
                      ) : (
                        <p>No AI explanation generated yet.</p>
                      )}
                      <button
                        className="small-button"
                        type="button"
                        onClick={() => handleExplainAnomaly(selectedAnomaly.id)}
                        disabled={!!explaining[selectedAnomaly.id]}
                      >
                        <RotateCcw size={14} />
                        {explaining[selectedAnomaly.id]
                          ? "Generating..."
                          : selectedAnomaly.ai_explanation
                            ? "Regenerate Explanation"
                            : "Generate AI Explanation"}
                      </button>
                    </section>
                  )}
                </>
              ) : (
                <>
                  <div className="summary-grid">
                    <div>
                      <span>Supply</span>
                      <strong>{supplyName(selectedAnomaly)}</strong>
                    </div>
                    <div>
                      <span>Current Stock</span>
                      <strong>
                        {formatValue(selectedAnomaly.current_stock)}
                      </strong>
                    </div>
                    <div>
                      <span>Minimum Stock</span>
                      <strong>
                        {formatValue(selectedAnomaly.minimum_stock)}
                      </strong>
                    </div>
                    <div>
                      <span>Risk Level</span>
                      <strong>{formatValue(selectedAnomaly.priority)}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{formatValue(selectedAnomaly.status)}</strong>
                    </div>
                    <div>
                      <span>Detection Date</span>
                      <strong>{formatDate(selectedAnomaly.created_at)}</strong>
                    </div>
                  </div>
                  <p>{anomalyLabel(selectedAnomaly)}</p>
                  {selectedAnomaly.recommended_action && (
                    <p>
                      <strong>Recommended:</strong>{" "}
                      {selectedAnomaly.recommended_action}
                    </p>
                  )}
                </>
              )}
              <div className="modal-actions">
                {selectedAnomaly.status !== "resolved" && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => handleResolveAnomaly(selectedAnomaly.id)}
                  >
                    <CheckCircle2 size={16} /> Resolve
                  </button>
                )}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function parseLowStockSupplyName(reason = "") {
  const marker = " is below minimum stock";
  const index = String(reason || "").indexOf(marker);
  return index > 0 ? reason.slice(0, index) : null;
}

function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const reportRef = useRef(null);

  const reports = [
    {
      id: "audit-summary",
      name: "Audit Summary",
      icon: ClipboardCheck,
      description: "Audit session statistics and findings",
    },
    {
      id: "damage-summary",
      name: "Damage Summary",
      icon: AlertTriangle,
      description: "Damage reports by severity and status",
    },
    {
      id: "anomaly-summary",
      name: "Anomaly Summary",
      icon: Sparkles,
      description: "Detected anomalies and resolutions",
    },
    { id: "asset-inventory-summary", name: "Asset Inventory", icon: Package, description: "Asset ledger by department, condition, and status" },
    { id: "supplies-inventory-summary", name: "Supplies Inventory", icon: Archive, description: "Department supplies, stock levels, and low-stock items" },
    { id: "maintenance-summary", name: "Maintenance Summary", icon: Wrench, description: "Scheduled, completed, and overdue maintenance records" },
    { id: "assignment-summary", name: "Assignment Summary", icon: UserCheck, description: "Asset accountability and return status" },
    { id: "transfer-summary", name: "Transfer Summary", icon: Truck, description: "Department transfers and approval status" },
  ];

  const handleGenerateReport = async (reportType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await pcmsApi.generateReport(reportType);
      setReportData(response?.data);
      setSelectedReport(reportType);
      setSuccess("Report generated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reportRows = () => {
    const collection = Object.values(reportData || {}).find((value) => Array.isArray(value));
    return collection || [];
  };

  const handleDownload = async (format) => {
    if (!reportData) return;
    if (format === "pdf") {
      await exportElementToPdf(reportRef.current, `${selectedReport}.pdf`);
      return;
    }
    const rows = reportRows();
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${selectedReport}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <ModulePage
      title="Reports"
      subtitle="Export PDF, Excel, and CSV reports for all property workflows."
      primary="Generate Report"
      icon={FileBarChart2}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      {!reportData ? (
        <div className="card-grid">
          {reports.map((report) => (
            <div className="mini-card" key={report.id}>
              <div className="mini-icon tone-blue">
                <report.icon size={20} />
              </div>
              <strong>{report.name}</strong>
              <p>{report.description}</p>
              <div className="inline-actions small">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="report-header">
            <h3>Report: {selectedReport}</h3>
            <button onClick={() => setReportData(null)}>
              ← Back to Reports
            </button>
          </div>

          <div className="inline-actions">
            <button
              className="primary-button"
              onClick={() => handleDownload("csv")}
            >
              <Download size={16} /> Download CSV
            </button>
            <button className="secondary-button" onClick={() => handleDownload("pdf")}><Printer size={16} /> Download PDF</button>
          </div>

          <div className="report-content" ref={reportRef}>
            <h2>{reportData.report_type}</h2>
            <p>Generated: {new Date(reportData.generated_at).toLocaleString()}</p>
            <pre
              style={{
                maxHeight: "500px",
                overflowY: "auto",
                background: "#f5f5f5",
                padding: "15px",
                borderRadius: "5px",
              }}
            >
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </ModulePage>
  );
}

function NotificationsPage({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    pcmsApi
      .notifications()
      .then((response) => {
        if (mounted) setItems(response?.data || []);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Unable to load notifications.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleExport = () => {
    exportRowsToCsv("notifications.csv", items, [
      { label: "Type", value: (item) => item.type },
      { label: "Title", value: (item) => item.title },
      { label: "Message", value: (item) => item.message },
      { label: "Time", value: (item) => item.time },
      { label: "Urgent", value: (item) => (item.urgent ? "Yes" : "No") },
    ]);
  };

  return (
    <ModulePage
      title="Notifications"
      subtitle="System, email, approval, low-stock, anomaly, and maintenance reminders."
      primary="Notification Rules"
      icon={Bell}
      onPrimary={() => onNavigate?.("settings")}
      onExport={handleExport}
    >
      {error && <div className="form-message error">{error}</div>}
      {loading ? (
        <div className="loading-card">Loading notifications…</div>
      ) : (
        <div className="notification-list">
          {items.length === 0 ? (
            <p className="small-text">No notifications right now.</p>
          ) : (
            items.map((item, index) => {
              const meta = notificationMeta(item.type);
              return (
                <button
                  className="notification-card"
                  type="button"
                  key={index}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className={`mini-icon tone-${meta.tone}`}>
                    <meta.icon size={18} />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                  </div>
                  <span>{formatRelativeTime(item.time)}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </ModulePage>
  );
}

const USER_ROLES = [
  "System Administrator",
  "Property Custodian",
  "PPMO Staff",
  "Department Head",
  "Requester",
  "President",
  "CEO",
];

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "",
    department: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    pcmsApi
      .departments()
      .then(setDepartmentsList)
      .catch(() => {});
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await pcmsApi.users();
      setUsers(response || []);
    } catch (err) {
      setError(err?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setTemporaryPassword(null);
    setSaving(true);
    try {
      const response = await pcmsApi.createUser(formData);
      setSuccess(`${response.user.full_name} was added.`);
      if (response.temporary_password) {
        setTemporaryPassword(response.temporary_password);
      }
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "",
        department: "",
      });
      setShowInvitePassword(false);
      setShowInviteForm(false);
      loadUsers();
    } catch (err) {
      setError(err?.message || "Failed to add user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    try {
      await pcmsApi.deactivateUser(user.id);
      setSuccess(`${user.full_name} was deactivated.`);
      loadUsers();
    } catch (err) {
      setError(err?.message || "Failed to deactivate user.");
    }
  };

  const handleReactivate = async (user) => {
    try {
      await pcmsApi.updateUser(user.id, { status: "active" });
      setSuccess(`${user.full_name} was reactivated.`);
      loadUsers();
    } catch (err) {
      setError(err?.message || "Failed to reactivate user.");
    }
  };

  const openEditDialog = (user) => {
    setError(null);
    setSuccess(null);
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      role: user.role || "",
      department: user.department || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEditSaving(true);
    try {
      await pcmsApi.updateUser(editingUser.id, editFormData);
      setSuccess(`${editingUser.full_name} was updated.`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err?.message || "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <ModulePage
      title="User Management"
      subtitle="PCMS accounts, roles, and protected route permissions."
      primary="Invite User"
      icon={Users}
      onPrimary={() => setShowInviteForm((v) => !v)}
    >
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}
      {temporaryPassword && (
        <div className="form-message success">
          Temporary password: <strong>{temporaryPassword}</strong> — share this
          with the user, they should change it after first login.
        </div>
      )}

      {showInviteForm && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-user-title"
          onClick={() => setShowInviteForm(false)}
        >
          <div
            className="modal-card user-form-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="invite-user-title">Invite User</h3>
                <p className="modal-subtitle">
                  Create an account and assign its access level.
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowInviteForm(false)}
                aria-label="Close invite user form"
              >
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleInvite}>
              <div className="form-grid">
                <label>
                  First Name
                  <input
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Middle Name
                  <input
                    value={formData.middle_name}
                    onChange={(e) =>
                      setFormData({ ...formData, middle_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Last Name
                  <input
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  >
                    <option value="">Select role</option>
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Department
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  >
                    <option value="">No department</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  Password{" "}
                  <span className="field-hint">
                    Optional. Leave blank to generate one automatically.
                  </span>
                  <span className="password-input-wrapper">
                    <input
                      type={showInvitePassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowInvitePassword((value) => !value)}
                      aria-label={
                        showInvitePassword ? "Hide password" : "Show password"
                      }
                    >
                      {showInvitePassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </span>
                </label>
              </div>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  <Users size={16} /> {saving ? "Adding…" : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button
                className="icon-button"
                onClick={() => setEditingUser(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form className="register-form" onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <label>
                  First Name
                  <input
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        first_name: e.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Middle Name
                  <input
                    value={editFormData.middle_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        middle_name: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Last Name
                  <input
                    value={editFormData.last_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value })
                    }
                    required
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Department
                  <select
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        department: e.target.value,
                      })
                    }
                  >
                    <option value="">No department</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setEditingUser(null)}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={editSaving}
                >
                  <Pencil size={16} /> {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-card">
        {loading ? (
          <div className="loading-card">Loading users…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6">No users yet</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.full_name}</strong>
                      {user.employee_id && <span> · {user.employee_id}</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.department || "—"}</td>
                    <td>
                      <span
                        className={`status ${user.status === "active" ? "success" : "danger"}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions small">
                        <button
                          className="small-button"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        {user.status === "active" ? (
                          <button
                            className="small-button"
                            onClick={() => handleDeactivate(user)}
                          >
                            <UserX size={14} /> Deactivate
                          </button>
                        ) : (
                          <button
                            className="small-button"
                            onClick={() => handleReactivate(user)}
                          >
                            <UserCheck size={14} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <h3>Role Permissions Reference</h3>
        </div>
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Dashboard</th>
                <th>Assets</th>
                <th>Approvals</th>
                <th>Reports</th>
                <th>Settings</th>
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map((role) => (
                <tr key={role.role}>
                  <td>
                    <strong>{role.role}</strong>
                  </td>
                  {role.permissions.map((permission, index) => (
                    <td key={`${role.role}-${index}`}>
                      {permission ? (
                        <CheckCircle2 className="check" size={18} />
                      ) : (
                        <X className="xmark" size={18} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModulePage>
  );
}

function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    pcmsApi
      .activityLogs({ limit: 100 })
      .then((response) => {
        if (mounted) setLogs(response || []);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Unable to load activity logs.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleExport = () => {
    exportRowsToCsv("activity-logs.csv", logs, [
      { label: "Time", value: (log) => log.time },
      { label: "Action", value: (log) => log.action },
      { label: "Description", value: (log) => log.text },
      { label: "User", value: (log) => log.user },
      { label: "IP", value: (log) => log.ip },
    ]);
  };

  return (
    <ModulePage
      title="Activity Logs"
      subtitle="Immutable audit trail for every asset, request, approval, OCR scan, and anomaly."
      primary="Export Logs"
      icon={History}
      onPrimary={handleExport}
    >
      {error && <div className="form-message error">{error}</div>}
      {loading ? (
        <div className="loading-card">Loading activity…</div>
      ) : (
        <div className="activity-list expanded">
          {logs.length === 0 ? (
            <p className="small-text">No activity recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id}>
                <span className="activity-dot" />
                <p>{log.text}</p>
                <time>{formatRelativeTime(log.time)}</time>
              </div>
            ))
          )}
        </div>
      )}
    </ModulePage>
  );
}

function SettingsPage() {
  const [values, setValues] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { pcmsApi.systemSettings().then((response) => setValues(response.data)).catch((err) => setError(err.message)); }, []);
  const save = async () => {
    try { setError(null); const response = await pcmsApi.updateSystemSettings(values); setValues(response.data); setMessage("System settings saved."); }
    catch (err) { setError(err.message); }
  };
  if (!values) return <ModulePage title="Settings" subtitle="Loading system configuration…" icon={Settings}><div className="loading-card">Loading settings…</div></ModulePage>;
  return (
    <ModulePage
      title="Settings"
      subtitle="Subsystem configuration, numbering rules, integrations, and approval policies."
      primary="Save Changes"
      icon={Settings}
      onPrimary={save}
    >
      {error && <div className="form-message error">{error}</div>}
      {message && <div className="form-message success">{message}</div>}
      <div className="settings-grid">
        {[
          ["Use recommending approver", "recommending_approver_enabled", "Adds the Recommending Approver stage to request approvals."],
          ["Automatic low-stock requisitions", "low_stock_auto_requisition_enabled", "Creates a procurement request when a department supply reaches minimum stock."],
        ].map(([label, key, description]) => (
          <div className="setting-row" key={key}>
            <div>
              <strong>{label}</strong><p>{description}</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={Boolean(values[key])} onChange={(event) => setValues({ ...values, [key]: event.target.checked })} />
              <span />
            </label>
          </div>
        ))}
        <label className="field-row"><strong>Maintenance reminder window (days)</strong><select value={values.maintenance_reminder_days} onChange={(event) => setValues({ ...values, maintenance_reminder_days: Number(event.target.value) })}><option value={1}>1 day</option><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option></select></label>
        <label className="field-row"><strong>OCR confidence threshold (%)</strong><input type="number" min="0" max="100" value={values.ocr_confidence_threshold} onChange={(event) => setValues({ ...values, ocr_confidence_threshold: Number(event.target.value) })} /></label>
        <label className="field-row"><strong>Anomaly risk threshold</strong><input type="number" min="1" max="10" value={values.anomaly_risk_threshold} onChange={(event) => setValues({ ...values, anomaly_risk_threshold: Number(event.target.value) })} /></label>
      </div>
    </ModulePage>
  );
}

function ModulePage({
  title,
  subtitle,
  primary,
  icon: Icon,
  stats = [],
  children,
  onPrimary,
  secondaryActions,
  onExport,
  actions,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <Icon size={15} /> Property Custodian Management System
          </span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">
          {actions || (
            <>
              <button
                className="primary-button"
                type="button"
                onClick={onPrimary}
              >
                <Icon size={16} /> {primary}
              </button>
              {secondaryActions}
            </>
          )}
        </div>
      </div>
      {stats.length > 0 && (
        <section className="metric-grid compact">
          {stats.map(([label, value, IconComponent]) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              change="Live data"
              icon={IconComponent}
              tone="blue"
            />
          ))}
        </section>
      )}
      {children}
    </>
  );
}

function StatCard({ label, value, change, icon: Icon, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon tone-${tone}`}>
        <Icon size={22} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{change}</p>
    </article>
  );
}

function PanelHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="panel-header">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button type="button" onClick={onAction}>
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function DataToolbar({ searchText, onSearchChange }) {
  return (
    <div className="data-toolbar">
      <label>
        <Search size={16} />
        <input
          value={searchText}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search table..."
        />
      </label>
      <button>
        <Filter size={16} /> Filter
      </button>
      <button>
        <Download size={16} /> Export
      </button>
      <button>
        <ClipboardCheck size={16} /> Bulk Actions
      </button>
    </div>
  );
}

function printAssetQrCode(asset) {
  const url = assetQrCodeUrl(asset.qr_code_path);
  if (!url) return;

  const printWindow = window.open("", "_blank", "width=420,height=520");
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head><title>QR Code · ${asset.property_number || asset.name}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
        <img src="${url}" alt="QR code" style="width:280px;height:280px;" onload="window.print(); window.onafterprint = () => window.close();" />
        <p style="margin-top:12px;font-size:14px;">${asset.name} · ${asset.property_number || ""}</p>
      </body>
    </html>
  `);
  printWindow.document.close();
}

async function downloadAssetQrCode(asset) {
  const url = assetQrCodeUrl(asset.qr_code_path);
  if (!url) return;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `qr-${asset.property_number || asset.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    // ignore - user can retry
  }
}

function AssetDetailGrid({ asset }) {
  const displayText = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    return value;
  };
  const prettifyToken = (value) =>
    String(value || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  const formatDetailCurrency = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value || 0);
    if (Number.isNaN(amount)) return value;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };
  const formatDetailDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
  };
  const getStatusTone = (value) => {
    const key = String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    if (key === "available") return "success";
    if (["in_use", "assigned", "transferred"].includes(key)) return "info";
    if (["maintenance", "under_maintenance"].includes(key)) return "warning";
    if (key === "damaged") return "danger";
    return "neutral";
  };
  const getConditionTone = (value) => {
    const key = String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    if (key === "good") return "success";
    if (key === "fair") return "caution";
    if (["poor", "needs_repair", "under_inspection"].includes(key))
      return "warning";
    if (key === "damaged") return "danger";
    return "neutral";
  };
  const renderBadge = (value, kind) => {
    if (!value) return "-";
    const tone =
      kind === "condition" ? getConditionTone(value) : getStatusTone(value);
    return (
      <span className={`asset-detail-badge ${tone}`}>
        {prettifyToken(value)}
      </span>
    );
  };
  const fields = [
    ["Property Number", asset?.property_number],
    ["Asset Name", asset?.name],
    ["Brand", asset?.brand],
    ["Model", asset?.model],
    ["Serial Number", asset?.serial_number],
    [
      "Category",
      asset?.category?.name ||
        (asset?.category_id ? `Category ${asset.category_id}` : null),
    ],
    [
      "Department",
      asset?.department?.name ||
        (asset?.department_id ? `Dept ${asset.department_id}` : null),
    ],
    ["Location", asset?.location],
    ["Quantity", asset?.quantity ?? 1],
    ["Purchase Cost", formatDetailCurrency(asset?.purchase_cost)],
    ["Purchase Date", formatDetailDate(asset?.purchase_date)],
    ["Warranty Until", formatDetailDate(asset?.warranty_until)],
    ["Condition", renderBadge(asset?.condition, "condition")],
    ["Status", renderBadge(asset?.status, "status")],
  ];
  const timestamps = [
    ["Created At", formatDetailDate(asset?.created_at)],
    ["Last Updated", formatDetailDate(asset?.updated_at)],
  ];

  return (
    <div className="asset-detail-content">
      <div className="asset-detail-grid">
        {fields.map(([label, value]) => (
          <div className="asset-detail-item" key={label}>
            <span className="asset-detail-label">{label}</span>
            <strong className="asset-detail-value">{displayText(value)}</strong>
          </div>
        ))}
      </div>
      <section
        className="asset-description-card"
        aria-labelledby="asset-description-title"
      >
        <span className="asset-detail-label" id="asset-description-title">
          Description
        </span>
        <p>{displayText(asset?.description)}</p>
      </section>
      <div className="asset-detail-footer-grid">
        {timestamps.map(([label, value]) => (
          <div className="asset-detail-item" key={label}>
            <span className="asset-detail-label">{label}</span>
            <strong className="asset-detail-value">{displayText(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetEditFields({ values, departments, onChange }) {
  return (
    <>
      <div className="form-grid">
        <label>
          Asset Name
          <input
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
            required
          />
        </label>
        <label>
          Property Number
          <input
            value={values.property_number}
            onChange={(event) =>
              onChange("property_number", event.target.value)
            }
            required
          />
        </label>
        <label>
          Serial Number
          <input
            value={values.serial_number}
            onChange={(event) => onChange("serial_number", event.target.value)}
          />
        </label>
        <label>
          Brand
          <input
            value={values.brand}
            onChange={(event) => onChange("brand", event.target.value)}
          />
        </label>
        <label>
          Model
          <input
            value={values.model}
            onChange={(event) => onChange("model", event.target.value)}
          />
        </label>
        <label>
          Category ID
          <input
            value={values.category_id}
            onChange={(event) => onChange("category_id", event.target.value)}
            type="number"
            min="1"
            step="1"
          />
        </label>
        <label>
          Department
          <select
            value={values.department_id}
            onChange={(event) => onChange("department_id", event.target.value)}
          >
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input
            value={values.location}
            onChange={(event) => onChange("location", event.target.value)}
          />
        </label>
        <label>
          Purchase Cost
          <input
            value={values.purchase_cost}
            onChange={(event) => onChange("purchase_cost", event.target.value)}
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <label>
          Quantity
          <input
            value={values.quantity}
            onChange={(event) => onChange("quantity", event.target.value)}
            type="number"
            required
            min="1"
            step="1"
            placeholder="Enter quantity"
          />
        </label>
        <label>
          Purchase Date
          <input
            value={values.purchase_date}
            onChange={(event) => onChange("purchase_date", event.target.value)}
            type="date"
          />
        </label>
        <label>
          Warranty Until
          <input
            value={values.warranty_until}
            onChange={(event) => onChange("warranty_until", event.target.value)}
            type="date"
          />
        </label>
        <label>
          Condition
          <select
            value={values.condition}
            onChange={(event) => onChange("condition", event.target.value)}
          >
            <option value="good">Good</option>
            <option value="needs_repair">Needs Repair</option>
            <option value="damaged">Damaged</option>
            <option value="under_inspection">Under Inspection</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={values.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="transferred">Transferred</option>
            <option value="maintenance">Maintenance</option>
            <option value="damaged">Damaged</option>
            <option value="disposed">Disposed</option>
          </select>
        </label>
      </div>
      <label className="full-width">
        Description
        <textarea
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          rows={3}
        />
      </label>
    </>
  );
}

function AssetTable({
  assets = [],
  loading = false,
  error = null,
  canManageAssets = false,
  canDeleteRecords = false,
  onView,
  onEdit,
  onDelete,
  disabled = false,
}) {
  return (
    <div className="table-card asset-registry-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Property No.</th>
            <th>Department</th>
            <th>Custodian</th>
            <th>Value</th>
            <th>Quantity</th>
            <th>Available</th>
            <th>Condition</th>
            <th>Status</th>
            <th>QR Code</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }, (_, index) => (
              <tr
                className="asset-skeleton-row"
                key={`asset-skeleton-${index}`}
                aria-hidden="true"
              >
                <td>
                  <span className="asset-skeleton-line asset-name-skeleton" />
                  <span className="asset-skeleton-line asset-subtext-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-code-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-department-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-custodian-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-value-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-number-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-number-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-line asset-condition-skeleton" />
                </td>
                <td>
                  <span className="asset-skeleton-pill" />
                </td>
                <td>
                  <span className="asset-skeleton-square" />
                </td>
                <td className="actions-column">
                  <span className="asset-skeleton-actions" />
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td className="asset-table-state" colSpan="11">
                <div className="alert danger">{error}</div>
              </td>
            </tr>
          ) : assets.length === 0 ? (
            <tr>
              <td className="asset-table-state" colSpan="11">
                No assets found.
              </td>
            </tr>
          ) : (
            assets.map((asset) => (
              <tr key={asset.id}>
                <td>
                  <strong>{asset.name}</strong>
                  <span>
                    {asset.asset_id || asset.serial_number || "No ID"}
                  </span>
                </td>
                <td>{asset.property_number || "—"}</td>
                <td>
                  {formatDepartment(asset.department) ||
                    (asset.department_id
                      ? `Dept ${asset.department_id}`
                      : "Unassigned")}
                </td>
                <td>{asset.custodian_id || "Pending"}</td>
                <td>{formatCurrency(Number(asset.purchase_cost || 0))}</td>
                <td>{asset.quantity ?? 1}</td>
                <td>{asset.available_quantity ?? asset.quantity ?? 1}</td>
                <td>{asset.condition}</td>
                <td>
                  <span
                    className={`status ${asset.status === "maintenance" ? "warning" : asset.status === "damaged" ? "danger" : asset.status === "disposed" ? "danger" : (asset.available_quantity ?? asset.quantity ?? 1) > 0 ? "success" : "info"}`}
                  >
                    {["maintenance", "damaged", "disposed"].includes(
                      asset.status,
                    )
                      ? asset.status
                      : (asset.available_quantity ?? asset.quantity ?? 1) > 0
                        ? "available"
                        : "assigned"}
                  </span>
                </td>
                <td>
                  {asset.qr_code_path ? (
                    <div className="inline-actions">
                      <button
                        className="icon-button"
                        type="button"
                        title="Print QR code"
                        onClick={() => printAssetQrCode(asset)}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Download QR code"
                        onClick={() => downloadAssetQrCode(asset)}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#999", fontSize: 12 }}>
                      Not generated
                    </span>
                  )}
                </td>
                <td className="actions-column">
                  <div className="inline-actions asset-actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="View asset"
                      aria-label={`View ${asset.name}`}
                      onClick={() => onView?.(asset)}
                      disabled={disabled}
                    >
                      <Eye size={16} />
                    </button>
                    {canManageAssets && (
                      <>
                        <button
                          className="icon-button"
                          type="button"
                          title="Edit asset"
                          aria-label={`Edit ${asset.name}`}
                          onClick={() => onEdit?.(asset)}
                          disabled={disabled}
                        >
                          <Pencil size={16} />
                        </button>
                        {canDeleteRecords && <button
                          className="icon-button danger-action"
                          type="button"
                          title="Delete asset"
                          aria-label={`Delete ${asset.name}`}
                          onClick={() => onDelete?.(asset)}
                          disabled={disabled}
                        >
                          <Trash2 size={16} />
                        </button>}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="pagination">
        <span>
          Showing 1-{Math.min(assets.length, 50)} of {assets.length} assets
        </span>
        <button>Previous</button>
        <button>Next</button>
      </div>
    </div>
  );
}

function AnomalyCard({ flag, compact = false }) {
  return (
    <article className={`anomaly-card ${compact ? "compact" : ""}`}>
      <div>
        <strong>{flag.title}</strong>
        <p>{flag.reason}</p>
        {!compact && <small>Recommended action: {flag.action}</small>}
      </div>
      <RiskBadge score={flag.riskScore} />
      <span
        className={`status ${flag.priority === "High" ? "danger" : flag.priority === "Medium" ? "warning" : "info"}`}
      >
        {flag.priority}
      </span>
    </article>
  );
}

function RiskBadge({ score }) {
  const tone = score >= 80 ? "danger" : score >= 60 ? "warning" : "success";
  return <span className={`risk ${tone}`}>{score}%</span>;
}

function HeadsetIcon() {
  return <Activity size={18} />;
}

createRoot(document.getElementById("root")).render(<App />);

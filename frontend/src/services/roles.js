/**
 * Role-based routing and permissions utilities for PCMS
 */

export const ROLES = {
  PPMO_STAFF: 'PPMO Staff',
  OIC: 'Property Custodian',
  DEPARTMENT_HEAD: 'Department Head',
  RECOMMENDING_APPROVER: 'Recommending Approver',
  PRESIDENT_CEO: 'President',
  DEPARTMENT_REQUESTER: 'Department Requester',
  SYSTEM_ADMIN: 'System Administrator',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SYSTEM_ADMIN]: {
    canManageUsers: true,
    canManageAssets: true,
    canApprovePurchases: true,
    canApproveTransfers: true,
    canApproveGatePasses: true,
    canConductAudits: true,
    canViewReports: true,
    canManageSupplies: true,
  },
  [ROLES.PPMO_STAFF]: {
    canManageUsers: false,
    canManageAssets: true,
    canApprovePurchases: false,
    canApproveTransfers: true,
    canApproveGatePasses: true,
    canConductAudits: true,
    canViewReports: true,
    canManageSupplies: true,
  },
  [ROLES.OIC]: {
    canManageUsers: false,
    canManageAssets: true,
    canApprovePurchases: true,
    canApproveTransfers: true,
    canApproveGatePasses: true,
    canConductAudits: true,
    canViewReports: true,
    canManageSupplies: true,
  },
  [ROLES.DEPARTMENT_HEAD]: {
    canManageUsers: false,
    canManageAssets: false,
    canApprovePurchases: true,
    canApproveTransfers: false,
    canApproveGatePasses: false,
    canConductAudits: false,
    canViewReports: false,
    canManageSupplies: false,
  },
  [ROLES.RECOMMENDING_APPROVER]: {
    canManageUsers: false,
    canManageAssets: false,
    canApprovePurchases: true,
    canApproveTransfers: false,
    canApproveGatePasses: false,
    canConductAudits: false,
    canViewReports: false,
    canManageSupplies: false,
  },
  [ROLES.PRESIDENT_CEO]: {
    canManageUsers: false,
    canManageAssets: false,
    canApprovePurchases: true,
    canApproveTransfers: false,
    canApproveGatePasses: false,
    canConductAudits: false,
    canViewReports: false,
    canManageSupplies: false,
  },
  [ROLES.DEPARTMENT_REQUESTER]: {
    canManageUsers: false,
    canManageAssets: false,
    canApprovePurchases: false,
    canApproveTransfers: false,
    canApproveGatePasses: false,
    canConductAudits: false,
    canViewReports: false,
    canManageSupplies: false,
  },
};

/**
 * Get the default home screen for a user based on their role
 */
export function getDefaultHomeScreen(role) {
  const roleDefaultScreens = {
    [ROLES.DEPARTMENT_HEAD]: 'approvals',
    [ROLES.RECOMMENDING_APPROVER]: 'approvals',
    [ROLES.PRESIDENT_CEO]: 'approvals',
    [ROLES.PPMO_STAFF]: 'dashboard',
    [ROLES.OIC]: 'dashboard',
    [ROLES.SYSTEM_ADMIN]: 'dashboard',
    [ROLES.DEPARTMENT_REQUESTER]: 'my-requests',
  };

  return roleDefaultScreens[role] || 'dashboard';
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions[permission] : false;
}

/**
 * Get displayable role name
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    [ROLES.PPMO_STAFF]: 'PPMO Staff',
    [ROLES.OIC]: 'Officer in Charge',
    [ROLES.DEPARTMENT_HEAD]: 'Department Head',
    [ROLES.RECOMMENDING_APPROVER]: 'Recommending Approver',
    [ROLES.PRESIDENT_CEO]: 'President/CEO',
    [ROLES.DEPARTMENT_REQUESTER]: 'Department Requester',
    [ROLES.SYSTEM_ADMIN]: 'System Administrator',
  };

  return roleNames[role] || role;
}

# PCMS End-to-End Workflow Verification

## Complete Workflow Path

### Scenario: Logistics Department Requester requests office supplies

#### STEP 1: Requester Creates Request
- **User**: requester@pcms.test (Requester role, Logistics Department)
- **Action**: Create purchase request via `/requester` dashboard
- **API Call**: `pcmsApi.requesterCreatePurchaseRequest()`
- **Backend**: `PurchaseRequestController@store()`
- **Initial State**: 
  - `current_stage` = 'department_head'
  - `status` = 'pending'
- **Next**: Request assigned to Department Head for review

#### STEP 2: Department Head Reviews and Approves
- **User**: depthead@pcms.test (Department Head role, Logistics Department)
- **Dashboard**: `/department-head/dashboard` or `/department-head/pending-approvals`
- **Components Used**: PendingApprovals.jsx (now loads real data via API)
- **API Call**: `pcmsApi.departmentHeadApprovalQueue()` loads pending requests
- **Action**: Click "Approve" button
- **API Call**: `pcmsApi.departmentHeadApprove('purchase', requestId)`
- **Backend**: `PurchaseRequestController@advance()`
- **State Change**:
  - `current_stage` = 'recommending_approver' (skipped) → 'president'
  - `status` = 'pending'
- **Next**: Request routed to President for executive approval

#### STEP 3: President Reviews and Approves
- **User**: president@pcms.test (President role)
- **Dashboard**: `/president/dashboard`
- **Components Used**: PresDashboard.jsx (now loads real stats) + ExecutiveApprovalQueue.jsx
- **Data Loading**: 
  - Dashboard loads stats from `pcmsApi.purchaseRequests()`
  - Queue loads from `pcmsApi.pendingApprovals()`
- **Action**: Click "Approve" button on request card
- **API Call**: `pcmsApi.advancePurchaseRequest(requestId)`
- **Backend**: `PurchaseRequestController@advance()`
- **State Change**:
  - `current_stage` = 'property_custodian'
  - `status` = 'approved'
- **Next**: Request ready for Property Custodian/OIC for fulfillment

#### STEP 4: Property Custodian/OIC Verifies and Releases
- **User**: oic@pcms.test (OIC role) or Property Custodian
- **Dashboard**: `/oic/dashboard` or `/oic/release-queue`
- **Components Used**: OicDashboard.jsx
- **Data Loading**: `pcmsApi.oicReleaseQueue()` loads approved items
- **Action**: Click "Release now" button
- **API Call**: `pcmsApi.oicRelease('purchase', requestId)`
- **Backend**: `PurchaseRequestController@release()`
- **State Change**:
  - `current_stage` = 'released'
  - `status` = 'released'
  - `released_by` = user ID
  - `released_at` = timestamp
- **Next**: Request ready for PPMO staff processing

#### STEP 5: PPMO Staff Processes Release
- **User**: PPMO Staff (various roles)
- **Dashboard**: `/ppmo/dashboard`
- **Available Pages**:
  - `/ppmo/approved-release-queue` → ApprovedReleaseQueue.jsx (shows released items)
  - `/ppmo/gate-pass-preparation` → GatePassPreparation.jsx (manage gate passes)
  - `/ppmo/receive-deliveries` → ReceiveDeliveries.jsx (receive items)
  - `/ppmo/stock-verification` → StockVerification.jsx (verify inventory)
- **Data Loading**: Each page loads from appropriate API endpoints
- **Process**: 
  - Prepare gate pass
  - Coordinate delivery
  - Receive delivery
  - Update inventory

#### STEP 6: Requester Receives Completion Notification
- **User**: requester@pcms.test (Requester)
- **Dashboard**: `/requester` shows completed request
- **Data**: Request status is 'released' or 'completed'
- **Available**: Gate pass, receipt, delivery confirmation
- **Workflow Complete**: Request cycle is complete

## Roles and Permissions

| Role | Dashboard | Key Actions | API Endpoints Used |
|------|-----------|-------------|-------------------|
| Requester | `/requester` | Create request, view status | `requesterCreatePurchaseRequest()`, `requesterPurchaseRequests()` |
| Department Head | `/department-head/*` | Review, approve, reject | `departmentHeadApprovalQueue()`, `departmentHeadApprove()` |
| President | `/president/*` | Executive approval, reject | `pendingApprovals()`, `advancePurchaseRequest()` |
| OIC / Property Custodian | `/oic/*` | Release items, verify inventory | `oicReleaseQueue()`, `oicRelease()` |
| PPMO Staff | `/ppmo/*` | Process releases, receive items | `ppmoReleaseQueue()`, `fetchGatePasses()` |
| System Admin | `/admin` | User/role management | (not part of request workflow) |

## Workflow Stages (Backend)
```
employee 
  ↓
department_head (Department Head reviews)
  ↓
recommending_approver (skipped if not configured)
  ↓
president (President reviews)
  ↓
property_custodian (OIC/Property Custodian releases)
  ↓
released (Request complete)
```

## API Endpoints Verified

### Request Creation & Management
- ✓ `POST /requester/purchase-requests` - Create request
- ✓ `GET /requester/purchase-requests` - List requester requests
- ✓ `GET /purchase-requests/pending/approvals` - Get requests pending approval (role-filtered)

### Department Head Workflow
- ✓ `GET /department-head/purchase-requests/pending` - List pending approvals
- ✓ `PATCH /department-head/purchase-requests/{id}/advance` - Approve & advance
- ✓ `PATCH /department-head/purchase-requests/{id}/reject` - Reject request

### Executive Workflow
- ✓ `GET /purchase-requests/pending/approvals` - Works for President role
- ✓ `PATCH /purchase-requests/{id}/advance` - Approve (with role:President middleware)
- ✓ `PATCH /purchase-requests/{id}/reject` - Reject (with role:President middleware)

### OIC/Release Workflow
- ✓ `GET /purchase-requests?current_stage=property_custodian` - Get release queue
- ✓ `PATCH /purchase-requests/{id}/release` - Release item (role:Property Custodian)

### Gate Pass Workflow
- ✓ `GET /gate-passes` - List gate passes
- ✓ `PATCH /gate-passes/{id}/approve` - Approve gate pass
- ✓ `PATCH /gate-passes/{id}/release` - Release gate pass
- ✓ `POST /gate-passes/{id}/scan` - Scan/receive gate pass

## Frontend Components Enhanced

### President Dashboard
- ✓ PresDashboard.jsx - Loads real stats and data
- ✓ ExecutiveApprovalQueue.jsx - Loads and displays pending approvals
- ✓ Approve/Reject functionality implemented

### Department Head Pages
- ✓ PendingApprovals.jsx - Loads pending requests for department
- ✓ ApprovalQueue.jsx - Shows all requests with filtering
- ✓ Approve/Reject functionality implemented

### OIC Dashboard
- ✓ OicDashboard.jsx - Already had real data loading
- ✓ Release queue properly implemented
- ✓ Release action fully functional

### PPMO Pages (New)
- ✓ ApprovedReleaseQueue.jsx - Shows approved items ready for release
- ✓ GatePassPreparation.jsx - Manage gate passes
- ✓ ReceiveDeliveries.jsx - Receive and scan deliveries
- ✓ StockVerification.jsx - Verify inventory levels
- ✓ FeaturePage.jsx - Placeholder for remaining features

## Data Persistence

All workflow data flows through the same database tables:
- `purchase_requests` table - Single source of truth
- `current_stage` column - Tracks workflow position
- `status` column - Tracks approval status
- No separate/disconnected data stores
- No local-only mock data

## Role-Based Access Control

### Middleware Enforcement
```php
Route::patch('/purchase-requests/{id}/advance', ...) 
  ->middleware('role:Department Head,President,Property Custodian,CEO');
  
Route::patch('/purchase-requests/{id}/reject', ...) 
  ->middleware('role:Department Head,President,Property Custodian,CEO');
```

### Frontend Route Protection
- React Router conditional routes based on `currentUser.role`
- Only authenticated users can access role-specific dashboards
- Unauthorized access redirects to login or home page

## Audit Trail

Current implementation:
- ✓ `logActivity()` method logs all major actions
- ✓ ActivityLog table captures:
  - Action type
  - User ID
  - Timestamp
  - Request details

TODO (Future):
- Display audit trail in UI
- Show approval chain history
- Display modification requests
- Show rejection reasons

## Notifications

Current implementation:
- Partial: Dashboard status refresh shows users latest state
- Comments removed: Broken notification code removed from `advance()` method

TODO (Future):
- Implement proper notification queue/system
- Send notifications when:
  - Request status changes
  - Action required from user
  - Rejection/modification requests
  - Release completed

## Known Limitations

1. **Modification Requests**: Placeholder only, not implemented in backend
2. **Additional Information Requests**: Placeholder only, not implemented
3. **Notifications**: Status updates work, but active notification system removed (was broken)
4. **PPMO Reports**: Some report pages are placeholders (FeaturePage component)
5. **Recommending Approver Stage**: Defined but not actively used (skipped in workflow)

## Test Credentials

```
System Administrator: admin@pcms.com / Admin123!
Requester: requester@pcms.test / Password123!
Department Head: depthead@pcms.test / Password123!
President: president@pcms.test / Password123!
CEO: ceo@pcms.test / Password123!
OIC: oic@pcms.test / Password123!
PPMO Staff: (need to check UserSeeder)
```

## How to Test

1. Login as Requester
2. Create a purchase request
3. Logout, login as Department Head
4. Approve the request
5. Logout, login as President
6. Approve the request
7. Logout, login as OIC
8. Release the request
9. Logout, login as PPMO Staff
10. Process the release
11. Verify Requester sees completed request

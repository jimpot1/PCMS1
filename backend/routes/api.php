<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\DamageReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\GatePassController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OcrController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplyController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/purchase-requests/{purchaseRequest}/receipt/view', [PurchaseRequestController::class, 'receiptDocument']);

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{source}/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);

    Route::middleware('role:Requester')->prefix('requester')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\RequesterDashboardController::class, 'summary']);
        Route::get('/recommendations', [\App\Http\Controllers\RequesterDashboardController::class, 'recommendationsEndpoint']);
        Route::get('/item-search', [PurchaseRequestController::class, 'itemSearch']);
        Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
        Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
        Route::get('/gate-passes', [GatePassController::class, 'index']);
        Route::post('/gate-passes', [GatePassController::class, 'store']);
        Route::patch('/gate-passes/{gatePass}/return', [GatePassController::class, 'return']);
        Route::get('/transfers', [TransferController::class, 'index']);
    });

    Route::middleware('role:Department Head')->prefix('department-head')->group(function () {
        Route::get('/purchase-requests/pending', [PurchaseRequestController::class, 'pendingApprovals']);
        Route::get('/dashboard', [PurchaseRequestController::class, 'departmentHeadDashboard']);
        Route::patch('/purchase-requests/{purchaseRequest}/advance', [PurchaseRequestController::class, 'advance']);
        Route::patch('/purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject']);
        Route::patch('/purchase-requests/{purchaseRequest}/revision', [PurchaseRequestController::class, 'requestRevision']);
        Route::get('/gate-passes/pending', [GatePassController::class, 'index']);
        Route::patch('/gate-passes/{gatePass}/approve', [GatePassController::class, 'approve']);
        Route::patch('/gate-passes/{gatePass}/reject', [GatePassController::class, 'reject']);
        Route::get('/transfers/pending', [TransferController::class, 'index']);
        Route::patch('/transfers/{transfer}/approve', [TransferController::class, 'approve']);
        Route::patch('/transfers/{transfer}/reject', [TransferController::class, 'reject']);
    });

    Route::apiResource('departments', DepartmentController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::get('/assets/export', [AssetController::class, 'export']);
    Route::get('/assets/statistics', [AssetController::class, 'statistics']);
    Route::get('/assets/{asset}/history', [AssetController::class, 'history']);
    Route::post('/assets/{asset}/restore', [AssetController::class, 'restore']);
    Route::apiResource('assets', AssetController::class);
    Route::get('/transfers/dashboard', [TransferController::class, 'dashboard']);
    Route::get('/transfers/export', [TransferController::class, 'export']);
    Route::get('/transfers/recommendations', [TransferController::class, 'recommendations']);
    Route::apiResource('transfers', TransferController::class);
    Route::patch('/transfers/{transfer}/approve', [TransferController::class, 'approve'])->middleware('role:Department Head,Property Custodian,PPMO Staff,OIC');
    Route::patch('/transfers/{transfer}/reject', [TransferController::class, 'reject'])->middleware('role:Department Head,Property Custodian,PPMO Staff,OIC');
    Route::patch('/transfers/{transfer}/hold', [TransferController::class, 'hold'])->middleware('role:Property Custodian,PPMO Staff,OIC');
    Route::patch('/transfers/{transfer}/revision', [TransferController::class, 'requestRevision'])->middleware('role:Department Head,Property Custodian,PPMO Staff,OIC');
    Route::post('/transfers/{transfer}/execute', [TransferController::class, 'execute'])->middleware('role:Property Custodian,PPMO Staff,OIC');
    Route::apiResource('maintenance', MaintenanceController::class);
    Route::get('/maintenance-predictions', [MaintenanceController::class, 'predictions']);
    Route::apiResource('damage-reports', DamageReportController::class)->parameters(['damage-reports' => 'report']);
    Route::apiResource('supplies', SupplyController::class);
    Route::post('/stock-movements', [StockMovementController::class, 'store']);
    Route::get('/stock-movements', [StockMovementController::class, 'index']);
    Route::get('/stock-movements/{movement}', [StockMovementController::class, 'show']);
    Route::apiResource('purchase-requests', PurchaseRequestController::class);
    Route::get('/supply-requests/queue', [PurchaseRequestController::class, 'supplyQueue'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::get('/purchase-requests/walk-in/requesters', [PurchaseRequestController::class, 'walkInRequesterOptions'])->middleware('role:System Administrator,PPMO Staff');
    Route::get('/purchase-requests/walk-in/item-search', [PurchaseRequestController::class, 'itemSearch'])->middleware('role:System Administrator,PPMO Staff');
    Route::post('/purchase-requests/walk-in', [PurchaseRequestController::class, 'storeWalkIn'])->middleware('role:System Administrator,PPMO Staff');
    Route::patch('/purchase-requests/{purchaseRequest}/resubmit', [PurchaseRequestController::class, 'resubmit'])->middleware('role:Requester');
    Route::patch('/purchase-requests/{purchaseRequest}/revision', [PurchaseRequestController::class, 'requestRevision'])->middleware('role:Department Head,Recommending Approver,President,CEO');
    Route::get('/purchase-requests/pending/approvals', [PurchaseRequestController::class, 'pendingApprovals']);
    Route::post('/purchase-requests/{purchaseRequest}/walk-in-approval-document', [PurchaseRequestController::class, 'uploadWalkInApprovalDocument'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::patch('/purchase-requests/{purchaseRequest}/walk-in-details', [PurchaseRequestController::class, 'updateWalkInDetails'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::patch('/purchase-requests/{purchaseRequest}/verify-walk-in-approval', [PurchaseRequestController::class, 'verifyWalkInApproval'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    // Recommending Approver role-specific dashboard
    Route::get('/recommending-approver/dashboard', [PurchaseRequestController::class, 'recommendingDashboard'])->middleware('role:Recommending Approver');
    Route::get('/recommending-approver/history', [PurchaseRequestController::class, 'recommendingHistory'])->middleware('role:Recommending Approver');
    Route::patch('/purchase-requests/{purchaseRequest}/advance', [PurchaseRequestController::class, 'advance'])->middleware('role:Department Head,Recommending Approver,President,Property Custodian,OIC,CEO');
    Route::patch('/purchase-requests/{purchaseRequest}/reject', [PurchaseRequestController::class, 'reject'])->middleware('role:Department Head,Recommending Approver,President,Property Custodian,OIC,CEO');
    Route::patch('/purchase-requests/{purchaseRequest}/release', [PurchaseRequestController::class, 'release'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::patch('/purchase-requests/{purchaseRequest}/supply-release', [PurchaseRequestController::class, 'supplyRelease'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::get('/purchase-requests/{purchaseRequest}/receipt', [PurchaseRequestController::class, 'receipt'])->middleware('role:System Administrator,PPMO Staff,Property Custodian,OIC');
    Route::post('/gate-passes/walk-in', [GatePassController::class, 'storeWalkIn'])->middleware('role:System Administrator,PPMO Staff');
    Route::apiResource('gate-passes', GatePassController::class);
    Route::patch('/gate-passes/{gatePass}/approve', [GatePassController::class, 'approve'])->middleware('role:Department Head,OIC,Property Custodian,PPMO Staff');
    Route::patch('/gate-passes/{gatePass}/reject', [GatePassController::class, 'reject'])->middleware('role:Department Head,OIC,Property Custodian,PPMO Staff');
    Route::patch('/gate-passes/{gatePass}/release', [GatePassController::class, 'release'])->middleware('role:Property Custodian,OIC');
    Route::patch('/gate-passes/{gatePass}/return', [GatePassController::class, 'return']);
    Route::post('/gate-passes/{gatePass}/scan', [GatePassController::class, 'scan']);
    Route::apiResource('audits', AuditController::class);
    Route::post('/audits/{audit}/scan', [AuditController::class, 'scan'])->middleware('role:PPMO Staff,OIC');
    Route::patch('/audits/{audit}/complete', [AuditController::class, 'complete'])->middleware('role:PPMO Staff,OIC');
    Route::get('/assignments/dashboard', [\App\Http\Controllers\AssetAssignmentController::class, 'dashboard']);
    Route::get('/assignments/export', [\App\Http\Controllers\AssetAssignmentController::class, 'export']);
    Route::get('/assignments/recommendations', [\App\Http\Controllers\AssetAssignmentController::class, 'recommendations']);
    Route::get('/assignments/qr/{id}', [\App\Http\Controllers\AssetAssignmentController::class, 'qrDetails']);
    Route::get('/assignments/employee-profile/{userId}', [\App\Http\Controllers\AssetAssignmentController::class, 'employeeProfile']);
    Route::get('/assignment-users', [\App\Http\Controllers\AssetAssignmentController::class, 'assignees']);
    Route::get('/assignments/clearance-check/{userId}', [\App\Http\Controllers\AssetAssignmentController::class, 'clearanceCheck']);
    Route::patch('/assignments/{id}/accept', [\App\Http\Controllers\AssetAssignmentController::class, 'accept']);
    Route::patch('/assignments/{id}/cancel', [\App\Http\Controllers\AssetAssignmentController::class, 'cancel']);
    Route::patch('/assignments/{id}/return', [\App\Http\Controllers\AssetAssignmentController::class, 'returnAssignment']);
    Route::apiResource('assignments', \App\Http\Controllers\AssetAssignmentController::class);
    Route::apiResource('users', UserController::class)->middleware('role:System Administrator');

    Route::get('/ocr/history', [OcrController::class, 'history'])->middleware('role:System Administrator,Property Custodian,PPMO Staff');
    Route::post('/ocr/scan', [OcrController::class, 'scan'])->middleware('role:System Administrator,Property Custodian,PPMO Staff');
    Route::get('/inventory-monitoring/summary', [AnomalyController::class, 'summary'])->middleware('role:System Administrator,Property Custodian,PPMO Staff,OIC');
    Route::get('/inventory-monitoring/anomalies', [AnomalyController::class, 'index'])->middleware('role:System Administrator,Property Custodian,PPMO Staff,OIC');
    Route::patch('/inventory-monitoring/anomalies/{id}/resolve', [AnomalyController::class, 'resolve'])->middleware('role:System Administrator,Property Custodian,PPMO Staff,OIC');
    Route::post('/inventory-monitoring/anomalies/{id}/explain', [AnomalyController::class, 'explain'])->middleware('role:System Administrator,Property Custodian,PPMO Staff,OIC');
    Route::post('/inventory-monitoring/analyze', [AnomalyController::class, 'analyze'])->middleware('role:System Administrator,Property Custodian,PPMO Staff');
    Route::get('/reports/{type}', [ReportController::class, 'export']);
});

// Authentication routes
use App\Http\Controllers\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth');
Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('auth');
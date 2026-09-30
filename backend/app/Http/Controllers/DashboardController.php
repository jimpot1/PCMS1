<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetTransfer;
use App\Models\DamageReport;
use App\Models\GatePass;
use App\Models\MaintenanceRecord;
use App\Models\PhysicalAudit;
use App\Models\PurchaseRequest;
use App\Services\ActivityLogFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController
{
    public function ppmoMetrics(): JsonResponse
    {
        $today = now()->startOfDay();
        $returnWindowEnd = $today->copy()->addDays(7)->endOfDay();
        $activeAssignments = AssetAssignment::query()->where('status', 'active');

        $receivingQuery = PurchaseRequest::query()
            ->with('department')
            ->where('request_type', 'purchase_order')
            ->where('status', 'approved')
            ->whereIn('current_stage', ['property_custodian', 'ppmo_staff'])
            ->where(function ($query) {
                $query->whereNull('procurement_status')
                    ->orWhereNotIn('procurement_status', ['ready_to_release', 'completed']);
            });

        $releaseActions = [
            'purchase_request_released',
            'supply_request_partially_released',
            'gate_pass_released',
        ];

        $recentOperationActions = [
            ...$releaseActions,
            'asset_returned',
            'gate_pass_returned',
            'po_stock_received',
            'po_qc_completed',
            'audit_completed',
            'anomaly_resolved',
        ];

        $activityStart = now()->subDays(6)->startOfDay();
        $releaseCounts = DB::table('activity_logs')
            ->whereIn('action', $releaseActions)
            ->whereBetween('created_at', [$activityStart, now()->endOfDay()])
            ->selectRaw('DATE(created_at) as activity_date, COUNT(*) as total')
            ->groupBy('activity_date')
            ->pluck('total', 'activity_date');

        $releaseActivity = collect(range(6, 0))
            ->map(function (int $daysAgo) use ($releaseCounts) {
                $date = now()->subDays($daysAgo);
                $dateKey = $date->toDateString();

                return [
                    'date' => $dateKey,
                    'label' => $date->format('D'),
                    'releases' => (int) ($releaseCounts[$dateKey] ?? 0),
                ];
            })
            ->values();

        $recentOperations = DB::table('activity_logs')
            ->whereIn('action', $recentOperationActions)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'action', 'payload', 'status', 'created_at'])
            ->map(function ($row) {
                $payload = json_decode($row->payload ?? '{}', true) ?: [];
                $status = match ($row->action) {
                    'supply_request_partially_released' => 'Partial release',
                    'po_qc_completed' => match ($payload['decision'] ?? null) {
                        'passed' => 'QC passed',
                        'failed' => 'QC failed',
                        'hold' => 'QC on hold',
                        default => 'QC completed',
                    },
                    'anomaly_resolved' => 'Resolved',
                    default => 'Completed',
                };

                return [
                    'id' => $row->id,
                    'action' => $row->action,
                    'text' => ActivityLogFormatter::format($row->action, $payload),
                    'status' => $status,
                    'time' => $row->created_at,
                ];
            })
            ->values();

        $receivingActions = (clone $receivingQuery)
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn (PurchaseRequest $purchaseRequest) => [
                'id' => $purchaseRequest->id,
                'request_number' => $purchaseRequest->request_number,
                'department' => $purchaseRequest->department?->name ?? $purchaseRequest->department_name ?? 'Unassigned',
                'procurement_status' => $purchaseRequest->procurement_status,
                'qc_status' => $purchaseRequest->qc_status,
                'updated_at' => $purchaseRequest->updated_at,
            ])
            ->values();

        return response()->json([
            'returns_due' => (clone $activeAssignments)
                ->whereNotNull('due_date')
                ->whereBetween('due_date', [$today->toDateString(), $returnWindowEnd->toDateString()])
                ->count(),
            'overdue_returns' => (clone $activeAssignments)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', $today->toDateString())
                ->count(),
            'receiving_action_count' => (clone $receivingQuery)->count(),
            'receiving_actions' => $receivingActions,
            'open_anomaly_alerts' => DB::table('anomaly_alerts')
                ->where('status', '!=', 'resolved')
                ->count(),
            'release_activity' => $releaseActivity,
            'recent_operations' => $recentOperations,
        ]);
    }

    public function __invoke(Request $request): JsonResponse
    {
        $pendingRequests = PurchaseRequest::where('status', 'pending')->count();
        $pendingTransfers = AssetTransfer::where('status', 'pending')->count();
        $pendingGatePasses = GatePass::where('status', 'pending')->count();
        $pendingDamageReports = DamageReport::whereIn('status', ['submitted', 'in_progress'])->count();
        $openAnomalies = DB::table('anomaly_alerts')->where('status', 'open')->count();

        $nextAudit = PhysicalAudit::where('status', '!=', 'completed')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->first();

        return response()->json([
            'metrics' => [
                'total_assets' => Asset::count(),
                'total_assets_this_month' => Asset::where('created_at', '>=', now()->startOfMonth())->count(),
                'available_assets' => Asset::where('status', 'available')->count(),
                'assigned_assets' => Asset::where('status', 'assigned')->count(),
                'assigned_this_month' => DB::table('asset_assignments')->where('created_at', '>=', now()->startOfMonth())->count(),
                'damaged_assets' => Asset::where('condition', 'damaged')->count(),
                'damaged_reports_pending' => $pendingDamageReports,
                'under_maintenance' => Asset::where('status', 'maintenance')->count(),
                'pending_requests' => $pendingRequests,
                'pending_repairs' => $pendingDamageReports,
                'pending_transfers' => $pendingTransfers,
                'pending_approvals' => $pendingRequests + $pendingTransfers + $pendingGatePasses,
                'upcoming_audits' => PhysicalAudit::where('status', '!=', 'completed')
                    ->where('scheduled_at', '>=', now())
                    ->count(),
                'next_audit_area' => $nextAudit->area ?? null,
                'inventory_alerts' => $openAnomalies,
            ],
            'status_breakdown' => $this->statusBreakdown(),
            'monthly_analytics' => $this->monthlyAnalytics(),
            'recent_activities' => $this->recentActivities($request->user()->role),
            'anomaly_preview' => $this->anomalyPreview(),
        ]);
    }

    protected function statusBreakdown(): array
    {
        $colors = [
            'assigned' => '#2563EB',
            'available' => '#10B981',
            'maintenance' => '#F59E0B',
            'damaged' => '#EF4444',
            'issued' => '#8B5CF6',
            'transferred' => '#0EA5E9',
            'disposed' => '#6B7280',
        ];

        return Asset::selectRaw('status, count(*) as value')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'name' => ucfirst($row->status),
                'value' => (int) $row->value,
                'color' => $colors[$row->status] ?? '#94A3B8',
            ])
            ->values()
            ->all();
    }

    protected function monthlyAnalytics(): array
    {
        return collect(range(5, 0))
            ->map(function ($monthsAgo) {
                $start = now()->subMonths($monthsAgo)->startOfMonth();
                $end = $start->copy()->endOfMonth();

                return [
                    'month' => $start->format('M'),
                    'assets' => Asset::whereBetween('created_at', [$start, $end])->count(),
                    'repairs' => MaintenanceRecord::whereBetween('created_at', [$start, $end])->count()
                        + DamageReport::whereBetween('created_at', [$start, $end])->count(),
                    'anomalies' => DB::table('anomaly_alerts')->whereBetween('created_at', [$start, $end])->count(),
                ];
            })
            ->values()
            ->all();
    }

    protected function recentActivities(string $viewerRole): array
    {
        $activityQuery = DB::table('activity_logs');
        if ($viewerRole !== 'System Administrator') {
            $activityQuery->whereNotIn('action', ['user_logged_in', 'user_logged_out']);
        }

        return $activityQuery
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['action', 'payload', 'created_at'])
            ->map(function ($row) {
                $payload = json_decode($row->payload ?? '{}', true) ?: [];

                return [
                    'text' => ActivityLogFormatter::format($row->action, $payload),
                    'time' => $row->created_at,
                ];
            })
            ->values()
            ->all();
    }

    protected function anomalyPreview(): array
    {
        return DB::table('anomaly_alerts')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get(['id', 'source_type', 'reason', 'recommended_action', 'priority', 'risk_score'])
            ->map(fn ($row) => [
                'id' => $row->id,
                'title' => ucwords(str_replace('_', ' ', $row->source_type)),
                'reason' => $row->reason,
                'action' => $row->recommended_action,
                'priority' => ucfirst($row->priority),
                'riskScore' => (int) round($row->risk_score * 10),
            ])
            ->values()
            ->all();
    }
}

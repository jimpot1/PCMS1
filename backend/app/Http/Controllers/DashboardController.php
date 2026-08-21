<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\DamageReport;
use App\Models\GatePass;
use App\Models\MaintenanceRecord;
use App\Models\PhysicalAudit;
use App\Models\PurchaseRequest;
use App\Services\ActivityLogFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController
{
    public function __invoke(): JsonResponse
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
            'recent_activities' => $this->recentActivities(),
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

    protected function recentActivities(): array
    {
        return DB::table('activity_logs')
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

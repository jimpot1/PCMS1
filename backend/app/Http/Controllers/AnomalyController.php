<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\StockMovement;
use App\Services\AnomalyDetectionService;
use App\Services\LlmAnomalyExplanationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnomalyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $canViewAiExplanation = $this->canUseAiExplanation($request);
        $columns = [
            'id',
            'source_type',
            'source_id',
            'risk_score',
            'priority',
            'reason',
            'recommended_action',
            'status',
            'created_at',
            'updated_at',
        ];

        if ($canViewAiExplanation) {
            $columns = array_merge($columns, [
                'analysis_context',
                'ai_explanation',
                'ai_explanation_status',
                'ai_explanation_generated_at',
            ]);
        }

        $anomalies = DB::table('anomaly_alerts')
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->source_type, fn ($query, $value) => $query->where('source_type', $value))
            ->when($request->priority, fn ($query, $value) => $query->where('priority', $value))
            ->orderBy('created_at', 'desc')
            ->select($columns)
            ->paginate($request->integer('per_page', 15));

        if ($canViewAiExplanation) {
            $anomalies->getCollection()->transform(fn ($anomaly) => $this->withMonitoringDetails($anomaly));
        } else {
            $anomalies->getCollection()->transform(fn ($anomaly) => $this->withPublicMonitoringDetails($anomaly));
        }

        return response()->json($anomalies);
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json([
            'total_alerts' => DB::table('anomaly_alerts')->count(),
            'high_risk' => DB::table('anomaly_alerts')->where('priority', 'high')->count(),
            'medium_risk' => DB::table('anomaly_alerts')->where('priority', 'medium')->count(),
            'low_stock' => DB::table('anomaly_alerts')->where('source_type', 'low_stock')->count(),
            'open_unresolved' => DB::table('anomaly_alerts')->where('status', '!=', 'resolved')->count(),
        ]);
    }

    public function resolve(Request $request, $id): JsonResponse
    {
        $anomaly = DB::table('anomaly_alerts')->find($id);

        if (!$anomaly) {
            return response()->json(['message' => 'Anomaly not found.'], 404);
        }

        $validated = $request->validate([
            'apply_correction' => ['sometimes', 'boolean'],
            'corrected_department_id' => ['required_if:apply_correction,true', 'nullable', 'exists:departments,id'],
        ]);

        DB::table('anomaly_alerts')
            ->where('id', $id)
            ->update([
                'status' => 'resolved',
                'updated_at' => now(),
            ]);

        $correctionApplied = false;
        if (($validated['apply_correction'] ?? false) && $anomaly->source_type === 'untracked_transfer') {
            $asset = Asset::find($anomaly->source_id);
            if ($asset) {
                $asset->update(['department_id' => $validated['corrected_department_id']]);
                $correctionApplied = true;
            }
        }

        $this->logActivity('anomaly_resolved', ['anomaly_id' => $id, 'correction_applied' => $correctionApplied], $request);

        return response()->json([
            'message' => 'Anomaly marked as resolved.',
            'correction_applied' => $correctionApplied,
        ]);
    }

    /**
     * Re-run quantity-anomaly detection against the latest outbound stock
     * movement for every department. This is the same z-score check that
     * already runs automatically on every stock-out; this endpoint just
     * lets staff manually trigger a fresh sweep on demand.
     */
    public function analyze(Request $request): JsonResponse
    {
        $result = self::runAnalysis();

        $this->logActivity('anomaly_analysis_run', [
            'pairs_checked' => $result['pairs_checked'],
            'new_alerts' => $result['new_alerts'],
        ], $request);

        return response()->json([
            'message' => $result['new_alerts'] > 0
                ? "Analysis complete. {$result['new_alerts']} new anomaly(ies) flagged."
                : 'Analysis complete. No new anomalies found.',
            'pairs_checked' => $result['pairs_checked'],
            'new_alerts' => $result['new_alerts'],
        ]);
    }

    public function explain(Request $request, $id, LlmAnomalyExplanationService $explanations): JsonResponse
    {
        $anomaly = DB::table('anomaly_alerts')->find($id);

        if (! $anomaly) {
            return response()->json(['message' => 'Anomaly not found.'], 404);
        }

        if ($anomaly->source_type !== 'quantity_anomaly') {
            return response()->json(['message' => 'AI explanations are only available for supplies quantity anomalies.'], 422);
        }

        $explanations->generateForAnomalyId((int) $id, true);

        $updated = DB::table('anomaly_alerts')
            ->where('id', $id)
            ->first([
                'id',
                'ai_explanation',
                'ai_explanation_status',
                'ai_explanation_generated_at',
            ]);

        $this->logActivity('anomaly_ai_explanation_requested', ['anomaly_id' => $id], $request);

        return response()->json([
            'message' => $updated->ai_explanation_status === 'generated'
                ? 'AI explanation generated.'
                : 'AI explanation could not be generated right now. Please try again later.',
            'anomaly' => $updated,
        ], $updated->ai_explanation_status === 'generated' ? 200 : 503);
    }

    /**
     * Core sweep logic, shared by the manual "Run Analysis" endpoint and the
     * scheduled console command. Re-checks the latest outbound movement for
     * every (department, supply) pair for a quantity anomaly, plus repeat
     * repairs and upcoming maintenance across all assets.
     */
    public static function runAnalysis(): array
    {
        $beforeCount = DB::table('anomaly_alerts')->where('status', 'open')->count();

        $pairs = StockMovement::where('movement_type', 'out')
            ->whereNotNull('department_id')
            ->whereNotNull('supply_id')
            ->select('department_id', 'supply_id')
            ->distinct()
            ->get();

        foreach ($pairs as $pair) {
            $latest = StockMovement::where('department_id', $pair->department_id)
                ->where('supply_id', $pair->supply_id)
                ->where('movement_type', 'out')
                ->latest('id')
                ->first();

            if ($latest) {
                $anomalyId = AnomalyDetectionService::detectQuantityAnomaly(
                    $pair->department_id,
                    $pair->supply_id,
                    $latest->quantity,
                    $latest->id
                );

                if ($anomalyId) {
                    app(LlmAnomalyExplanationService::class)->generateForAnomalyId($anomalyId);
                }
            }
        }

        $assetIds = \App\Models\Asset::pluck('id');
        foreach ($assetIds as $assetId) {
            \App\Services\RepairFrequencyService::checkThreshold($assetId);
        }

        $newAlerts = DB::table('anomaly_alerts')->where('status', 'open')->count() - $beforeCount;

        return [
            'pairs_checked' => $pairs->count(),
            'new_alerts' => $newAlerts,
        ];
    }

    protected function logActivity(string $action, array $data, Request $request): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                ...$data,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function canUseAiExplanation(Request $request): bool
    {
        return in_array($request->user()?->role, [
            'System Administrator',
            'Property Custodian',
            'PPMO Staff',
            'OIC',
        ], true);
    }

    protected function withAnalysisContext(object $anomaly): object
    {
        $context = json_decode($anomaly->analysis_context ?? '', true);

        if (! is_array($context)) {
            return $anomaly;
        }

        $anomaly->supply = $context['supply_name'] ?? null;
        $anomaly->department = $context['department_name'] ?? null;
        $anomaly->quantity = $context['current_quantity'] ?? null;
        $anomaly->historical_average = $context['historical_average'] ?? null;
        $anomaly->historical_stddev = $context['historical_stddev'] ?? null;
        $anomaly->historical_quantities = $context['historical_quantities'] ?? $this->historicalQuantitiesForContext($context);
        $anomaly->z_score = $context['z_score'] ?? null;
        $anomaly->similar_recent_spikes = $context['similar_recent_spikes'] ?? null;
        $anomaly->anomaly_threshold = $context['threshold'] ?? null;
        unset($anomaly->analysis_context);

        return $anomaly;
    }

    protected function withMonitoringDetails(object $anomaly): object
    {
        if ($anomaly->source_type === 'quantity_anomaly') {
            return $this->withAnalysisContext($anomaly);
        }

        return $this->withPublicMonitoringDetails($anomaly);
    }

    protected function withPublicMonitoringDetails(object $anomaly): object
    {
        if ($anomaly->source_type === 'low_stock') {
            $supply = DB::table('supplies')->find($anomaly->source_id);

            if ($supply) {
                $anomaly->supply = $supply->name;
                $anomaly->current_stock = (int) $supply->stock;
                $anomaly->minimum_stock = (int) $supply->minimum_stock;
            }
        }

        return $anomaly;
    }

    protected function historicalQuantitiesForContext(array $context): array
    {
        $departmentId = $context['department_id'] ?? null;
        $supplyId = $context['supply_id'] ?? null;

        if (! $departmentId || ! $supplyId) {
            return [];
        }

        return StockMovement::where('department_id', $departmentId)
            ->where('supply_id', $supplyId)
            ->where('movement_type', 'out')
            ->orderByDesc('id')
            ->limit(12)
            ->pluck('quantity')
            ->reverse()
            ->map(fn ($quantity) => (int) $quantity)
            ->values()
            ->all();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Supply;
use App\Models\StockMovement;
use App\Services\AnomalyDetectionService;   // ADD THIS LINE
use App\Services\LlmAnomalyExplanationService;
use App\Services\LowStockRequisitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'supply_id' => ['required', 'exists:supplies,id'],
        'movement_type' => ['required', 'in:in,out'],
        'quantity' => ['required', 'integer', 'min:1'],
        'department_id' => ['required', 'exists:departments,id'],
        'notes' => ['nullable', 'string'],
    ]);

    try {
        DB::beginTransaction();

        // Lock the supply row first so the stock check below is race-safe
        $supply = Supply::lockForUpdate()->find($validated['supply_id']);
if (! $supply) {
    DB::rollBack();

    return response()->json(['message' => 'Supply not found.'], 404);
}
        if ($validated['department_id'] && (int) $supply->department_id !== (int) $validated['department_id']) {
            DB::rollBack();

            return response()->json([
                'message' => 'The selected supply does not belong to the selected department.',
            ], 422);
        }
        // Guard against stock-out driving stock negative
        if ($validated['movement_type'] === 'out' && $supply->stock < $validated['quantity']) {
            DB::rollBack();

            return response()->json([
                'message' => "Insufficient stock. Only {$supply->stock} unit(s) available.",
            ], 422);
        }

        // Create stock movement record
        $movement = StockMovement::create([
            'supply_id' => $validated['supply_id'],
            'movement_type' => $validated['movement_type'],
            'quantity' => $validated['quantity'],
            'department_id' => $validated['department_id'] ?? null,
            'requested_by' => $request->user()?->id,
            'issued_by' => $request->user()?->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update supply stock atomically
        $quantityChange = $validated['movement_type'] === 'in'
            ? $validated['quantity']
            : -$validated['quantity'];

        $supply->update(['stock' => $supply->stock + $quantityChange]);
        $supply->refresh();

        // Check if stock is below minimum (skip if already flagged and still open)
        if ($supply->stock <= $supply->minimum_stock) {
            $alreadyFlagged = DB::table('anomaly_alerts')
                ->where('source_type', 'low_stock')
                ->where('source_id', (string) $supply->id)
                ->where('status', 'open')
                ->exists();

            if (! $alreadyFlagged) {
                DB::table('anomaly_alerts')->insert([
                    'source_type' => 'low_stock',
                    'source_id' => (string) $supply->id,
                    'risk_score' => 8.5,
                    'priority' => 'high',
                    'reason' => "{$supply->name} is below minimum stock ({$supply->stock}/{$supply->minimum_stock})",
                    'recommended_action' => 'Reorder supply immediately',
                    'status' => 'open',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } else {
            $this->resolveStaleLowStockAlert($supply);
        }

        app(LowStockRequisitionService::class)->sync($supply);

        // Flag quantity anomalies for outbound department requests (Story 27)
        $quantityAnomalyId = null;

        if ($validated['movement_type'] === 'out' && $validated['department_id']) {
            $quantityAnomalyId = AnomalyDetectionService::detectQuantityAnomaly(
                $validated['department_id'],
                  $validated['supply_id'],
                $validated['quantity'],
                $movement->id
            );
        }

        DB::commit();

        if ($quantityAnomalyId) {
            app(LlmAnomalyExplanationService::class)->generateForAnomalyId($quantityAnomalyId);
        }

        return response()->json($movement->fresh()->load('supply', 'department'), 201);
 } catch (\Throwable $e) {
    DB::rollBack();
    throw $e;
}
}

    protected function resolveStaleLowStockAlert(Supply $supply): void
    {
        DB::table('anomaly_alerts')
            ->where('source_type', 'low_stock')
            ->where('source_id', (string) $supply->id)
            ->where('status', 'open')
            ->update([
                'status' => 'resolved',
                'recommended_action' => 'Stock level is back above the configured minimum.',
                'updated_at' => now(),
            ]);
    }

    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::query()
            ->when($request->supply_id, fn ($query, $value) => $query->where('supply_id', $value))
            ->when($request->department_id, fn ($query, $value) => $query->where('department_id', $value))
            ->when($request->movement_type, fn ($query, $value) => $query->where('movement_type', $value))
            ->with('supply', 'department')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($movements);
    }

    public function show(StockMovement $movement): JsonResponse
    {
        return response()->json($movement->load('supply', 'department'));
    }
}

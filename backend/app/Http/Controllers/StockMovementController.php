<?php

namespace App\Http\Controllers;

use App\Models\Supply;
use App\Models\StockMovement;
use App\Models\User;
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
        'movement_type' => ['required', 'in:in,out,write_off'],
        'quantity' => ['required', 'integer', 'min:1'],
        'department_id' => ['required', 'exists:departments,id'],
        'write_off_category' => ['required_if:movement_type,write_off', 'nullable', 'in:damaged,expired,lost,unusable,other'],
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
        if (in_array($validated['movement_type'], ['out', 'write_off'], true) && $supply->stock < $validated['quantity']) {
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
            'write_off_category' => $validated['write_off_category'] ?? null,
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

        DB::table('activity_logs')->insert([
            'action' => $validated['movement_type'] === 'write_off' ? 'supply_write_off' : 'stock_movement_recorded',
            'payload' => json_encode([
                'supply_id' => $supply->id,
                'movement_id' => $movement->id,
                'movement_type' => $validated['movement_type'],
                'quantity' => $validated['quantity'],
                'write_off_category' => $validated['write_off_category'] ?? null,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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

    public function supplyHistory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);
        $departmentId = (int) $validated['department_id'];
        $limit = (int) ($validated['per_page'] ?? 100);

        $movements = StockMovement::query()
            ->where('department_id', $departmentId)
            ->whereIn('movement_type', ['in', 'write_off'])
            ->with(['supply:id,name,sku,unit', 'department:id,name'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $actorIds = $movements
            ->flatMap(fn (StockMovement $movement) => [$movement->issued_by, $movement->requested_by])
            ->filter()
            ->unique()
            ->values();
        $actors = $actorIds->isEmpty()
            ? collect()
            : User::query()->whereIn('id', $actorIds)->get(['id', 'full_name', 'first_name', 'last_name', 'email'])->keyBy('id');

        $movementHistory = $movements->map(function (StockMovement $movement) use ($actors) {
            $actor = $actors->get($movement->issued_by ?: $movement->requested_by);
            $actorName = $actor?->full_name
                ?: trim(implode(' ', array_filter([$actor?->first_name, $actor?->last_name])))
                ?: $actor?->email;

            return [
                'id' => 'movement-' . $movement->id,
                'type' => $movement->movement_type === 'write_off' ? 'write_off' : 'stock_in',
                'supply_name' => $movement->supply?->name ?? 'Deleted supply',
                'sku' => $movement->supply?->sku,
                'quantity' => $movement->quantity,
                'unit' => $movement->supply?->unit,
                'department_name' => $movement->department?->name,
                'category' => $movement->write_off_category,
                'notes' => $movement->notes,
                'performed_by' => $actorName ?: 'Unknown user',
                'created_at' => $movement->created_at,
            ];
        });

        $creationLogs = DB::table('activity_logs')
            ->where('action', 'supply_created')
            ->orderByDesc('created_at')
            ->get(['id', 'payload', 'created_at']);
        $creationPayloads = $creationLogs->mapWithKeys(function ($log) {
            $payload = is_array($log->payload)
                ? $log->payload
                : json_decode((string) $log->payload, true);

            return [$log->id => is_array($payload) ? $payload : []];
        });
        $supplyIds = $creationPayloads
            ->pluck('supply_id')
            ->filter()
            ->unique()
            ->values();
        $supplies = $supplyIds->isEmpty()
            ? collect()
            : Supply::query()
                ->with('department:id,name')
                ->whereIn('id', $supplyIds)
                ->get(['id', 'name', 'sku', 'unit', 'department_id'])
                ->keyBy('id');

        $createdHistory = $creationLogs
            ->map(function ($log) use ($creationPayloads, $supplies, $departmentId) {
                $payload = $creationPayloads->get($log->id, []);
                $supply = $supplies->get($payload['supply_id'] ?? null);
                $recordDepartmentId = $payload['department_id'] ?? $supply?->department_id;

                if ((int) $recordDepartmentId !== $departmentId) {
                    return null;
                }

                return [
                    'id' => 'created-' . $log->id,
                    'type' => 'added',
                    'supply_name' => $payload['name'] ?? $supply?->name ?? 'Supply',
                    'sku' => $payload['sku'] ?? $supply?->sku,
                    'quantity' => $payload['initial_quantity'] ?? $payload['quantity'] ?? null,
                    'unit' => $payload['unit'] ?? $supply?->unit,
                    'department_name' => $payload['department_name'] ?? $supply?->department?->name,
                    'category' => $payload['category'] ?? null,
                    'notes' => $payload['description'] ?? null,
                    'performed_by' => $payload['user_name'] ?? $payload['user'] ?? 'Unknown user',
                    'created_at' => $log->created_at,
                ];
            })
            ->filter()
            ->take($limit);

        $history = $createdHistory
            ->concat($movementHistory)
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();

        return response()->json([
            'data' => $history,
            'per_page' => $limit,
        ]);
    }
}

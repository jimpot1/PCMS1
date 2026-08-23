<?php

namespace App\Http\Controllers;

use App\Models\Supply;
use App\Services\LowStockRequisitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplyController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Supply::class, 'supply');
    }

    public function index(Request $request): JsonResponse
    {
        // Supplies are department-owned inventory.  A list without a department
        // must never become a "general" inventory list.
        $departmentId = $request->integer('department_id');

        $supplies = Supply::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'ilike', "%{$search}%")
                        ->orWhere('sku', 'ilike', "%{$search}%");
                });
            })
            ->when($request->category, fn ($query, $value) => $query->where('category', $value))
            ->when(
                $departmentId,
                fn ($query) => $query->where('department_id', $departmentId),
                fn ($query) => $query->whereRaw('1 = 0'),
            )
            ->with('department')
            ->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_order', 'desc'))
            ->paginate($request->integer('per_page', 15));

        return response()->json($supplies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => ['nullable', 'string', 'max:40', 'unique:supplies,sku'],
            'name' => ['required', 'string', 'max:160'],
            'unit' => ['required', 'string', 'max:40'],
            'category' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'stock' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'expiration_date' => ['nullable', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'department_id' => ['required', 'exists:departments,id'],
        ]);

        $validated['sku'] = $validated['sku'] ?? $this->generateSku();
        $supply = Supply::create($validated);
        $this->syncLowStockAlert($supply);
        app(LowStockRequisitionService::class)->sync($supply);
        $this->logActivity('supply_created', $supply, $request);

        return response()->json($supply, 201);
    }

    public function show(Supply $supply): JsonResponse
    {
        return response()->json($supply->load('department', 'stockMovements'));
    }

    public function update(Request $request, Supply $supply): JsonResponse
    {
        $validated = $request->validate([
            'sku' => ['sometimes', 'string', 'max:40', 'unique:supplies,sku,' . $supply->id],
            'name' => ['sometimes', 'string', 'max:160'],
            'unit' => ['sometimes', 'string', 'max:40'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'minimum_stock' => ['sometimes', 'integer', 'min:0'],
            'unit_price' => ['sometimes', 'numeric', 'min:0'],
            'expiration_date' => ['sometimes', 'nullable', 'date'],
            'supplier_id' => ['sometimes', 'nullable', 'exists:suppliers,id'],
            'department_id' => ['sometimes', 'required', 'exists:departments,id'],
        ]);

        $supply->update($validated);
        $supply = $supply->fresh();
        $this->syncLowStockAlert($supply);
        app(LowStockRequisitionService::class)->sync($supply);
        $this->logActivity('supply_updated', $supply, $request);

        return response()->json($supply->fresh());
    }

   public function destroy(Request $request, Supply $supply): JsonResponse
    {
        $supply->delete();
        $this->logActivity('supply_deleted', $supply, $request);

        return response()->json(['message' => 'Supply deleted.']);
    }
    protected function logActivity(string $action, Supply $supply, Request $request): void
    {
        \Illuminate\Support\Facades\DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'supply_id' => $supply->id,
                'sku' => $supply->sku,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function generateSku(): string
    {
        do {
            $sku = sprintf('SUP-%s-%06d', now()->format('Y'), Supply::max('id') + 1);
        } while (Supply::where('sku', $sku)->exists());

        return $sku;
    }

    protected function syncLowStockAlert(Supply $supply): void
    {
        if ((int) $supply->stock <= (int) $supply->minimum_stock) {
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

            return;
        }

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
}

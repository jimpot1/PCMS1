<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRecord;
use App\Services\RepairFrequencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaintenanceController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(MaintenanceRecord::class, 'record');
    }

    public function index(Request $request): JsonResponse
    {
        $records = MaintenanceRecord::query()
            ->with('asset')
            ->when($request->asset_id, fn ($query, $value) => $query->where('asset_id', $value))
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->type, fn ($query, $value) => $query->where('type', $value))
            ->when($request->priority, fn ($query, $value) => $query->where('priority', $value))
            ->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_order', 'desc'))
            ->paginate($request->integer('per_page', 15));

        return response()->json($records);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'type' => ['required', 'string', 'max:60'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'technician' => ['nullable', 'string', 'max:160'],
            'scheduled_at' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['status'] = 'scheduled';

        $record = MaintenanceRecord::create($validated);
        $this->logActivity('maintenance_scheduled', $record, $request);

        return response()->json($record->fresh()->load('asset'), 201);
    }

    public function show(MaintenanceRecord $record): JsonResponse
    {
        return response()->json($record->load('asset'));
    }

    /**
     * Predicted maintenance due soon, based on each asset's own repair
     * history (see RepairFrequencyService::dueSoon()).
     */
    public function predictions(Request $request): JsonResponse
    {
        $daysAhead = $request->integer('days_ahead', 14);

        $predictions = collect(RepairFrequencyService::dueSoon($daysAhead))->map(fn ($p) => [
            'asset_id' => $p['asset_id'],
            'asset_name' => $p['asset']->name,
            'property_number' => $p['asset']->property_number,
            'avg_interval_days' => $p['avg_interval_days'],
            'last_completed_at' => $p['last_completed_at'],
            'predicted_date' => $p['predicted_date'],
            'is_overdue' => $p['is_overdue'],
            'days_until_due' => $p['days_until_due'],
            'sample_size' => $p['sample_size'],
        ]);

        return response()->json(['data' => $predictions]);
    }

    public function update(Request $request, MaintenanceRecord $record): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'max:60'],
            'priority' => ['sometimes', 'in:low,medium,high,critical'],
            'status' => ['sometimes', 'in:scheduled,in_progress,completed,cancelled'],
            'technician' => ['sometimes', 'nullable', 'string', 'max:160'],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
            'cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        // If status is being set to 'completed', set completed_at timestamp
        if (($validated['status'] ?? null) === 'completed' && !isset($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        $record->update($validated);

        // If this maintenance was just completed, check for repeat repair anomaly
        if ($record->status === 'completed' && ($validated['status'] ?? null) === 'completed') {
            RepairFrequencyService::checkThreshold($record->asset_id);
        }

        $this->logActivity('maintenance_updated', $record, $request);

        return response()->json($record->fresh()->load('asset'));
    }

    public function destroy(Request $request, MaintenanceRecord $record): JsonResponse
    {
        $record->update(['status' => 'cancelled']);
        $this->logActivity('maintenance_cancelled', $record, $request);

        return response()->json(['message' => 'Maintenance record cancelled.']);
    }

    protected function logActivity(string $action, MaintenanceRecord $record, Request $request): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'maintenance_id' => $record->id,
                'asset_id' => $record->asset_id,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

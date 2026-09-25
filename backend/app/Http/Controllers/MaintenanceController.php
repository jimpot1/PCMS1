<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRecord;
use App\Models\AssetUnit;
use App\Services\RepairFrequencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MaintenanceController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(MaintenanceRecord::class, 'record');
    }

    public function index(Request $request): JsonResponse
    {
        $records = MaintenanceRecord::query()
            ->with('asset', 'assetUnit')
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
            'asset_unit_id' => ['nullable', 'integer', 'exists:asset_units,id'],
            'type' => ['required', 'string', 'max:60'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'technician' => ['nullable', 'string', 'max:160'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:today'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $asset = \App\Models\Asset::findOrFail($validated['asset_id']);
        $assetUnit = null;
        if (! empty($validated['asset_unit_id'])) {
            $assetUnit = AssetUnit::whereKey($validated['asset_unit_id'])
                ->where('asset_id', $asset->id)
                ->first();
            if (! $assetUnit) {
                return response()->json(['message' => 'The selected physical unit does not belong to the selected asset.'], 422);
            }
            $validated['asset_unit_id'] = $assetUnit->id;
        }
        if (in_array($asset->status, ['lost', 'unserviceable', 'disposed'], true)) {
            return response()->json(['message' => 'Maintenance cannot be scheduled for a lost, unserviceable, or disposed asset.'], 422);
        }

        $duplicate = MaintenanceRecord::query()
            ->where('asset_id', $asset->id)
            ->where('type', $validated['type'])
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->when($validated['scheduled_at'] ?? null, fn ($query, $date) => $query->whereDate('scheduled_at', $date))
            ->exists();
        if ($duplicate) {
            return response()->json(['message' => 'An active maintenance record already exists for this asset and schedule.'], 422);
        }

        $validated['status'] = 'scheduled';

        $record = DB::transaction(function () use ($validated, $asset, $request) {
            $record = MaintenanceRecord::create($validated);
            if ($record->asset_unit_id) {
                AssetUnit::whereKey($record->asset_unit_id)->update([
                    'status' => 'maintenance',
                    'condition' => 'needs_repair',
                ]);
                $this->syncAssetFromUnits($asset);
            } else {
                $asset->update(['status' => 'maintenance', 'available_quantity' => 0]);
                AssetUnit::where('asset_id', $asset->id)->update([
                    'status' => 'maintenance',
                    'condition' => 'needs_repair',
                ]);
            }
            $this->notifyOperations($record, 'scheduled');

            return $record;
        });
        $this->logActivity('maintenance_scheduled', $record, $request);

        return response()->json($record->fresh()->load('asset', 'assetUnit'), 201);
    }

    public function show(MaintenanceRecord $record): JsonResponse
    {
        return response()->json($record->load('asset', 'assetUnit'));
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
            'scheduled_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
            'cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        // If status is being set to 'completed', set completed_at timestamp
        if (($validated['status'] ?? null) === 'completed' && !isset($validated['completed_at'])) {
            $validated['completed_at'] = now();
        }

        DB::transaction(function () use ($record, $validated, $request) {
            $record->update($validated);

            if (($validated['status'] ?? null) === 'completed') {
                $asset = \App\Models\Asset::find($record->asset_id);
                if ($asset && ! in_array($asset->status, ['lost', 'unserviceable', 'disposed'], true)) {
                    if ($record->asset_unit_id) {
                        AssetUnit::whereKey($record->asset_unit_id)->update([
                            'status' => 'available',
                            'condition' => 'good',
                        ]);
                        $this->syncAssetFromUnits($asset);
                    } else {
                        $asset->update(['status' => 'available']);
                    }
                }
                $this->notifyOperations($record, 'completed');
            }
        });

        // If this maintenance was just completed, check for repeat repair anomaly
        if ($record->status === 'completed' && ($validated['status'] ?? null) === 'completed') {
            RepairFrequencyService::checkThreshold($record->asset_id);
        }

        $this->logActivity('maintenance_updated', $record, $request);

        return response()->json($record->fresh()->load('asset', 'assetUnit'));
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

    protected function notifyOperations(MaintenanceRecord $record, string $state): void
    {
        if (! Schema::hasTable('transfer_notifications')) {
            return;
        }

        $assetName = $record->asset?->name ?? "Asset #{$record->asset_id}";
        $recipients = \App\Models\User::query()
            ->where('status', 'active')
            ->whereIn('role', ['System Administrator', 'PPMO Staff', 'Property Custodian', 'OIC'])
            ->get(['id', 'role']);

        foreach ($recipients as $recipient) {
            $target = "/ppmo/maintenance?record={$record->id}";
            $exists = DB::table('transfer_notifications')
                ->where('recipient_id', $recipient->id)
                ->where('type', "maintenance_{$state}")
                ->where('navigation_target', $target)
                ->exists();
            if ($exists) {
                continue;
            }

            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $recipient->id,
                'recipient_role' => $recipient->role,
                'type' => "maintenance_{$state}",
                'title' => 'Maintenance update',
                'message' => "{$assetName} maintenance is {$state}.",
                'navigation_target' => $target,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    protected function syncAssetFromUnits(\App\Models\Asset $asset): void
    {
        $available = AssetUnit::where('asset_id', $asset->id)
            ->where('status', 'available')
            ->count();

        $asset->update([
            'available_quantity' => $available,
            'status' => $available > 0 ? 'available' : 'maintenance',
        ]);
    }
}

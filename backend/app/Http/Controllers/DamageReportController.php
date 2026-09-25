<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetUnit;
use App\Models\DamageReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DamageReportController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(DamageReport::class, 'report');
    }

    public function index(Request $request): JsonResponse
    {
        $reports = DamageReport::query()
            ->with('asset', 'assetUnit', 'department')
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->severity, fn ($query, $value) => $query->where('severity', $value))
            ->when($request->asset_id, fn ($query, $value) => $query->where('asset_id', $value))
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'asset_unit_id' => ['nullable', 'integer', 'exists:asset_units,id'],
            'ocr_scan_id' => ['nullable', 'exists:ocr_scans,id'],
            'incident_type' => ['required', 'in:damaged,lost,unserviceable'],
            'incident_date' => ['required', 'date'],
            'severity' => ['required', 'in:minor,moderate,severe,critical'],
            'description' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'max:5120'], // 5MB
        ]);

        $assetId = $validated['asset_id'];
        $assetUnit = null;

        if (! empty($validated['asset_unit_id'])) {
            $assetUnit = AssetUnit::whereKey($validated['asset_unit_id'])
                ->where('asset_id', $assetId)
                ->first();

            if (! $assetUnit) {
                return response()->json(['message' => 'The selected physical unit does not belong to the selected asset.'], 422);
            }
        }

        // If OCR scan ID is provided, resolve asset from OCR
        if (!$assetId && $validated['ocr_scan_id'] ?? null) {
            $ocrScan = DB::table('ocr_scans')
                ->where('id', $validated['ocr_scan_id'])
                ->first();
            
            if ($ocrScan && $ocrScan->asset_id) {
                $assetId = $ocrScan->asset_id;
            }
        }

        if (!$assetId) {
            return response()->json(['message' => 'Asset ID must be provided or resolved from OCR scan.'], 422);
        }

        $asset = Asset::findOrFail($assetId);
        $photoPath = null;

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('damage-reports', 'public');
        }

        $report = DamageReport::create([
            'asset_id' => $assetId,
            'asset_unit_id' => $assetUnit?->id,
            'reported_by' => $request->user()?->id,
            'department_id' => $asset->department_id,
            'incident_type' => $validated['incident_type'],
            'incident_date' => $validated['incident_date'],
            'severity' => $validated['severity'],
            'description' => $validated['description'],
            'photo_path' => $photoPath,
            'status' => 'submitted',
        ]);

        if ($assetUnit) {
            $this->applyUnitHold($assetUnit, $validated['incident_type']);
            $this->syncAssetFromUnits($asset, $validated['incident_type']);
        } else {
            $this->applyAssetHold($asset, $validated['incident_type']);
        }
        $this->notifyOperations($report, 'submitted');

        $this->logActivity('damage_report_submitted', $report, $request);

        return response()->json($report->fresh()->load('asset', 'assetUnit', 'department'), 201);
    }

    public function show(DamageReport $report): JsonResponse
    {
        return response()->json($report->load('asset', 'assetUnit', 'department'));
    }

    public function update(Request $request, DamageReport $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:submitted,in_review,under_repair,repaired,declared_lost,declared_unserviceable,disposed'],
            'assessment_notes' => ['sometimes', 'nullable', 'string'],
            'disposal_reference' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $oldStatus = $report->status;
        if (array_key_exists('assessment_notes', $validated)) {
            $validated['assessed_by'] = $request->user()?->id;
            $validated['assessed_at'] = now();
        }
        if (in_array($validated['status'] ?? null, ['repaired', 'declared_lost', 'declared_unserviceable', 'disposed'], true)) {
            $validated['resolved_at'] = now();
        }
        $report->update($validated);

        if (in_array($report->status, ['repaired', 'declared_lost', 'declared_unserviceable', 'disposed'], true)) {
            $units = $report->asset_unit_id
                ? AssetUnit::whereKey($report->asset_unit_id)->get()
                : AssetUnit::where('asset_id', $report->asset_id)->get();

            foreach ($units as $unit) {
                $unit->update([
                    'status' => $report->status === 'repaired'
                        ? 'available'
                        : ($report->status === 'declared_lost' ? 'disposed' : ($report->status === 'disposed' ? 'disposed' : 'maintenance')),
                    'condition' => $report->status === 'repaired' ? 'good' : 'unserviceable',
                ]);
            }

            if ($units->isNotEmpty()) {
                $this->syncAssetFromUnits($report->asset, $report->status === 'repaired' ? 'available' : $report->status);
            }
        }

        if ($oldStatus !== $report->status) {
            $asset = Asset::find($report->asset_id);
            $assetUpdates = match ($report->status) {
                'under_repair' => ['status' => 'maintenance', 'condition' => 'needs_repair', 'available_quantity' => 0],
                'repaired' => ['status' => 'available', 'condition' => 'good'],
                'declared_lost' => ['status' => 'lost', 'condition' => 'lost', 'available_quantity' => 0],
                'declared_unserviceable' => ['status' => 'unserviceable', 'condition' => 'unserviceable', 'available_quantity' => 0],
                'disposed' => ['status' => 'disposed', 'condition' => 'unserviceable', 'available_quantity' => 0],
                default => null,
            };
            if ($asset && $assetUpdates) {
                if ($report->status === 'repaired') {
                    $assetUpdates['available_quantity'] = $asset->quantity;
                }
                $asset->update($assetUpdates);
            }

            if ($report->status === 'repaired') {
                DB::table('maintenance_records')->insert([
                    'asset_id' => $report->asset_id,
                    'type' => 'repair',
                    'priority' => 'medium',
                    'status' => 'completed',
                    'completed_at' => now(),
                    'notes' => "Damage report #{$report->id}: {$report->description}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $this->notifyOperations($report->fresh(), $report->status);
        }

        $this->logActivity('damage_report_updated', $report, $request);

        return response()->json($report->fresh()->load('asset', 'assetUnit', 'department'));
    }

    protected function applyAssetHold(Asset $asset, string $incidentType): void
    {
        $updates = match ($incidentType) {
            'lost' => ['status' => 'lost', 'condition' => 'lost', 'available_quantity' => 0],
            'unserviceable' => ['status' => 'unserviceable', 'condition' => 'unserviceable', 'available_quantity' => 0],
            default => ['status' => 'damaged', 'condition' => 'damaged', 'available_quantity' => 0],
        };
        $asset->update($updates);

        AssetUnit::where('asset_id', $asset->id)->update([
            'status' => $incidentType === 'lost' ? 'disposed' : ($incidentType === 'unserviceable' ? 'maintenance' : 'damaged'),
            'condition' => $incidentType === 'lost' ? 'unserviceable' : $incidentType,
        ]);
    }

    protected function applyUnitHold(AssetUnit $unit, string $incidentType): void
    {
        $unit->update([
            'status' => $incidentType === 'lost' ? 'disposed' : ($incidentType === 'unserviceable' ? 'maintenance' : 'damaged'),
            'condition' => $incidentType === 'lost' ? 'unserviceable' : $incidentType,
        ]);
    }

    protected function syncAssetFromUnits(Asset $asset, ?string $fallbackStatus = null): void
    {
        $available = AssetUnit::where('asset_id', $asset->id)
            ->where('status', 'available')
            ->count();

        $asset->update([
            'available_quantity' => $available,
            'status' => $available > 0 ? 'available' : ($fallbackStatus ?: 'damaged'),
        ]);
    }

    protected function notifyOperations(DamageReport $report, string $state): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('transfer_notifications')) return;
        $assetName = $report->asset?->name ?? "Asset #{$report->asset_id}";
        $recipients = \App\Models\User::query()->where('status', 'active')
            ->whereIn('role', ['System Administrator', 'PPMO Staff', 'Property Custodian', 'OIC'])->get(['id', 'role']);
        foreach ($recipients as $recipient) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null, 'recipient_id' => $recipient->id, 'recipient_role' => $recipient->role,
                'type' => 'asset_incident_' . $state, 'title' => 'Asset incident update',
                'message' => "{$assetName}: {$report->incident_type} report is now {$state}.",
                'navigation_target' => "/ppmo/damage?report={$report->id}",
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function destroy(Request $request, DamageReport $report): JsonResponse
    {
        if (in_array($report->status, ['disposed', 'declared_lost', 'declared_unserviceable'], true)) {
            return response()->json(['message' => 'Resolved incident history cannot be deleted.'], 422);
        }

        $report->update(['status' => 'cancelled', 'resolved_at' => now()]);
        $this->logActivity('damage_report_cancelled', $report, $request);

        return response()->json(['message' => 'Damage report cancelled and retained in history.']);
    }

    protected function logActivity(string $action, DamageReport $report, Request $request): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'damage_report_id' => $report->id,
                'asset_id' => $report->asset_id,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

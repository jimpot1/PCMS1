<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetUnit;
use App\Models\AssetTransfer;
use App\Models\AuditAssetCount;
use App\Models\AuditScan;
use App\Models\AuditSupplyCount;
use App\Models\DamageReport;
use App\Models\Department;
use App\Models\PhysicalAudit;
use App\Models\Supply;
use App\Services\AnomalyDetectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(PhysicalAudit::class, 'audit');
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'nullable', 'string', 'max:40'],
            'department_id' => ['sometimes', 'nullable', 'integer', 'exists:departments,id'],
            'date_from' => ['sometimes', 'nullable', 'date'],
            'date_to' => ['sometimes', 'nullable', 'date'],
            'area' => ['sometimes', 'nullable', 'string', 'max:180'],
        ]);
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
        $audits = PhysicalAudit::query()
            ->with('auditScans')
            ->when($filters['status'] ?? null, fn ($query, $value) => $query->where('status', $value))
            ->when($filters['department_id'] ?? null, fn ($query, $value) => $query->where('department_id', $value))
            ->when($filters['date_from'] ?? null, fn ($query, $value) => $query->whereDate('scheduled_at', '>=', $value))
            ->when($filters['date_to'] ?? null, fn ($query, $value) => $query->whereDate('scheduled_at', '<=', $value))
            ->when($filters['area'] ?? null, fn ($query, $value) => $query->where('area', $searchOperator, "%{$value}%"))
            ->orderBy('scheduled_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($audits);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'area' => ['required', 'string', 'max:180'],
            'audit_type' => ['sometimes', 'in:assets,supplies,combined'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'scheduled_at' => ['required', 'date', 'after_or_equal:today'],
        ]);

        $audit = DB::transaction(function () use ($request, $validated): PhysicalAudit {
            $auditType = $validated['audit_type'] ?? 'assets';
            $includesAssets = in_array($auditType, ['assets', 'combined'], true);
            $audit = PhysicalAudit::create([
                'audit_number' => $this->generateAuditNumber(),
                'area' => $validated['area'],
                'audit_type' => $auditType,
                'department_id' => $validated['department_id'] ?? null,
                'auditor_id' => $request->user()?->id,
                'scheduled_at' => $validated['scheduled_at'],
                'status' => 'scheduled',
                'asset_snapshot_created_at' => $includesAssets ? now() : null,
            ]);

            if ($includesAssets) {
                $this->snapshotAssets($audit);
            }

            return $audit;
        });

        $this->logActivity('audit_scheduled', $audit, $request);

        return response()->json($audit, 201);
    }

    public function show(PhysicalAudit $audit): JsonResponse
    {
        $audit->load(
            'auditScans.asset',
            'auditScans.assetUnit',
            'auditScans.foundDepartment',
            'supplyCounts.supply',
            'assetCounts.asset',
        );
        $scans = $audit->auditScans;
        $includesAssets = in_array($audit->audit_type ?? 'assets', ['assets', 'combined'], true);
        $includesSupplies = in_array($audit->audit_type ?? 'assets', ['supplies', 'combined'], true);
        $scansByAsset = $scans->groupBy('asset_id')->map(
            fn ($assetScans) => $assetScans->firstWhere('result', 'wrong_department')
                ?? $assetScans->firstWhere('result', 'verified')
                ?? $assetScans->first(),
        );
        $scanResultsByAsset = $scansByAsset->map(fn (AuditScan $scan) => $scan->result);
        $assetCountsByAsset = $audit->assetCounts->keyBy('asset_id');
        $assetSnapshot = $audit->assetCounts;
        if ($includesAssets && ! $audit->asset_snapshot_created_at && $audit->status !== 'completed') {
            $assetSnapshot = Asset::query()
                ->with('department')
                ->when(
                    $audit->department_id,
                    fn ($query, $departmentId) => $query->where('department_id', $departmentId),
                    fn ($query) => $query->whereNull('department_id'),
                )
                ->orderBy('name')
                ->get()
                ->map(fn (Asset $asset) => $assetCountsByAsset->get($asset->id) ?? $asset);
        } elseif ($includesAssets && ! $audit->asset_snapshot_created_at && $audit->status === 'completed') {
            $legacyAssets = $scans->pluck('asset')->filter()->keyBy('id');
            $assetSnapshot = $audit->assetCounts->keyBy('asset_id')->map(
                fn (AuditAssetCount $count) => $count->asset ?? $legacyAssets->get($count->asset_id) ?? $count,
            )->union($legacyAssets);
        }

        $expectedAssets = $includesAssets
            ? $assetSnapshot->map(function ($item) use ($scansByAsset, $assetCountsByAsset) {
                $assetId = $item instanceof AuditAssetCount ? $item->asset_id : $item->id;
                $scan = $scansByAsset->get($assetId);
                $count = $assetCountsByAsset->get($assetId);
                $asset = $item instanceof AuditAssetCount ? $item->asset : $item;

                return [
                    'id' => $assetId,
                    'name' => $item instanceof AuditAssetCount
                        ? ($item->asset_name_snapshot ?? $asset?->name ?? 'Deleted asset')
                        : ($item->name ?? 'Deleted asset'),
                    'property_number' => $item instanceof AuditAssetCount
                        ? ($item->property_number_snapshot ?? $asset?->property_number)
                        : $asset?->property_number,
                    'department_id' => $item instanceof AuditAssetCount
                        ? ($item->department_id_snapshot ?? $asset?->department_id)
                        : $asset?->department_id,
                    'department_name' => $item instanceof AuditAssetCount
                        ? ($item->department_name_snapshot ?? $asset?->department?->name)
                        : $asset?->department?->name,
                    'result' => $scan?->result ?? 'unverified',
                    'scan_id' => $scan?->id,
                    'physical_unit_id' => $scan?->asset_unit_id,
                    'physical_unit_code' => $scan?->assetUnit?->unit_code,
                    'found_department_id' => $scan?->found_department_id,
                    'system_quantity' => $item instanceof AuditAssetCount
                        ? (int) $item->expected_quantity
                        : (int) ($asset?->quantity ?? 0),
                    'physical_quantity' => $count?->counted_quantity,
                    'variance' => $count?->variance,
                    'quantity_status' => $count?->status ?? 'uncounted',
                ];
            })->values()
            : collect();

        $countedAssets = $expectedAssets->where('quantity_status', '!=', 'uncounted')->count();

        $summary = [
            'verified' => $scanResultsByAsset->filter(fn ($result) => $result === 'verified')->count(),
            'missing' => $scanResultsByAsset->filter(fn ($result) => $result === 'missing')->count(),
            'wrong_department' => $scanResultsByAsset->filter(fn ($result) => $result === 'wrong_department')->count(),
            'unexpected_assets' => $scanResultsByAsset->filter(fn ($result) => $result === 'unexpected')->count(),
            'total' => $scans->count(),
            'expected' => $expectedAssets->count(),
            'unverified' => $expectedAssets->where('result', 'unverified')->count(),
            'counted_assets' => $countedAssets,
            'uncounted_assets' => $expectedAssets->where('quantity_status', 'uncounted')->count(),
        ];
        $summary['progress_percent'] = $summary['expected'] > 0
            ? (int) round(max($summary['verified'] + $summary['wrong_department'], $countedAssets) / $summary['expected'] * 100)
            : 0;

        $expectedSupplies = $includesSupplies && $audit->department_id
            ? Supply::query()
                ->where('department_id', $audit->department_id)
                ->orderBy('name')
                ->get()
                ->map(function (Supply $supply) use ($audit) {
                    $count = $audit->supplyCounts->firstWhere('supply_id', $supply->id);

                    return [
                        'id' => $supply->id,
                        'sku' => $supply->sku,
                        'name' => $supply->name,
                        'unit' => $supply->unit,
                        'expected_quantity' => $count?->expected_quantity ?? $supply->stock,
                        'counted_quantity' => $count?->counted_quantity,
                        'variance' => $count?->variance,
                        'status' => $count?->status ?? 'uncounted',
                        'notes' => $count?->notes,
                    ];
                })
                ->values()
            : collect();

        $countedSupplies = $expectedSupplies->where('status', '!=', 'uncounted')->count();
        $summary['expected_supplies'] = $expectedSupplies->count();
        $summary['counted_supplies'] = $countedSupplies;
        $summary['supply_progress_percent'] = $summary['expected_supplies'] > 0
            ? (int) round($countedSupplies / $summary['expected_supplies'] * 100)
            : 0;

        return response()->json([
            'audit' => $audit,
            'summary' => $summary,
            'expected_assets' => $expectedAssets,
            'expected_supplies' => $expectedSupplies,
        ]);
    }

    public function countAsset(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot count assets in a completed audit.'], 400);
        }

        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'counted_quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        $snapshot = $audit->assetCounts()->where('asset_id', $asset->id)->first();
        if ($audit->asset_snapshot_created_at && ! $snapshot) {
            return response()->json(['message' => 'This asset was not part of the audit snapshot.'], 422);
        }

        if (! $snapshot) {
            if ($audit->department_id && (int) $asset->department_id !== (int) $audit->department_id) {
                return response()->json(['message' => 'The selected asset does not belong to this audit department.'], 422);
            }
            if (! $audit->department_id && $asset->department_id !== null) {
                return response()->json(['message' => 'The selected asset is assigned to a department and is not PPMO unassigned stock.'], 422);
            }

            $snapshot = AuditAssetCount::create([
                'audit_id' => $audit->id,
                'asset_id' => $asset->id,
                'expected_quantity' => (int) ($asset->quantity ?? 0),
                'status' => 'uncounted',
                'asset_name_snapshot' => $asset->name,
                'property_number_snapshot' => $asset->property_number,
                'department_id_snapshot' => $asset->department_id,
                'department_name_snapshot' => $asset->department?->name,
            ]);
        }

        $expectedQuantity = (int) $snapshot->expected_quantity;
        $countedQuantity = (int) $validated['counted_quantity'];
        $variance = $countedQuantity - $expectedQuantity;
        $status = $variance === 0 ? 'matched' : ($countedQuantity === 0 ? 'missing' : 'variance');

        $count = AuditAssetCount::updateOrCreate(
            ['audit_id' => $audit->id, 'asset_id' => $asset->id],
            [
                'expected_quantity' => $expectedQuantity,
                'counted_quantity' => $countedQuantity,
                'variance' => $variance,
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        $this->logActivity('audit_asset_counted', $count, $request);

        return response()->json($count->load('asset'), 201);
    }

    public function countSupply(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot count supplies in a completed audit.'], 400);
        }

        $validated = $request->validate([
            'supply_id' => ['required', 'exists:supplies,id'],
            'counted_quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $supply = Supply::findOrFail($validated['supply_id']);
        if ($audit->department_id && (int) $supply->department_id !== (int) $audit->department_id) {
            return response()->json(['message' => 'The selected supply does not belong to this audit department.'], 422);
        }

        $expectedQuantity = (int) $supply->stock;
        $countedQuantity = (int) $validated['counted_quantity'];
        $variance = $countedQuantity - $expectedQuantity;
        $status = $variance === 0 ? 'matched' : 'variance';

        $count = AuditSupplyCount::updateOrCreate(
            ['audit_id' => $audit->id, 'supply_id' => $supply->id],
            [
                'expected_quantity' => $expectedQuantity,
                'counted_quantity' => $countedQuantity,
                'variance' => $variance,
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        $this->logActivity('audit_supply_counted', $count, $request);

        return response()->json($count->load('supply'), 201);
    }

    public function update(Request $request, PhysicalAudit $audit): JsonResponse
    {
        // Can only update audit if not completed
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot update a completed audit.'], 400);
        }

        $validated = $request->validate([
            'area' => ['sometimes', 'string', 'max:180'],
            'audit_type' => ['sometimes', 'in:assets,supplies,combined'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'scheduled_at' => ['sometimes', 'date', 'after_or_equal:today'],
        ]);

        $scopeChanged = (
            array_key_exists('department_id', $validated)
            && (string) $audit->department_id !== (string) ($validated['department_id'] ?? null)
        ) || (
            array_key_exists('audit_type', $validated)
            && $audit->audit_type !== $validated['audit_type']
        );
        if ($scopeChanged && (
            $audit->auditScans()->exists()
            || $audit->assetCounts()->whereNotNull('counted_quantity')->exists()
            || $audit->supplyCounts()->whereNotNull('counted_quantity')->exists()
        )) {
            return response()->json([
                'message' => 'The department or audit type cannot be changed after audit activity has been recorded.',
            ], 422);
        }

        DB::transaction(function () use ($audit, $validated, $scopeChanged): void {
            $audit->update($validated);
            if ($scopeChanged) {
                $includesAssets = in_array($audit->audit_type ?? 'assets', ['assets', 'combined'], true);
                if ($includesAssets) {
                    $audit->assetCounts()->delete();
                    $this->snapshotAssets($audit);
                } else {
                    $audit->assetCounts()->delete();
                    $audit->update(['asset_snapshot_created_at' => null]);
                }
            }
        });
        $this->logActivity('audit_updated', $audit, $request);

        return response()->json($audit->fresh());
    }

    public function destroy(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot delete a completed audit.'], 400);
        }

        DB::transaction(function () use ($audit): void {
            $audit->auditScans()->delete();
            $audit->delete();
        });
        $this->logActivity('audit_cancelled', $audit, $request);

        return response()->json(['message' => 'Audit cancelled.']);
    }

    /**
     * Record a scanned asset during an audit session
     */
    public function scan(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot scan assets in a completed audit.'], 400);
        }

        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'asset_unit_id' => ['nullable', 'integer', 'exists:asset_units,id'],
            'found_department_id' => ['required', 'exists:departments,id'],
            'ocr_scan_id' => ['nullable', 'exists:ocr_scans,id'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        $assetUnit = isset($validated['asset_unit_id'])
            ? AssetUnit::whereKey($validated['asset_unit_id'])
                ->where('asset_id', $asset->id)
                ->first()
            : null;
        if (isset($validated['asset_unit_id']) && ! $assetUnit) {
            return response()->json([
                'message' => 'The selected physical unit does not belong to this asset.',
                'errors' => ['asset_unit_id' => ['The selected physical unit does not belong to this asset.']],
            ], 422);
        }
        if ($assetUnit && $assetUnit->status !== 'assigned') {
            return response()->json([
                'message' => 'Only an assigned physical unit can be selected for an audit scan.',
                'errors' => ['asset_unit_id' => ['Only an assigned physical unit can be selected for an audit scan.']],
            ], 422);
        }
        $foundDepartmentId = $validated['found_department_id'];
        $snapshot = $audit->assetCounts()->where('asset_id', $asset->id)->first();
        $expectedDepartmentId = $snapshot && $audit->asset_snapshot_created_at
            ? $snapshot->department_id_snapshot
            : $asset->department_id;
        $auditDepartmentId = $audit->department_id ?? $expectedDepartmentId;

        $existingScans = AuditScan::query()
            ->where('audit_id', $audit->id)
            ->where('asset_id', $asset->id);
        $duplicateScan = $assetUnit
            ? (clone $existingScans)->where('asset_unit_id', $assetUnit->id)->first()
            : $existingScans->first();
        $hasUntrackedScan = $assetUnit
            ? (clone $existingScans)->whereNull('asset_unit_id')->exists()
            : false;
        if ($duplicateScan || $hasUntrackedScan) {
            return response()->json([
                'message' => $assetUnit
                    ? 'This physical unit has already been scanned in this audit.'
                    : 'This asset has already been scanned in this audit.',
                'scan' => $duplicateScan?->load('asset', 'assetUnit', 'foundDepartment'),
            ], 409);
        }

        // Determine result
        $isUnexpectedAsset = $audit->asset_snapshot_created_at && ! $snapshot;
        $result = $isUnexpectedAsset ? 'unexpected' : 'verified';
        if (! $isUnexpectedAsset && $expectedDepartmentId != $foundDepartmentId) {
            $result = 'wrong_department';
            // Detect untracked transfer
            AnomalyDetectionService::detectUntrackedTransfer($asset->id, $foundDepartmentId);

            $existingTransfer = AssetTransfer::query()
                ->where('asset_id', $asset->id)
                ->where('from_department_id', $auditDepartmentId)
                ->where('to_department_id', $foundDepartmentId)
                ->when($assetUnit, fn ($query) => $query->where(function ($units) use ($assetUnit) {
                    $units->where('asset_unit_id', $assetUnit->id)
                        ->orWhereNull('asset_unit_id');
                }))
                ->whereIn('status', ['transfer_requested', 'department_approved', 'ready_for_transfer'])
                ->exists();

            if (! $existingTransfer) {
                AssetTransfer::create([
                    'transfer_number' => $this->generateTransferNumber(),
                    'asset_id' => $asset->id,
                    'asset_unit_id' => $assetUnit?->id,
                    'from_department_id' => $auditDepartmentId,
                    'to_department_id' => $foundDepartmentId,
                    'from_custodian_id' => $assetUnit?->custodian_id ?: ($asset->current_holder_id ?: $asset->custodian_id),
                    'requested_by' => $request->user()?->id,
                    'status' => 'transfer_requested',
                    'reason' => 'Physical audit found asset in '.(Department::find($foundDepartmentId)?->name ?: "Department #{$foundDepartmentId}").'.',
                    'quantity' => $assetUnit ? 1 : (int) ($asset->quantity ?? 1),
                    'transfer_type' => 'permanent',
                ]);
            }
        }

        $scan = AuditScan::create([
            'audit_id' => $audit->id,
            'asset_id' => $asset->id,
            'asset_unit_id' => $assetUnit?->id,
            'found_department_id' => $foundDepartmentId,
            'result' => $result,
            'ocr_scan_id' => $validated['ocr_scan_id'] ?? null,
        ]);

        $this->logActivity('audit_scan_recorded', $scan, $request);

        return response()->json($scan->fresh()->load('asset', 'assetUnit', 'foundDepartment'), 201);
    }

    /**
     * Complete an audit session and generate summary
     */
    public function complete(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Audit is already completed.'], 400);
        }

        try {
            DB::beginTransaction();

            if (in_array($audit->audit_type ?? 'assets', ['assets', 'combined'], true)) {
                $expectedAssetIds = $audit->asset_snapshot_created_at
                    ? $audit->assetCounts()->pluck('asset_id')
                    : Asset::query()
                        ->when(
                            $audit->department_id,
                            fn ($query, $departmentId) => $query->where('department_id', $departmentId),
                            fn ($query) => $query->whereNull('department_id'),
                        )
                        ->pluck('id');
                $scannedAssetIds = $audit->auditScans->pluck('asset_id');
                $countedAssetIds = $audit->assetCounts()->whereNotNull('counted_quantity')->pluck('asset_id');
                $missingIds = $expectedAssetIds->diff($scannedAssetIds)->diff($countedAssetIds);

                foreach ($missingIds as $assetId) {
                    $missingAsset = Asset::find($assetId);
                    if (! $missingAsset) {
                        continue;
                    }

                    AuditScan::create([
                        'audit_id' => $audit->id,
                        'asset_id' => $assetId,
                        'result' => 'missing',
                    ]);

                    $alreadyReported = DamageReport::query()
                        ->where('asset_id', $assetId)
                        ->where('description', 'like', "Physical audit {$audit->audit_number}%")
                        ->exists();

                    if (! $alreadyReported) {
                        DamageReport::create([
                            'asset_id' => $assetId,
                            'reported_by' => $request->user()?->id,
                            'department_id' => $audit->department_id,
                            'severity' => 'critical',
                            'incident_type' => 'lost',
                            'incident_date' => now()->toDateString(),
                            'description' => "Physical audit {$audit->audit_number} could not verify this asset.",
                            'status' => 'submitted',
                        ]);
                    }

                }

                $audit->load('auditScans');
            }

            $audit->update(['status' => 'completed']);

            // Generate summary
            $scans = $audit->auditScans;
            $scanResultsByAsset = $scans->groupBy('asset_id')->map(
                fn ($assetScans) => $assetScans->contains('result', 'wrong_department')
                    ? 'wrong_department'
                    : ($assetScans->contains('result', 'verified')
                        ? 'verified'
                        : $assetScans->first()->result),
            );
            $summary = [
                'verified' => $scanResultsByAsset->filter(fn ($result) => $result === 'verified')->count(),
                'missing' => $scanResultsByAsset->filter(fn ($result) => $result === 'missing')->count(),
                'wrong_department' => $scanResultsByAsset->filter(fn ($result) => $result === 'wrong_department')->count(),
                'total' => $scans->count(),
            ];

            DB::commit();

            $this->logActivity('audit_completed', $audit, $request);

            return response()->json([
                'message' => 'Audit completed',
                'audit' => $audit->fresh(),
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function generateAuditNumber(): string
    {
        $sequence = PhysicalAudit::count() + 1;

        return sprintf('AUD-%s-%06d', now()->format('Y'), $sequence);
    }

    private function snapshotAssets(PhysicalAudit $audit): void
    {
        Asset::query()
            ->with('department')
            ->when(
                $audit->department_id,
                fn ($query, $departmentId) => $query->where('department_id', $departmentId),
                fn ($query) => $query->whereNull('department_id'),
            )
            ->orderBy('id')
            ->get()
            ->each(fn (Asset $asset) => AuditAssetCount::create([
                'audit_id' => $audit->id,
                'asset_id' => $asset->id,
                'expected_quantity' => (int) ($asset->quantity ?? 0),
                'status' => 'uncounted',
                'asset_name_snapshot' => $asset->name,
                'property_number_snapshot' => $asset->property_number,
                'department_id_snapshot' => $asset->department_id,
                'department_name_snapshot' => $asset->department?->name,
            ]));

        $audit->update(['asset_snapshot_created_at' => now()]);
    }

    protected function generateTransferNumber(): string
    {
        return sprintf('TR-%s-%06d', now()->format('Y'), AssetTransfer::count() + 1);
    }

    protected function logActivity(string $action, $model, Request $request): void
    {
        $data = [
            'action' => $action,
            'user' => optional($request->user())->email ?? 'system',
            'ip' => $request->ip(),
        ];

        if ($model instanceof PhysicalAudit) {
            $data['audit_id'] = $model->id;
        } elseif ($model instanceof AuditScan) {
            $data['audit_id'] = $model->audit_id;
            $data['asset_id'] = $model->asset_id;
        }

        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode($data),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

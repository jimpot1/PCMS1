<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AuditScan;
use App\Models\PhysicalAudit;
use App\Services\AnomalyDetectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
        $audits = PhysicalAudit::query()
            ->with('auditScans')
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->area, fn ($query, $value) => $query->where('area', $searchOperator, "%{$value}%"))
            ->orderBy('scheduled_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($audits);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'area' => ['required', 'string', 'max:180'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'scheduled_at' => ['required', 'date'],
        ]);

        $audit = PhysicalAudit::create([
            'audit_number' => $this->generateAuditNumber(),
            'area' => $validated['area'],
            'department_id' => $validated['department_id'] ?? null,
            'auditor_id' => $request->user()?->id,
            'scheduled_at' => $validated['scheduled_at'],
            'status' => 'scheduled',
        ]);

        $this->logActivity('audit_scheduled', $audit, $request);

        return response()->json($audit, 201);
    }

    public function show(PhysicalAudit $audit): JsonResponse
    {
        $audit->load('auditScans.asset');
        
        // Compute summary statistics
        $scans = $audit->auditScans;
        $summary = [
            'verified' => $scans->where('result', 'verified')->count(),
            'missing' => $scans->where('result', 'missing')->count(),
            'wrong_department' => $scans->where('result', 'wrong_department')->count(),
            'total' => $scans->count(),
        ];

        return response()->json([
            'audit' => $audit,
            'summary' => $summary,
        ]);
    }

    public function update(Request $request, PhysicalAudit $audit): JsonResponse
    {
        // Can only update audit if not completed
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot update a completed audit.'], 400);
        }

        $validated = $request->validate([
            'area' => ['sometimes', 'string', 'max:180'],
        ]);

        $audit->update($validated);
        $this->logActivity('audit_updated', $audit, $request);

        return response()->json($audit->fresh());
    }

    public function destroy(Request $request, PhysicalAudit $audit): JsonResponse
    {
        if ($audit->status === 'completed') {
            return response()->json(['message' => 'Cannot delete a completed audit.'], 400);
        }

        $audit->delete();
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
            'found_department_id' => ['required', 'exists:departments,id'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        $foundDepartmentId = $validated['found_department_id'];

        // Determine result
        $result = 'verified';
        if ($asset->department_id != $foundDepartmentId) {
            $result = 'wrong_department';
            // Detect untracked transfer
            AnomalyDetectionService::detectUntrackedTransfer($asset->id, $foundDepartmentId);
        }

        $scan = AuditScan::create([
            'audit_id' => $audit->id,
            'asset_id' => $asset->id,
            'found_department_id' => $foundDepartmentId,
            'result' => $result,
        ]);

        $this->logActivity('audit_scan_recorded', $scan, $request);

        return response()->json($scan->fresh()->load('asset', 'foundDepartment'), 201);
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

            if ($audit->department_id) {
                $expectedAssetIds = Asset::where('department_id', $audit->department_id)->pluck('id');
                $scannedAssetIds = $audit->auditScans->pluck('asset_id');
                $missingIds = $expectedAssetIds->diff($scannedAssetIds);

                foreach ($missingIds as $assetId) {
                    AuditScan::create([
                        'audit_id' => $audit->id,
                        'asset_id' => $assetId,
                        'result' => 'missing',
                    ]);
                }

                $audit->load('auditScans');
            }

            $audit->update(['status' => 'completed']);

            // Generate summary
            $scans = $audit->auditScans;
            $summary = [
                'verified' => $scans->where('result', 'verified')->count(),
                'missing' => $scans->where('result', 'missing')->count(),
                'wrong_department' => $scans->where('result', 'wrong_department')->count(),
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

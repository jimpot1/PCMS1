<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\DamageReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DamageReportController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(DamageReport::class, 'report');
    }

    public function index(Request $request): JsonResponse
    {
        $reports = DamageReport::query()
            ->with('asset', 'department')
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
            'asset_id' => ['nullable', 'exists:assets,id'],
            'ocr_scan_id' => ['nullable', 'exists:ocr_scans,id'],
            'severity' => ['required', 'in:minor,moderate,severe,critical'],
            'description' => ['required', 'string'],
            'photo' => ['nullable', 'image', 'max:5120'], // 5MB
        ]);

        $assetId = $validated['asset_id'];

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
            'reported_by' => $request->user()?->id,
            'department_id' => $asset->department_id,
            'severity' => $validated['severity'],
            'description' => $validated['description'],
            'photo_path' => $photoPath,
            'status' => 'submitted',
        ]);

        $this->logActivity('damage_report_submitted', $report, $request);

        return response()->json($report->fresh()->load('asset', 'department'), 201);
    }

    public function show(DamageReport $report): JsonResponse
    {
        return response()->json($report->load('asset', 'department'));
    }

    public function update(Request $request, DamageReport $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:submitted,in_review,under_repair,repaired,disposed'],
        ]);

        $oldStatus = $report->status;
        $report->update($validated);

        // If status changed to 'repaired' or 'disposed', update the asset status
        if ($oldStatus !== $report->status && in_array($report->status, ['repaired', 'disposed'])) {
            $assetStatus = $report->status === 'repaired' ? 'available' : 'disposed';
            Asset::find($report->asset_id)->update(['status' => $assetStatus]);

            // Also create a maintenance record for completed repairs
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
        }

        $this->logActivity('damage_report_updated', $report, $request);

        return response()->json($report->fresh()->load('asset', 'department'));
    }

    public function destroy(Request $request, DamageReport $report): JsonResponse
    {
        if ($report->photo_path) {
            Storage::disk('public')->delete($report->photo_path);
        }

        $report->delete();
        $this->logActivity('damage_report_deleted', $report, $request);

        return response()->json(['message' => 'Damage report deleted.']);
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

<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Services\AssetQrCodeService;
use App\Services\AssetUnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssetController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Asset::class, 'asset');
    }

    public function index(Request $request): JsonResponse
    {
        $assets = $this->buildAssetQuery($request)
            ->with(['category', 'department'])
            ->withCount([
                'units',
                'units as available_units_count' => fn ($query) => $query->where('status', 'available'),
            ])
            ->orderBy($request->input('sort_by', 'created_at'), $request->input('sort_order', 'desc'))
            ->paginate($request->integer('per_page', 15));

        $assets->getCollection()->transform(fn (Asset $asset) => $this->withUnitAvailability($asset));

        return response()->json($assets);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_number' => ['nullable', 'string', 'max:80', 'unique:assets,property_number'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:180'],
            'brand' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'exists:asset_categories,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'location' => ['nullable', 'string', 'max:180'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['required', 'integer', 'min:1'],
            'warranty_until' => ['nullable', 'date'],
            'condition' => ['nullable', 'in:good,needs_repair,damaged,under_inspection,lost,unserviceable'],
            'status' => ['nullable', 'in:available,assigned,transferred,maintenance,damaged,lost,unserviceable,disposed'],
            'remarks' => ['nullable', 'string'],
            'ocr_scan_id' => ['nullable', 'exists:ocr_scans,id'],
        ]);

        $ocrScanId = $validated['ocr_scan_id'] ?? null;
        unset($validated['ocr_scan_id']);

        $asset = DB::transaction(function () use ($validated, $request, $ocrScanId) {
            $validated['category_id'] ??= \App\Models\AssetCategory::query()->value('id');
            $validated['department_id'] ??= \App\Models\Department::query()->value('id');
            $validated['condition'] ??= 'good';
            $validated['status'] ??= 'available';
            $validated['asset_id'] = $this->generatePropertyNumber();
            $validated['property_number'] ??= $validated['asset_id'];
            $validated['available_quantity'] = $validated['quantity'];

            $asset = Asset::create($validated);
            $asset->update(['qr_code_path' => AssetQrCodeService::generate($asset)]);
            app(AssetUnitService::class)->createForAsset($asset);
            $this->logActivity('asset_registered', $asset, $request);

            if ($ocrScanId) {
                DB::table('ocr_scans')
                    ->where('id', $ocrScanId)
                    ->update([
                        'asset_id' => $asset->id,
                        'confirmed_by' => optional($request->user())->id,
                        'updated_at' => now(),
                    ]);
            }

            return $asset;
        });

        return response()->json($asset->fresh(['category', 'department']), 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        return response()->json($this->withUnitAvailability(
            $asset->load(['category', 'department', 'maintenanceRecords', 'assignments.assignedTo'])
        ));
    }

    protected function withUnitAvailability(Asset $asset): Asset
    {
        $unitCount = $asset->units_count ?? $asset->units()->count();
        if ($unitCount > 0) {
            $availableUnitCount = $asset->available_units_count
                ?? $asset->units()->where('status', 'available')->count();
            $asset->available_quantity = $availableUnitCount;
        }

        unset($asset->units_count, $asset->available_units_count);

        return $asset;
    }

    public function history(Asset $asset): JsonResponse
    {
        $logs = DB::table('activity_logs')
            ->where('payload->asset_id', $asset->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'asset' => $asset->load(['category', 'department']),
            'assignments' => $asset->assignments()->with('assignedTo', 'assignedBy')->latest()->get(),
            'transfers' => DB::table('asset_transfers')->where('asset_id', $asset->id)->orderByDesc('created_at')->get(),
            'maintenance' => $asset->maintenanceRecords()->latest()->get(),
            'ocr_scans' => DB::table('ocr_scans')->where('asset_id', $asset->id)->orderByDesc('created_at')->get(),
            'activity_logs' => $logs,
        ]);
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'property_number' => ['sometimes', 'string', 'max:80', 'unique:assets,property_number,' . $asset->id],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:120'],
            'name' => ['sometimes', 'string', 'max:180'],
            'brand' => ['sometimes', 'nullable', 'string', 'max:120'],
            'model' => ['sometimes', 'nullable', 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string'],
            'category_id' => ['sometimes', 'nullable', 'exists:asset_categories,id'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'supplier_id' => ['sometimes', 'nullable', 'exists:suppliers,id'],
            'location' => ['sometimes', 'nullable', 'string', 'max:180'],
            'purchase_date' => ['sometimes', 'nullable', 'date'],
            'purchase_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1'],
            'warranty_until' => ['sometimes', 'nullable', 'date'],
            'condition' => ['sometimes', 'in:good,needs_repair,damaged,under_inspection,lost,unserviceable'],
            'status' => ['sometimes', 'in:available,assigned,transferred,maintenance,damaged,lost,unserviceable,disposed'],
            'remarks' => ['sometimes', 'nullable', 'string'],
        ]);

        $asset->update($validated);

        if ($asset->wasChanged('property_number')) {
            $asset->update(['qr_code_path' => AssetQrCodeService::generate($asset)]);
        }

        $this->logActivity('asset_updated', $asset, $request);

        return response()->json([
            'success' => true,
            'asset' => $asset->fresh(['category', 'department']),
        ]);
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $asset->delete();
        $this->logActivity('asset_archived', $asset, request());

        return response()->json(['message' => 'Asset archived.']);
    }

    public function restore(Asset $asset): JsonResponse
    {
        if (! $asset->trashed()) {
            return response()->json(['message' => 'Asset is not archived.'], 400);
        }

        $asset->restore();
        $this->logActivity('asset_restored', $asset, request());

        return response()->json($asset->fresh(['category', 'department']));
    }

    public function statistics(Request $request): JsonResponse
    {
        $query = Asset::withTrashed();

        return response()->json([
            'total_assets' => $query->count(),
            'total_asset_value' => $query->sum('purchase_cost'),
            'qr_tagged' => $query->whereNotNull('qr_code_path')->count(),
            'warranty_active' => $query->whereDate('warranty_until', '>=', now())->count(),
            'needs_encoding' => $query->whereNull('qr_code_path')->count(),
            'damaged_assets' => $query->where('condition', 'damaged')->count(),
            'available_assets' => $query->where('status', 'available')->count(),
            'assigned_assets' => $query->where('status', 'assigned')->count(),
            'under_maintenance' => $query->where('status', 'maintenance')->count(),
            'disposed_assets' => $query->where('status', 'disposed')->count(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = $this->buildAssetQuery($request)->with(['category', 'department']);
        $filename = 'asset-registry-' . now()->format('YmdHis') . '.csv';

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Property Number', 'Asset Name', 'Category', 'Department', 'Custodian', 'Status', 'Condition', 'Purchase Cost', 'Total Quantity', 'Available Quantity', 'Assigned Quantity', 'Purchase Date']);

            $query->cursor()->each(function ($asset) use ($handle) {
                fputcsv($handle, [
                    $asset->property_number,
                    $asset->name,
                    optional($asset->category)->name,
                    optional($asset->department)->name,
                    $asset->custodian_id,
                    $asset->status,
                    $asset->condition,
                    $asset->purchase_cost,
                    $asset->quantity,
                    $asset->available_quantity,
                    max(0, (int) ($asset->quantity ?? 0) - (int) ($asset->available_quantity ?? 0)),
                    $asset->purchase_date,
                ]);
            });

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

 protected function buildAssetQuery(Request $request)
    {
        return Asset::query()
            ->when($request->boolean('with_trashed'), fn ($query) => $query->withTrashed())
            ->when($request->search, function ($query, $search) {
                $query->where(function ($subquery) use ($search) {
                    $subquery->where('name', 'ilike', "%{$search}%")
                        ->orWhere('property_number', 'ilike', "%{$search}%")
                        ->orWhere('serial_number', 'ilike', "%{$search}%")
                        ->orWhere('brand', 'ilike', "%{$search}%")
                        ->orWhere('model', 'ilike', "%{$search}%");
                });
            })
            ->when($request->category_id, fn ($query, $value) => $query->where('category_id', $value))
            ->when($request->department_id, fn ($query, $value) => $query->where('department_id', $value))
            ->when($request->condition, fn ($query, $value) => $query->where('condition', $value))
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->warranty, function ($query, $value) {
                if ($value === 'active') {
                    $query->whereDate('warranty_until', '>=', now());
                }
                if ($value === 'expired') {
                    $query->whereDate('warranty_until', '<', now());
                }
            })
            ->when($request->purchase_date_from, fn ($query, $value) => $query->whereDate('purchase_date', '>=', $value))
            ->when($request->purchase_date_to, fn ($query, $value) => $query->whereDate('purchase_date', '<=', $value));
    }
    protected function generatePropertyNumber(): string
    {
        $sequence = Asset::withTrashed()->count() + 1;

        do {
            $propertyNumber = sprintf('BCP-PPMO-%s-%06d', now()->format('Y'), $sequence++);
        } while (Asset::withTrashed()->where('property_number', $propertyNumber)->exists());

        return $propertyNumber;
    }

    protected function logActivity(string $action, Asset $asset, Request $request = null): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'asset_id' => $asset->id,
                'property_number' => $asset->property_number,
                'user' => optional($request?->user())->email ?? 'system',
                'ip' => $request?->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

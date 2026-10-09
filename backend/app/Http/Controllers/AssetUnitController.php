<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetUnit;
use App\Services\AssetUnitQrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssetUnitController extends Controller
{
    public function index(Asset $asset): JsonResponse
    {
        app(\App\Services\AssetUnitService::class)->ensureTrackedUnits($asset);

        $units = AssetUnit::query()
            ->where('asset_id', $asset->id)
            ->with(['department', 'custodian'])
            ->orderBy('id')
            ->get();

        $units->each(function (AssetUnit $unit) {
            if (! $unit->qr_code_path) {
                $unit->update(['qr_code_path' => AssetUnitQrCodeService::generate($unit)]);
            }
        });

        return response()->json([
            'data' => $units,
            'asset_id' => $asset->id,
            'total_units' => $units->count(),
        ]);
    }

    public function store(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'unit_code' => ['nullable', 'string', 'max:80', 'unique:asset_units,unit_code'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:available,assigned,in_transit,maintenance,damaged,disposed'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'custodian_id' => ['nullable', 'exists:users,id'],
            'condition' => ['nullable', 'string', 'max:40'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $unit = DB::transaction(function () use ($asset, $validated): AssetUnit {
            $asset = Asset::query()->lockForUpdate()->findOrFail($asset->id);
            if (in_array($asset->status, ['lost', 'unserviceable', 'disposed'], true)) {
                abort(422, 'Cannot add a physical unit to a lost, unserviceable, or disposed asset.');
            }

            $trackedUnitCount = AssetUnit::query()
                ->where('asset_id', $asset->id)
                ->where('status', '!=', 'removed')
                ->count();

            if (empty($validated['unit_code'])) {
                $lastSequence = AssetUnit::query()
                    ->where('asset_id', $asset->id)
                    ->pluck('unit_code')
                    ->reduce(function (int $highest, ?string $unitCode): int {
                        if (preg_match('/-(\d+)$/', (string) $unitCode, $matches) !== 1) {
                            return $highest;
                        }

                        return max($highest, (int) $matches[1]);
                    }, 0);
                $validated['unit_code'] = sprintf('%s-%03d', $asset->asset_id, $lastSequence + 1);
            }

            $unit = AssetUnit::create(array_merge($validated, [
                'asset_id' => $asset->id,
                'status' => $validated['status'] ?? 'available',
                'condition' => $validated['condition'] ?? 'good',
                'department_id' => $validated['department_id'] ?? $asset->department_id,
                'location' => $validated['location'] ?? $asset->location,
            ]));
            $unit->update(['qr_code_path' => AssetUnitQrCodeService::generate($unit)]);

            $availableQuantity = AssetUnit::query()
                ->where('asset_id', $asset->id)
                ->where('status', 'available')
                ->count();
            $asset->update([
                'quantity' => max((int) ($asset->quantity ?? 0), $trackedUnitCount + 1),
                'available_quantity' => $availableQuantity,
                'status' => $availableQuantity > 0 ? 'available' : $asset->status,
            ]);

            return $unit->fresh(['department', 'custodian']);
        });

        return response()->json($unit, 201);
    }
}

<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetUnit;
use App\Models\AssetUnitMovement;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AssetUnitService
{
    public function createForAsset(Asset $asset): void
    {
        $count = AssetUnit::where('asset_id', $asset->id)->count();
        $target = max(1, (int) ($asset->quantity ?? 1));

        for ($sequence = $count + 1; $sequence <= $target; $sequence++) {
            AssetUnit::create([
                'asset_id' => $asset->id,
                'unit_code' => sprintf('%s-%03d', $asset->asset_id, $sequence),
                'serial_number' => $target === 1 ? $asset->serial_number : null,
                'status' => 'available',
                'department_id' => null,
                'condition' => $asset->condition ?: 'good',
                'location' => $asset->location,
            ]);
        }
    }

    public function allocate(Asset $asset, ?int $unitId = null): ?AssetUnit
    {
        $query = AssetUnit::where('asset_id', $asset->id)->lockForUpdate();

        if ($unitId) {
            $unit = $query->whereKey($unitId)->first();
            if (! $unit || $unit->status !== 'available') {
                throw (new ModelNotFoundException())->setModel(AssetUnit::class, [$unitId]);
            }
            return $unit;
        }

        return $query->where('status', 'available')->orderBy('id')->first();
    }

    public function selectForTransfer(Asset $asset, ?int $unitId = null): ?AssetUnit
    {
        $query = AssetUnit::where('asset_id', $asset->id)->lockForUpdate();

        if ($unitId) {
            return $query->whereKey($unitId)->first();
        }

        return $query
            ->where(function ($builder) use ($asset) {
                $builder->where('department_id', $asset->department_id)
                    ->orWhere('custodian_id', $asset->current_holder_id ?: $asset->custodian_id);
            })
            ->orderBy('id')
            ->first();
    }

    public function recordMovement(AssetUnit $unit, string $type, array $values): AssetUnitMovement
    {
        return AssetUnitMovement::create(array_merge([
            'asset_unit_id' => $unit->id,
            'asset_id' => $unit->asset_id,
            'movement_type' => $type,
        ], $values));
    }
}

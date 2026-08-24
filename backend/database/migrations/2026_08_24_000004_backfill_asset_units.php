<?php

use App\Models\Asset;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('asset_units')) {
            return;
        }

        Asset::query()->withTrashed()->chunkById(100, function ($assets): void {
            foreach ($assets as $asset) {
                $existing = DB::table('asset_units')->where('asset_id', $asset->id)->count();
                $target = max(1, (int) ($asset->quantity ?? 1));

                for ($sequence = $existing + 1; $sequence <= $target; $sequence++) {
                    $assigned = $sequence > (int) ($asset->available_quantity ?? $target);

                    DB::table('asset_units')->insert([
                        'asset_id' => $asset->id,
                        'unit_code' => sprintf('%s-%03d', $asset->asset_id ?: 'ASSET-' . $asset->id, $sequence),
                        'serial_number' => $target === 1 ? $asset->serial_number : null,
                        'status' => $assigned ? 'assigned' : 'available',
                        'department_id' => $assigned ? $asset->department_id : null,
                        'custodian_id' => $assigned ? ($asset->current_holder_id ?: $asset->custodian_id) : null,
                        'condition' => $asset->condition ?: 'good',
                        'location' => $asset->location,
                        'created_at' => $asset->created_at ?: now(),
                        'updated_at' => $asset->updated_at ?: now(),
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        // Unit rows may be referenced by later assignments and transfers.
    }
};

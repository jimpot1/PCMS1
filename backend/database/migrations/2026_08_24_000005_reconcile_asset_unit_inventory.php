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
                $targetQuantity = max(1, (int) ($asset->quantity ?? 1));
                $activeAssigned = (int) DB::table('asset_assignments')
                    ->where('asset_id', $asset->id)
                    ->where('status', 'active')
                    ->sum('quantity');
                $available = max(0, $targetQuantity - $activeAssigned);

                $units = DB::table('asset_units')
                    ->where('asset_id', $asset->id)
                    ->orderBy('id')
                    ->get();

                for ($sequence = $units->count() + 1; $sequence <= $targetQuantity; $sequence++) {
                    DB::table('asset_units')->insert([
                        'asset_id' => $asset->id,
                        'unit_code' => sprintf('%s-%03d', $asset->asset_id ?: 'ASSET-' . $asset->id, $sequence),
                        'serial_number' => $targetQuantity === 1 ? $asset->serial_number : null,
                        'status' => 'available',
                        'department_id' => null,
                        'custodian_id' => null,
                        'condition' => $asset->condition ?: 'good',
                        'location' => $asset->location,
                        'created_at' => $asset->created_at ?: now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('assets')->where('id', $asset->id)->update([
                    'available_quantity' => $available,
                    'status' => $available > 0 ? 'available' : 'assigned',
                    'updated_at' => now(),
                ]);

                if ($activeAssigned === 0) {
                    DB::table('asset_units')->where('asset_id', $asset->id)->update([
                        'status' => 'available',
                        'department_id' => null,
                        'custodian_id' => null,
                        'updated_at' => now(),
                    ]);
                }
            }
        });
    }

    public function down(): void
    {
        // Reconciliation is data repair and must not remove valid unit records.
    }
};

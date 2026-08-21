<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('assets') || ! Schema::hasColumn('assets', 'available_quantity')) {
            return;
        }

        DB::table('assets')
            ->whereNull('available_quantity')
            ->orderBy('id')
            ->eachById(function (object $asset): void {
                $assigned = Schema::hasTable('asset_assignments')
                    ? (int) DB::table('asset_assignments')
                        ->where('asset_id', $asset->id)
                        ->where('status', 'active')
                        ->sum('quantity')
                    : 0;
                $available = max(0, (int) ($asset->quantity ?? 1) - $assigned);
                $updates = ['available_quantity' => $available];

                if (! in_array($asset->status, ['maintenance', 'damaged', 'disposed'], true)) {
                    $updates['status'] = $available > 0 ? 'available' : 'assigned';
                }

                DB::table('assets')->where('id', $asset->id)->update($updates);
            });
    }

    public function down(): void
    {
    }
};

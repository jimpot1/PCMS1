<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gate_passes') && ! Schema::hasColumn('gate_passes', 'asset_unit_id')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->foreignId('asset_unit_id')
                    ->nullable()
                    ->after('asset_id')
                    ->constrained('asset_units')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasTable('gate_passes') && ! Schema::hasColumn('gate_passes', 'holder_id')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->foreignUuid('holder_id')
                    ->nullable()
                    ->after('asset_unit_id')
                    ->constrained('users')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('gate_passes') && Schema::hasColumn('gate_passes', 'holder_id')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->dropConstrainedForeignId('holder_id');
            });
        }

        if (Schema::hasTable('gate_passes') && Schema::hasColumn('gate_passes', 'asset_unit_id')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                $table->dropConstrainedForeignId('asset_unit_id');
            });
        }
    }
};

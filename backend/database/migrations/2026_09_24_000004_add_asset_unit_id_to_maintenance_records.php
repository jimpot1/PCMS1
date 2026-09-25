<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('maintenance_records') || Schema::hasColumn('maintenance_records', 'asset_unit_id')) {
            return;
        }

        Schema::table('maintenance_records', function (Blueprint $table): void {
            $table->foreignId('asset_unit_id')
                ->nullable()
                ->after('asset_id')
                ->constrained('asset_units')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('maintenance_records') && Schema::hasColumn('maintenance_records', 'asset_unit_id')) {
            Schema::table('maintenance_records', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('asset_unit_id');
            });
        }
    }
};
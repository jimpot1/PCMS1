<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_scans') && ! Schema::hasColumn('audit_scans', 'asset_unit_id')) {
            Schema::table('audit_scans', function (Blueprint $table) {
                $table->foreignId('asset_unit_id')
                    ->nullable()
                    ->after('asset_id')
                    ->constrained('asset_units')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('audit_scans') && Schema::hasColumn('audit_scans', 'asset_unit_id')) {
            Schema::table('audit_scans', function (Blueprint $table) {
                $table->dropConstrainedForeignId('asset_unit_id');
            });
        }
    }
};

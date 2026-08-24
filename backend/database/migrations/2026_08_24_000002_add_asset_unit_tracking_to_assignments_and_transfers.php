<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('asset_assignments')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_assignments', 'asset_unit_id')) {
                    $table->foreignId('asset_unit_id')->nullable()->after('asset_id')->constrained('asset_units')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('asset_transfers')) {
            Schema::table('asset_transfers', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_transfers', 'asset_unit_id')) {
                    $table->foreignId('asset_unit_id')->nullable()->after('asset_id')->constrained('asset_units')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('asset_assignments')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                if (Schema::hasColumn('asset_assignments', 'asset_unit_id')) {
                    $table->dropConstrainedForeignId('asset_unit_id');
                }
            });
        }

        if (Schema::hasTable('asset_transfers')) {
            Schema::table('asset_transfers', function (Blueprint $table) {
                if (Schema::hasColumn('asset_transfers', 'asset_unit_id')) {
                    $table->dropConstrainedForeignId('asset_unit_id');
                }
            });
        }
    }
};

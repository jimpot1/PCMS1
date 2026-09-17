<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('asset_assignments') && ! Schema::hasColumn('asset_assignments', 'purchase_request_id')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                $table->foreignId('purchase_request_id')
                    ->nullable()
                    ->after('asset_unit_id')
                    ->constrained('purchase_requests')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('asset_assignments') && Schema::hasColumn('asset_assignments', 'purchase_request_id')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                $table->dropConstrainedForeignId('purchase_request_id');
            });
        }
    }
};

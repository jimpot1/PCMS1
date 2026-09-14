<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('purchase_requests')) {
            return;
        }

        Schema::table('purchase_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_requests', 'procurement_for_request_id')) {
                $table->foreignId('procurement_for_request_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('purchase_requests')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests') && Schema::hasColumn('purchase_requests', 'procurement_for_request_id')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->dropConstrainedForeignId('procurement_for_request_id');
            });
        }
    }
};

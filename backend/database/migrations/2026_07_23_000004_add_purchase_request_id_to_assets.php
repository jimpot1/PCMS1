<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assets') && !Schema::hasColumn('assets', 'purchase_request_id')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->foreignId('purchase_request_id')->nullable()->after('supplier_id')->constrained('purchase_requests');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('assets') && Schema::hasColumn('assets', 'purchase_request_id')) {
            Schema::table('assets', fn (Blueprint $table) => $table->dropConstrainedForeignId('purchase_request_id'));
        }
    }
};

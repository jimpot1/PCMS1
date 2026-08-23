<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_requests', 'replenishment_supply_id')) {
                $table->foreignId('replenishment_supply_id')
                    ->nullable()
                    ->after('department_id')
                    ->constrained('supplies');
            }

            if (! Schema::hasColumn('purchase_requests', 'auto_generated')) {
                $table->boolean('auto_generated')->default(false)->after('replenishment_supply_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_requests', 'replenishment_supply_id')) {
                $table->dropConstrainedForeignId('replenishment_supply_id');
            }

            if (Schema::hasColumn('purchase_requests', 'auto_generated')) {
                $table->dropColumn('auto_generated');
            }
        });
    }
};

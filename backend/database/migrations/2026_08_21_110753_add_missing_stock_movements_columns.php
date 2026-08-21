<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            if (! Schema::hasColumn('stock_movements', 'supply_id')) {
                $table->unsignedBigInteger('supply_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('stock_movements', 'movement_type')) {
                $table->string('movement_type', 40)->nullable()->after('supply_id');
            }
            if (! Schema::hasColumn('stock_movements', 'quantity')) {
                $table->integer('quantity')->nullable()->after('movement_type');
            }
            if (! Schema::hasColumn('stock_movements', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('quantity');
            }
            if (! Schema::hasColumn('stock_movements', 'requested_by')) {
                $table->char('requested_by', 36)->nullable()->after('department_id');
            }
            if (! Schema::hasColumn('stock_movements', 'issued_by')) {
                $table->char('issued_by', 36)->nullable()->after('requested_by');
            }
            if (! Schema::hasColumn('stock_movements', 'notes')) {
                $table->text('notes')->nullable()->after('issued_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            foreach (['notes', 'issued_by', 'requested_by', 'department_id', 'quantity', 'movement_type', 'supply_id'] as $column) {
                if (Schema::hasColumn('stock_movements', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

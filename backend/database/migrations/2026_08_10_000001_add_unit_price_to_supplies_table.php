<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            if (! Schema::hasColumn('supplies', 'unit_price')) {
                $table->decimal('unit_price', 14, 2)->default(0)->after('minimum_stock');
            }
        });
    }

    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            if (Schema::hasColumn('supplies', 'unit_price')) {
                $table->dropColumn('unit_price');
            }
        });
    }
};

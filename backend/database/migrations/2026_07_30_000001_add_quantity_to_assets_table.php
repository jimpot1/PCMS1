<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assets') && ! Schema::hasColumn('assets', 'quantity')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->integer('quantity')->default(1)->after('purchase_cost');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('assets') && Schema::hasColumn('assets', 'quantity')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->dropColumn('quantity');
            });
        }
    }
};

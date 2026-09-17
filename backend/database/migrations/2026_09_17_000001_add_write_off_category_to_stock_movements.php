<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('stock_movements', 'write_off_category')) {
            Schema::table('stock_movements', function (Blueprint $table): void {
                $table->string('write_off_category', 40)->nullable()->after('issued_by');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('stock_movements', 'write_off_category')) {
            Schema::table('stock_movements', function (Blueprint $table): void {
                $table->dropColumn('write_off_category');
            });
        }
    }
};

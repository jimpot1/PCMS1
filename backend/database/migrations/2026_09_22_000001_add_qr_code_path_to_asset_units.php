<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_units', function (Blueprint $table) {
            $table->string('qr_code_path')->nullable()->after('unit_code');
        });
    }

    public function down(): void
    {
        Schema::table('asset_units', function (Blueprint $table) {
            $table->dropColumn('qr_code_path');
        });
    }
};

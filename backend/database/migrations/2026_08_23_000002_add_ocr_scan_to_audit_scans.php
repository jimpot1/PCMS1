<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_scans') && ! Schema::hasColumn('audit_scans', 'ocr_scan_id')) {
            Schema::table('audit_scans', function (Blueprint $table) {
                $table->foreignId('ocr_scan_id')->nullable()->constrained('ocr_scans');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('audit_scans') && Schema::hasColumn('audit_scans', 'ocr_scan_id')) {
            Schema::table('audit_scans', function (Blueprint $table) {
                $table->dropForeign(['ocr_scan_id']);
                $table->dropColumn('ocr_scan_id');
            });
        }
    }
};
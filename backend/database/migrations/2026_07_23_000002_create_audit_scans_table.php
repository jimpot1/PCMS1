<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('audit_scans')) {
            Schema::create('audit_scans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('audit_id')->constrained('physical_audits');
                $table->foreignId('asset_id')->constrained('assets');
                $table->foreignId('found_department_id')->nullable()->constrained('departments');
                $table->string('result', 20);
                $table->timestamp('scanned_at')->useCurrent();
            });
        }

        if (Schema::hasTable('physical_audits') && ! Schema::hasColumn('physical_audits', 'department_id')) {
            Schema::table('physical_audits', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->constrained('departments');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('physical_audits') && Schema::hasColumn('physical_audits', 'department_id')) {
            Schema::table('physical_audits', fn (Blueprint $table) => $table->dropConstrainedForeignId('department_id'));
        }

        Schema::dropIfExists('audit_scans');
    }
};

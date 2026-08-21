<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('physical_audits', function (Blueprint $table) {
            if (! Schema::hasColumn('physical_audits', 'audit_number')) {
                $table->string('audit_number', 40)->nullable()->after('id');
            }
            if (! Schema::hasColumn('physical_audits', 'area')) {
                $table->string('area', 180)->nullable()->after('audit_number');
            }
            if (! Schema::hasColumn('physical_audits', 'auditor_id')) {
                $table->uuid('auditor_id')->nullable()->after('area');
            }
            if (! Schema::hasColumn('physical_audits', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('auditor_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('physical_audits', function (Blueprint $table) {
            foreach (['scheduled_at', 'auditor_id', 'area', 'audit_number'] as $column) {
                if (Schema::hasColumn('physical_audits', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

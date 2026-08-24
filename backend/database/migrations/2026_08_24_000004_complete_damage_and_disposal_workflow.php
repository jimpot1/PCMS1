<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('damage_reports', function (Blueprint $table) {
            if (! Schema::hasColumn('damage_reports', 'incident_type')) {
                $table->string('incident_type', 30)->default('damaged')->after('department_id');
            }
            if (! Schema::hasColumn('damage_reports', 'assessment_notes')) {
                $table->text('assessment_notes')->nullable()->after('description');
            }
            if (! Schema::hasColumn('damage_reports', 'assessed_by')) {
                $table->uuid('assessed_by')->nullable()->after('assessment_notes');
            }
            if (! Schema::hasColumn('damage_reports', 'assessed_at')) {
                $table->timestamp('assessed_at')->nullable()->after('assessed_by');
            }
            if (! Schema::hasColumn('damage_reports', 'disposal_reference')) {
                $table->string('disposal_reference', 120)->nullable()->after('status');
            }
            if (! Schema::hasColumn('damage_reports', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('disposal_reference');
            }
        });
    }

    public function down(): void
    {
        Schema::table('damage_reports', function (Blueprint $table) {
            foreach (['resolved_at', 'disposal_reference', 'assessed_at', 'assessed_by', 'assessment_notes', 'incident_type'] as $column) {
                if (Schema::hasColumn('damage_reports', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

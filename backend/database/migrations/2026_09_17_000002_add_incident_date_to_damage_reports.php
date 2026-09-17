<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('damage_reports', 'incident_date')) {
            Schema::table('damage_reports', function (Blueprint $table): void {
                $table->date('incident_date')->nullable()->after('incident_type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('damage_reports', 'incident_date')) {
            Schema::table('damage_reports', function (Blueprint $table): void {
                $table->dropColumn('incident_date');
            });
        }
    }
};

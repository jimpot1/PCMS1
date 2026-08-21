<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('anomaly_alerts') && !Schema::hasColumn('anomaly_alerts', 'found_department_id')) {
            Schema::table('anomaly_alerts', function (Blueprint $table) {
                $table->foreignId('found_department_id')->nullable()->constrained('departments');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('anomaly_alerts') && Schema::hasColumn('anomaly_alerts', 'found_department_id')) {
            Schema::table('anomaly_alerts', fn (Blueprint $table) => $table->dropConstrainedForeignId('found_department_id'));
        }
    }
};

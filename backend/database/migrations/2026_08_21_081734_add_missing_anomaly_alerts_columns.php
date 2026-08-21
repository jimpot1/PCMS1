<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anomaly_alerts', function (Blueprint $table) {
            if (! Schema::hasColumn('anomaly_alerts', 'source_type')) {
                $table->string('source_type', 40)->nullable()->after('id');
            }
            if (! Schema::hasColumn('anomaly_alerts', 'source_id')) {
                $table->string('source_id')->nullable()->after('source_type');
            }
            if (! Schema::hasColumn('anomaly_alerts', 'risk_score')) {
                $table->decimal('risk_score', 5, 2)->nullable()->after('source_id');
            }
            if (! Schema::hasColumn('anomaly_alerts', 'priority')) {
                $table->string('priority', 30)->nullable()->after('risk_score');
            }
            if (! Schema::hasColumn('anomaly_alerts', 'reason')) {
                $table->text('reason')->nullable()->after('priority');
            }
            if (! Schema::hasColumn('anomaly_alerts', 'recommended_action')) {
                $table->text('recommended_action')->nullable()->after('reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('anomaly_alerts', function (Blueprint $table) {
            foreach (['recommended_action', 'reason', 'priority', 'risk_score', 'source_id', 'source_type'] as $column) {
                if (Schema::hasColumn('anomaly_alerts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

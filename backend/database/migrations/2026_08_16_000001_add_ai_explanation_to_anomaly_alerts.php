<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('anomaly_alerts')) {
            return;
        }

        Schema::table('anomaly_alerts', function (Blueprint $table) {
            if (! Schema::hasColumn('anomaly_alerts', 'analysis_context')) {
                $table->json('analysis_context')->nullable();
            }

            if (! Schema::hasColumn('anomaly_alerts', 'ai_explanation')) {
                $table->text('ai_explanation')->nullable();
            }

            if (! Schema::hasColumn('anomaly_alerts', 'ai_explanation_status')) {
                $table->string('ai_explanation_status', 30)->nullable();
            }

            if (! Schema::hasColumn('anomaly_alerts', 'ai_explanation_error')) {
                $table->string('ai_explanation_error', 500)->nullable();
            }

            if (! Schema::hasColumn('anomaly_alerts', 'ai_explanation_generated_at')) {
                $table->timestamp('ai_explanation_generated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('anomaly_alerts')) {
            return;
        }

        Schema::table('anomaly_alerts', function (Blueprint $table) {
            foreach ([
                'ai_explanation_generated_at',
                'ai_explanation_error',
                'ai_explanation_status',
                'ai_explanation',
                'analysis_context',
            ] as $column) {
                if (Schema::hasColumn('anomaly_alerts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

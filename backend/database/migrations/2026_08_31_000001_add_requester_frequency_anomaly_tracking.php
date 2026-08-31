<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('anomaly_alerts', function (Blueprint $table) {
            // For tracking requester frequency anomalies
            if (!Schema::hasColumn('anomaly_alerts', 'requester_id')) {
                $table->uuid('requester_id')->nullable()->after('source_id');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'supply_id')) {
                $table->unsignedBigInteger('supply_id')->nullable()->after('requester_id');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('supply_id');
            }
            
            // For storing quantity data for quantity anomalies
            if (!Schema::hasColumn('anomaly_alerts', 'current_quantity')) {
                $table->integer('current_quantity')->nullable()->after('department_id');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'historical_average')) {
                $table->decimal('historical_average', 10, 2)->nullable()->after('current_quantity');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'historical_quantities')) {
                $table->json('historical_quantities')->nullable()->after('historical_average');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'historical_stddev')) {
                $table->decimal('historical_stddev', 10, 4)->nullable()->after('historical_quantities');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'z_score')) {
                $table->decimal('z_score', 10, 4)->nullable()->after('historical_stddev');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'historical_sample_size')) {
                $table->integer('historical_sample_size')->nullable()->after('z_score');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'similar_recent_spikes')) {
                $table->json('similar_recent_spikes')->nullable()->after('historical_sample_size');
            }
            
            // For tracking low stock info
            if (!Schema::hasColumn('anomaly_alerts', 'current_stock')) {
                $table->integer('current_stock')->nullable()->after('similar_recent_spikes');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'minimum_stock')) {
                $table->integer('minimum_stock')->nullable()->after('current_stock');
            }
            
            // For requester frequency anomalies
            if (!Schema::hasColumn('anomaly_alerts', 'request_count')) {
                $table->integer('request_count')->nullable()->after('minimum_stock');
            }
            
            if (!Schema::hasColumn('anomaly_alerts', 'request_frequency_context')) {
                $table->json('request_frequency_context')->nullable()->after('request_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('anomaly_alerts', function (Blueprint $table) {
            $columns = [
                'request_frequency_context', 'request_count', 'minimum_stock', 'current_stock',
                'similar_recent_spikes', 'historical_sample_size', 'z_score', 'historical_stddev',
                'historical_quantities', 'historical_average', 'current_quantity', 'department_id',
                'supply_id', 'requester_id'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('anomaly_alerts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

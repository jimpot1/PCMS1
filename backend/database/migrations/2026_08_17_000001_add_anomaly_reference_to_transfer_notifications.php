<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transfer_notifications')) {
            return;
        }

        Schema::table('transfer_notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('transfer_notifications', 'anomaly_alert_id')) {
                $table->foreignId('anomaly_alert_id')->nullable()->after('transfer_id')->constrained('anomaly_alerts')->nullOnDelete();
            }

            if (! Schema::hasColumn('transfer_notifications', 'navigation_target')) {
                $table->string('navigation_target')->nullable()->after('message');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('transfer_notifications')) {
            return;
        }

        Schema::table('transfer_notifications', function (Blueprint $table) {
            if (Schema::hasColumn('transfer_notifications', 'navigation_target')) {
                $table->dropColumn('navigation_target');
            }

            if (Schema::hasColumn('transfer_notifications', 'anomaly_alert_id')) {
                $table->dropConstrainedForeignId('anomaly_alert_id');
            }
        });
    }
};

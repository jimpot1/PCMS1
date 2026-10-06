<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('physical_audits', 'asset_snapshot_created_at')) {
            Schema::table('physical_audits', function (Blueprint $table) {
                $table->timestamp('asset_snapshot_created_at')->nullable();
            });
        }

        Schema::table('audit_asset_counts', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_asset_counts', 'asset_name_snapshot')) {
                $table->string('asset_name_snapshot')->nullable();
            }
            if (! Schema::hasColumn('audit_asset_counts', 'property_number_snapshot')) {
                $table->string('property_number_snapshot')->nullable();
            }
            if (! Schema::hasColumn('audit_asset_counts', 'department_id_snapshot')) {
                $table->unsignedBigInteger('department_id_snapshot')->nullable();
            }
            if (! Schema::hasColumn('audit_asset_counts', 'department_name_snapshot')) {
                $table->string('department_name_snapshot')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_asset_counts', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('audit_asset_counts', 'asset_name_snapshot') ? 'asset_name_snapshot' : null,
                Schema::hasColumn('audit_asset_counts', 'property_number_snapshot') ? 'property_number_snapshot' : null,
                Schema::hasColumn('audit_asset_counts', 'department_id_snapshot') ? 'department_id_snapshot' : null,
                Schema::hasColumn('audit_asset_counts', 'department_name_snapshot') ? 'department_name_snapshot' : null,
            ]);
            if ($columns) {
                $table->dropColumn($columns);
            }
        });

        if (Schema::hasColumn('physical_audits', 'asset_snapshot_created_at')) {
            Schema::table('physical_audits', function (Blueprint $table) {
                $table->dropColumn('asset_snapshot_created_at');
            });
        }
    }
};

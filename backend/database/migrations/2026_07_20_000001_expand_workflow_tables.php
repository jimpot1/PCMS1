<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('activity_logs')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                if (! Schema::hasColumn('activity_logs', 'action')) {
                    $table->string('action', 80)->nullable()->after('id')->index();
                }
            });
        }

        if (Schema::hasTable('asset_assignments')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_assignments', 'asset_id')) {
                    $table->foreignId('asset_id')->nullable()->after('id')->constrained('assets');
                }
                if (! Schema::hasColumn('asset_assignments', 'assigned_to')) {
                    $table->uuid('assigned_to')->nullable()->after('asset_id');
                }
                if (! Schema::hasColumn('asset_assignments', 'assigned_by')) {
                    $table->uuid('assigned_by')->nullable()->after('assigned_to');
                }
                if (! Schema::hasColumn('asset_assignments', 'department_id')) {
                    $table->foreignId('department_id')->nullable()->after('assigned_by')->constrained('departments');
                }
                if (! Schema::hasColumn('asset_assignments', 'assigned_at')) {
                    $table->timestamp('assigned_at')->nullable()->after('department_id');
                }
                if (! Schema::hasColumn('asset_assignments', 'returned_at')) {
                    $table->timestamp('returned_at')->nullable()->after('assigned_at');
                }
                if (! Schema::hasColumn('asset_assignments', 'notes')) {
                    $table->text('notes')->nullable()->after('status');
                }
            });
        }

        if (Schema::hasTable('asset_transfers')) {
            Schema::table('asset_transfers', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_transfers', 'transfer_number')) {
                    $table->string('transfer_number', 40)->nullable()->after('id')->unique();
                }
                if (! Schema::hasColumn('asset_transfers', 'asset_id')) {
                    $table->foreignId('asset_id')->nullable()->after('transfer_number')->constrained('assets');
                }
                if (! Schema::hasColumn('asset_transfers', 'from_department_id')) {
                    $table->foreignId('from_department_id')->nullable()->after('asset_id')->constrained('departments');
                }
                if (! Schema::hasColumn('asset_transfers', 'to_department_id')) {
                    $table->foreignId('to_department_id')->nullable()->after('from_department_id')->constrained('departments');
                }
                if (! Schema::hasColumn('asset_transfers', 'requested_by')) {
                    $table->uuid('requested_by')->nullable()->after('to_department_id');
                }
                if (! Schema::hasColumn('asset_transfers', 'approved_by')) {
                    $table->uuid('approved_by')->nullable()->after('requested_by');
                }
                if (! Schema::hasColumn('asset_transfers', 'reason')) {
                    $table->text('reason')->nullable()->after('status');
                }
                if (! Schema::hasColumn('asset_transfers', 'risk_score')) {
                    $table->decimal('risk_score', 5, 2)->default(0)->after('reason');
                }
            });
        }

        if (Schema::hasTable('ocr_scans')) {
            Schema::table('ocr_scans', function (Blueprint $table) {
                if (! Schema::hasColumn('ocr_scans', 'asset_id')) {
                    $table->foreignId('asset_id')->nullable()->after('id')->constrained('assets');
                }
                if (! Schema::hasColumn('ocr_scans', 'image_path')) {
                    $table->string('image_path')->nullable()->after('asset_id');
                }
                if (! Schema::hasColumn('ocr_scans', 'extracted_payload')) {
                    $table->json('extracted_payload')->nullable()->after('image_path');
                }
                if (! Schema::hasColumn('ocr_scans', 'confidence_score')) {
                    $table->decimal('confidence_score', 5, 2)->default(0)->after('extracted_payload');
                }
                if (! Schema::hasColumn('ocr_scans', 'confirmed_by')) {
                    $table->uuid('confirmed_by')->nullable()->after('confidence_score');
                }
            });
        }
    }

    public function down(): void
    {
        //
    }
};

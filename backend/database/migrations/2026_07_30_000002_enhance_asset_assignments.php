<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('asset_assignments')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_assignments', 'assignment_type')) {
                    $table->string('assignment_type', 30)->default('permanent')->after('department_id');
                }
                if (! Schema::hasColumn('asset_assignments', 'quantity')) {
                    $table->integer('quantity')->default(1)->after('assignment_type');
                }
                if (! Schema::hasColumn('asset_assignments', 'purpose')) {
                    $table->text('purpose')->nullable()->after('quantity');
                }
                if (! Schema::hasColumn('asset_assignments', 'condition_before')) {
                    $table->string('condition_before', 40)->nullable()->after('purpose');
                }
                if (! Schema::hasColumn('asset_assignments', 'condition_after')) {
                    $table->string('condition_after', 40)->nullable()->after('condition_before');
                }
                if (! Schema::hasColumn('asset_assignments', 'photo_path')) {
                    $table->string('photo_path')->nullable()->after('condition_after');
                }
                if (! Schema::hasColumn('asset_assignments', 'accepted_at')) {
                    $table->timestamp('accepted_at')->nullable()->after('returned_at');
                }
                if (! Schema::hasColumn('asset_assignments', 'employee_signature')) {
                    $table->text('employee_signature')->nullable()->after('accepted_at');
                }
                if (! Schema::hasColumn('asset_assignments', 'custodian_signature')) {
                    $table->text('custodian_signature')->nullable()->after('employee_signature');
                }
                if (! Schema::hasColumn('asset_assignments', 'return_notes')) {
                    $table->text('return_notes')->nullable()->after('notes');
                }
                if (! Schema::hasColumn('asset_assignments', 'approval_status')) {
                    $table->string('approval_status', 40)->default('not_required')->after('status');
                }
                if (! Schema::hasColumn('asset_assignments', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('approval_status');
                }
            });
        }

        if (Schema::hasTable('assets')) {
            Schema::table('assets', function (Blueprint $table) {
                if (! Schema::hasColumn('assets', 'available_quantity')) {
                    $table->integer('available_quantity')->nullable()->after('quantity');
                }
                if (! Schema::hasColumn('assets', 'current_holder_id')) {
                    $table->uuid('current_holder_id')->nullable()->after('custodian_id');
                }
                if (! Schema::hasColumn('assets', 'last_assigned_at')) {
                    $table->timestamp('last_assigned_at')->nullable()->after('current_holder_id');
                }
            });
        }

        if (! Schema::hasTable('assignment_history')) {
            Schema::create('assignment_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->nullable()->constrained('asset_assignments');
                $table->foreignId('asset_id')->nullable()->constrained('assets');
                $table->uuid('employee_id')->nullable();
                $table->string('event_type', 60);
                $table->json('payload')->nullable();
                $table->uuid('performed_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('accountability_forms')) {
            Schema::create('accountability_forms', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained('asset_assignments');
                $table->string('form_number', 50)->unique();
                $table->json('payload')->nullable();
                $table->timestamp('generated_at')->useCurrent();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('return_records')) {
            Schema::create('return_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained('asset_assignments');
                $table->foreignId('asset_id')->constrained('assets');
                $table->uuid('returned_by')->nullable();
                $table->string('condition_after', 40);
                $table->text('inspection_notes')->nullable();
                $table->string('status', 40)->default('completed');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('assignment_notifications')) {
            Schema::create('assignment_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->nullable()->constrained('asset_assignments');
                $table->foreignId('asset_id')->nullable()->constrained('assets');
                $table->uuid('recipient_id')->nullable();
                $table->string('recipient_role', 80)->nullable();
                $table->string('type', 60);
                $table->string('title', 180);
                $table->text('message')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('damage_reports')) {
            Schema::table('damage_reports', function (Blueprint $table) {
                if (! Schema::hasColumn('damage_reports', 'asset_id')) {
                    $table->foreignId('asset_id')->nullable()->after('id')->constrained('assets');
                }
                if (! Schema::hasColumn('damage_reports', 'reported_by')) {
                    $table->uuid('reported_by')->nullable()->after('asset_id');
                }
                if (! Schema::hasColumn('damage_reports', 'department_id')) {
                    $table->foreignId('department_id')->nullable()->after('reported_by')->constrained('departments');
                }
                if (! Schema::hasColumn('damage_reports', 'severity')) {
                    $table->string('severity', 40)->nullable()->after('department_id');
                }
                if (! Schema::hasColumn('damage_reports', 'description')) {
                    $table->text('description')->nullable()->after('severity');
                }
                if (! Schema::hasColumn('damage_reports', 'photo_path')) {
                    $table->string('photo_path')->nullable()->after('description');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('return_records');
        Schema::dropIfExists('assignment_notifications');
        Schema::dropIfExists('accountability_forms');
        Schema::dropIfExists('assignment_history');
    }
};

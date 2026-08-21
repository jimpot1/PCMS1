<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('asset_transfers')) {
            Schema::table('asset_transfers', function (Blueprint $table) {
                if (! Schema::hasColumn('asset_transfers', 'to_custodian_id')) {
                    $table->uuid('to_custodian_id')->nullable()->after('to_department_id');
                }
                if (! Schema::hasColumn('asset_transfers', 'from_custodian_id')) {
                    $table->uuid('from_custodian_id')->nullable()->after('to_custodian_id');
                }
                if (! Schema::hasColumn('asset_transfers', 'quantity')) {
                    $table->integer('quantity')->default(1)->after('from_custodian_id');
                }
                if (! Schema::hasColumn('asset_transfers', 'transfer_type')) {
                    $table->string('transfer_type', 30)->default('permanent')->after('quantity');
                }
                if (! Schema::hasColumn('asset_transfers', 'expected_return_date')) {
                    $table->date('expected_return_date')->nullable()->after('transfer_type');
                }
                if (! Schema::hasColumn('asset_transfers', 'transfer_date')) {
                    $table->timestamp('transfer_date')->nullable()->after('expected_return_date');
                }
                if (! Schema::hasColumn('asset_transfers', 'actual_quantity')) {
                    $table->integer('actual_quantity')->nullable()->after('transfer_date');
                }
                if (! Schema::hasColumn('asset_transfers', 'condition_before')) {
                    $table->string('condition_before', 40)->nullable()->after('actual_quantity');
                }
                if (! Schema::hasColumn('asset_transfers', 'condition_after')) {
                    $table->string('condition_after', 40)->nullable()->after('condition_before');
                }
                if (! Schema::hasColumn('asset_transfers', 'photo_before_path')) {
                    $table->string('photo_before_path')->nullable()->after('condition_after');
                }
                if (! Schema::hasColumn('asset_transfers', 'photo_after_path')) {
                    $table->string('photo_after_path')->nullable()->after('photo_before_path');
                }
                if (! Schema::hasColumn('asset_transfers', 'receiving_signature')) {
                    $table->text('receiving_signature')->nullable()->after('photo_after_path');
                }
                if (! Schema::hasColumn('asset_transfers', 'releasing_signature')) {
                    $table->text('releasing_signature')->nullable()->after('receiving_signature');
                }
                if (! Schema::hasColumn('asset_transfers', 'department_approved_by')) {
                    $table->uuid('department_approved_by')->nullable()->after('approved_by');
                }
                if (! Schema::hasColumn('asset_transfers', 'executed_by')) {
                    $table->uuid('executed_by')->nullable()->after('department_approved_by');
                }
                if (! Schema::hasColumn('asset_transfers', 'approval_notes')) {
                    $table->text('approval_notes')->nullable()->after('reason');
                }
                if (! Schema::hasColumn('asset_transfers', 'revision_notes')) {
                    $table->text('revision_notes')->nullable()->after('approval_notes');
                }
                if (! Schema::hasColumn('asset_transfers', 'hold_reason')) {
                    $table->text('hold_reason')->nullable()->after('revision_notes');
                }
                if (! Schema::hasColumn('asset_transfers', 'remarks')) {
                    $table->text('remarks')->nullable()->after('hold_reason');
                }
            });
        }

        if (Schema::hasTable('assets')) {
            Schema::table('assets', function (Blueprint $table) {
                if (! Schema::hasColumn('assets', 'last_transfer_at')) {
                    $table->timestamp('last_transfer_at')->nullable()->after('last_assigned_at');
                }
            });
        }

        if (! Schema::hasTable('transfer_history')) {
            Schema::create('transfer_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transfer_id')->nullable()->constrained('asset_transfers');
                $table->foreignId('asset_id')->nullable()->constrained('assets');
                $table->string('transfer_number', 40)->nullable();
                $table->string('event_type', 60);
                $table->json('payload')->nullable();
                $table->uuid('performed_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('transfer_notifications')) {
            Schema::create('transfer_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transfer_id')->nullable()->constrained('asset_transfers');
                $table->uuid('recipient_id')->nullable();
                $table->string('recipient_role', 80)->nullable();
                $table->string('type', 60);
                $table->string('title', 180);
                $table->text('message')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_notifications');
        Schema::dropIfExists('transfer_history');
    }
};

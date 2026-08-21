<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'password_hash')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('password_hash')->nullable()->after('email');
            });
        }

        if (Schema::hasTable('gate_passes')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                if (!Schema::hasColumn('gate_passes', 'requested_by')) {
                    $table->uuid('requested_by')->nullable();
                }

                if (!Schema::hasColumn('gate_passes', 'department_id')) {
                    $table->foreignId('department_id')->nullable()->after('requested_by')->constrained('departments');
                }

                if (!Schema::hasColumn('gate_passes', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('status');
                }
            });
        }

        if (Schema::hasTable('purchase_requests') && !Schema::hasColumn('purchase_requests', 'rejection_reason')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->after('status');
            });
        }

        if (Schema::hasTable('asset_transfers') && !Schema::hasColumn('asset_transfers', 'rejection_reason')) {
            Schema::table('asset_transfers', function (Blueprint $table) {
                $table->text('rejection_reason')->nullable()->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('asset_transfers') && Schema::hasColumn('asset_transfers', 'rejection_reason')) {
            Schema::table('asset_transfers', fn (Blueprint $table) => $table->dropColumn('rejection_reason'));
        }

        if (Schema::hasTable('purchase_requests') && Schema::hasColumn('purchase_requests', 'rejection_reason')) {
            Schema::table('purchase_requests', fn (Blueprint $table) => $table->dropColumn('rejection_reason'));
        }

        if (Schema::hasTable('gate_passes')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                if (Schema::hasColumn('gate_passes', 'rejection_reason')) {
                    $table->dropColumn('rejection_reason');
                }

                if (Schema::hasColumn('gate_passes', 'department_id')) {
                    $table->dropConstrainedForeignId('department_id');
                }

                if (Schema::hasColumn('gate_passes', 'requested_by')) {
                    $table->dropColumn('requested_by');
                }
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'password_hash')) {
            Schema::table('users', fn (Blueprint $table) => $table->dropColumn('password_hash'));
        }
    }
};

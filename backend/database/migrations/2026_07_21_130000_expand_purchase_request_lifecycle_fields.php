<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchase_requests')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_requests', 'request_type')) {
                    $table->string('request_type', 40)->nullable()->after('status');
                }

                if (!Schema::hasColumn('purchase_requests', 'department_name')) {
                    $table->string('department_name')->nullable()->after('request_type');
                }

                if (!Schema::hasColumn('purchase_requests', 'unit')) {
                    $table->string('unit')->nullable()->after('department_name');
                }

                if (!Schema::hasColumn('purchase_requests', 'branch')) {
                    $table->string('branch')->nullable()->after('unit');
                }

                if (!Schema::hasColumn('purchase_requests', 'purpose')) {
                    $table->text('purpose')->nullable()->after('branch');
                }

                if (!Schema::hasColumn('purchase_requests', 'requested_by_name')) {
                    $table->string('requested_by_name')->nullable()->after('purpose');
                }

                if (!Schema::hasColumn('purchase_requests', 'line_items')) {
                    $table->json('line_items')->nullable()->after('requested_by_name');
                }

                if (!Schema::hasColumn('purchase_requests', 'released_by')) {
                    $table->uuid('released_by')->nullable()->after('line_items');
                }

                if (!Schema::hasColumn('purchase_requests', 'released_at')) {
                    $table->timestamp('released_at')->nullable()->after('released_by');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_requests', 'released_at')) {
                    $table->dropColumn('released_at');
                }

                if (Schema::hasColumn('purchase_requests', 'released_by')) {
                    $table->dropColumn('released_by');
                }

                if (Schema::hasColumn('purchase_requests', 'line_items')) {
                    $table->dropColumn('line_items');
                }

                if (Schema::hasColumn('purchase_requests', 'requested_by_name')) {
                    $table->dropColumn('requested_by_name');
                }

                if (Schema::hasColumn('purchase_requests', 'purpose')) {
                    $table->dropColumn('purpose');
                }

                if (Schema::hasColumn('purchase_requests', 'branch')) {
                    $table->dropColumn('branch');
                }

                if (Schema::hasColumn('purchase_requests', 'unit')) {
                    $table->dropColumn('unit');
                }

                if (Schema::hasColumn('purchase_requests', 'department_name')) {
                    $table->dropColumn('department_name');
                }

                if (Schema::hasColumn('purchase_requests', 'request_type')) {
                    $table->dropColumn('request_type');
                }
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_requests', 'request_number')) {
                $table->string('request_number', 40)->nullable()->after('id');
            }
            if (! Schema::hasColumn('purchase_requests', 'requested_by')) {
                $table->char('requested_by', 36)->nullable()->after('request_number');
            }
            if (! Schema::hasColumn('purchase_requests', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('requested_by');
            }
            if (! Schema::hasColumn('purchase_requests', 'current_stage')) {
                $table->string('current_stage', 40)->nullable()->after('department_id');
            }
            if (! Schema::hasColumn('purchase_requests', 'priority')) {
                $table->string('priority', 30)->nullable()->after('current_stage');
            }
            if (! Schema::hasColumn('purchase_requests', 'total_amount')) {
                $table->decimal('total_amount', 14, 2)->nullable()->after('priority');
            }
            if (! Schema::hasColumn('purchase_requests', 'date_needed')) {
                $table->date('date_needed')->nullable()->after('total_amount');
            }
            if (! Schema::hasColumn('purchase_requests', 'attachment_path')) {
                $table->string('attachment_path', 255)->nullable()->after('date_needed');
            }
            if (! Schema::hasColumn('purchase_requests', 'workflow_destination')) {
                $table->string('workflow_destination', 40)->nullable()->after('attachment_path');
            }
            if (! Schema::hasColumn('purchase_requests', 'timeline')) {
                $table->json('timeline')->nullable()->after('workflow_destination');
            }
            if (! Schema::hasColumn('purchase_requests', 'workflow_history')) {
                $table->json('workflow_history')->nullable()->after('timeline');
            }
            if (! Schema::hasColumn('purchase_requests', 'revision_notes')) {
                $table->text('revision_notes')->nullable()->after('rejection_reason');
            }
            if (! Schema::hasColumn('purchase_requests', 'revision_requested_at')) {
                $table->timestamp('revision_requested_at')->nullable()->after('revision_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'more_information_notes')) {
                $table->text('more_information_notes')->nullable()->after('revision_requested_at');
            }
            if (! Schema::hasColumn('purchase_requests', 'more_information_requested_at')) {
                $table->timestamp('more_information_requested_at')->nullable()->after('more_information_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'return_for_review_notes')) {
                $table->text('return_for_review_notes')->nullable()->after('more_information_requested_at');
            }
            if (! Schema::hasColumn('purchase_requests', 'returned_for_review_at')) {
                $table->timestamp('returned_for_review_at')->nullable()->after('return_for_review_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'conditional_approval_notes')) {
                $table->text('conditional_approval_notes')->nullable()->after('returned_for_review_at');
            }
            if (! Schema::hasColumn('purchase_requests', 'escalation_notes')) {
                $table->text('escalation_notes')->nullable()->after('conditional_approval_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable()->after('escalation_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            foreach ([
                'escalated_at',
                'escalation_notes',
                'conditional_approval_notes',
                'returned_for_review_at',
                'return_for_review_notes',
                'more_information_requested_at',
                'more_information_notes',
                'revision_requested_at',
                'revision_notes',
                'workflow_history',
                'timeline',
                'workflow_destination',
                'attachment_path',
                'date_needed',
                'total_amount',
                'priority',
                'current_stage',
                'department_id',
                'requested_by',
                'request_number',
            ] as $column) {
                if (Schema::hasColumn('purchase_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

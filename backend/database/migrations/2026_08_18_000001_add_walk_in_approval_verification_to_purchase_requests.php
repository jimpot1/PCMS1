<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('purchase_requests')) {
            return;
        }

        Schema::table('purchase_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('purchase_requests', 'approval_document_path')) {
                $table->string('approval_document_path')->nullable();
            }

            if (! Schema::hasColumn('purchase_requests', 'approval_status')) {
                $table->string('approval_status', 40)->default('not_required');
            }

            if (! Schema::hasColumn('purchase_requests', 'verified_by')) {
                $table->uuid('verified_by')->nullable();
            }

            if (! Schema::hasColumn('purchase_requests', 'verified_at')) {
                $table->timestamp('verified_at')->nullable();
            }

            if (! Schema::hasColumn('purchase_requests', 'verification_notes')) {
                $table->text('verification_notes')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('purchase_requests')) {
            return;
        }

        Schema::table('purchase_requests', function (Blueprint $table) {
            foreach (['verification_notes', 'verified_at', 'verified_by', 'approval_status', 'approval_document_path'] as $column) {
                if (Schema::hasColumn('purchase_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

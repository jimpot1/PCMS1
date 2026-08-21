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
                if (!Schema::hasColumn('purchase_requests', 'receipt_number')) {
                    $table->string('receipt_number', 40)->nullable()->after('released_at');
                }

                if (!Schema::hasColumn('purchase_requests', 'receipt_document_path')) {
                    $table->string('receipt_document_path')->nullable()->after('receipt_number');
                }

                if (!Schema::hasColumn('purchase_requests', 'receipt_generated_at')) {
                    $table->timestamp('receipt_generated_at')->nullable()->after('receipt_document_path');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_requests', 'receipt_generated_at')) {
                    $table->dropColumn('receipt_generated_at');
                }

                if (Schema::hasColumn('purchase_requests', 'receipt_document_path')) {
                    $table->dropColumn('receipt_document_path');
                }

                if (Schema::hasColumn('purchase_requests', 'receipt_number')) {
                    $table->dropColumn('receipt_number');
                }
            });
        }
    }
};

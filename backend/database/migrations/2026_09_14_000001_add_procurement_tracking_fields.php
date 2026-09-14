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
            // Procurement tracking fields
            if (! Schema::hasColumn('purchase_requests', 'expected_delivery_date')) {
                $table->timestamp('expected_delivery_date')->nullable()->after('date_needed');
            }
            if (! Schema::hasColumn('purchase_requests', 'stock_received_date')) {
                $table->timestamp('stock_received_date')->nullable()->after('expected_delivery_date');
            }
            if (! Schema::hasColumn('purchase_requests', 'received_quantity')) {
                $table->json('received_quantity')->nullable()->after('stock_received_date');
            }
            if (! Schema::hasColumn('purchase_requests', 'qc_status')) {
                $table->string('qc_status')->nullable()->default('pending')->after('received_quantity');
                // pending, in_progress, passed, failed, hold
            }
            if (! Schema::hasColumn('purchase_requests', 'qc_notes')) {
                $table->text('qc_notes')->nullable()->after('qc_status');
            }
            if (! Schema::hasColumn('purchase_requests', 'qc_performed_by')) {
                $table->uuid('qc_performed_by')->nullable()->after('qc_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'qc_performed_at')) {
                $table->timestamp('qc_performed_at')->nullable()->after('qc_performed_by');
            }
            if (! Schema::hasColumn('purchase_requests', 'receiving_notes')) {
                $table->text('receiving_notes')->nullable()->after('qc_performed_at');
            }
            if (! Schema::hasColumn('purchase_requests', 'receiving_photo_path')) {
                $table->string('receiving_photo_path')->nullable()->after('receiving_notes');
            }
            if (! Schema::hasColumn('purchase_requests', 'procurement_status')) {
                $table->string('procurement_status')->nullable()->default('draft')->after('receiving_photo_path');
                // draft, submitted, processing, supplier_assigned, in_transit, received, qc_passed, ready_to_release
            }
            if (! Schema::hasColumn('purchase_requests', 'procurement_timeline')) {
                $table->json('procurement_timeline')->nullable()->after('procurement_status');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->dropColumn([
                    'expected_delivery_date',
                    'stock_received_date',
                    'received_quantity',
                    'qc_status',
                    'qc_notes',
                    'qc_performed_by',
                    'qc_performed_at',
                    'receiving_notes',
                    'receiving_photo_path',
                    'procurement_status',
                    'procurement_timeline',
                ]);
            });
        }
    }
};

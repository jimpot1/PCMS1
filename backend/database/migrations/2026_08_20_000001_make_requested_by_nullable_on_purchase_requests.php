<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Walk-in requests filed for a person with no Requester account
     * (walk_in_has_account = false) intentionally leave requested_by empty.
     * The column was originally created NOT NULL, so those inserts fail
     * with a "null value in column requested_by" constraint violation.
     * This migration relaxes the column to nullable so walk-ins without
     * an account can be saved.
     */
    public function up(): void
    {
        if (Schema::hasTable('purchase_requests') && Schema::hasColumn('purchase_requests', 'requested_by')) {
            DB::statement('ALTER TABLE purchase_requests ALTER COLUMN requested_by DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests') && Schema::hasColumn('purchase_requests', 'requested_by')) {
            // Only re-add the NOT NULL constraint if no existing rows would violate it.
            $hasNulls = DB::table('purchase_requests')->whereNull('requested_by')->exists();
            if (! $hasNulls) {
                DB::statement('ALTER TABLE purchase_requests ALTER COLUMN requested_by SET NOT NULL');
            }
        }
    }
};
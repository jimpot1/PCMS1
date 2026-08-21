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
                if (!Schema::hasColumn('purchase_requests', 'is_walk_in')) {
                    $table->boolean('is_walk_in')->default(false)->after('request_type');
                }

                if (!Schema::hasColumn('purchase_requests', 'walk_in_created_by')) {
                    // System Admin or PPMO Staff account that filed the walk-in on the requester's behalf.
                    $table->uuid('walk_in_created_by')->nullable()->after('is_walk_in');
                }

                if (!Schema::hasColumn('purchase_requests', 'walk_in_requester_name')) {
                    $table->string('walk_in_requester_name')->nullable()->after('walk_in_created_by');
                }

                if (!Schema::hasColumn('purchase_requests', 'walk_in_requester_contact')) {
                    $table->string('walk_in_requester_contact')->nullable()->after('walk_in_requester_name');
                }

                if (!Schema::hasColumn('purchase_requests', 'walk_in_has_account')) {
                    // true = requested_by references a real Requester account (staff filed it for them)
                    // false = no account exists, walk_in_requester_name/contact are the only record
                    $table->boolean('walk_in_has_account')->default(false)->after('walk_in_requester_contact');
                }

                if (!Schema::hasColumn('purchase_requests', 'walk_in_notes')) {
                    $table->text('walk_in_notes')->nullable()->after('walk_in_has_account');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_requests')) {
            Schema::table('purchase_requests', function (Blueprint $table) {
                foreach (['walk_in_notes', 'walk_in_has_account', 'walk_in_requester_contact', 'walk_in_requester_name', 'walk_in_created_by', 'is_walk_in'] as $column) {
                    if (Schema::hasColumn('purchase_requests', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
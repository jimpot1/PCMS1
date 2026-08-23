<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('clearance_requests')) {
            Schema::create('clearance_requests', function (Blueprint $table) {
                $table->id();
                $table->uuid('user_id');
                $table->string('status', 40)->default('pending');
                $table->string('decision', 40)->default('pending');
                $table->json('missing_items')->nullable();
                $table->json('verified_items')->nullable();
                $table->json('accountability_form_ids')->nullable();
                $table->text('notes')->nullable();
                $table->uuid('finalized_by')->nullable();
                $table->timestamp('finalized_at')->nullable();
                $table->timestamps();
            });
        } elseif (! Schema::hasColumn('clearance_requests', 'accountability_form_ids')) {
            Schema::table('clearance_requests', function (Blueprint $table) {
                $table->json('accountability_form_ids')->nullable()->after('verified_items');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clearance_requests') && Schema::hasColumn('clearance_requests', 'accountability_form_ids')) {
            Schema::table('clearance_requests', function (Blueprint $table) {
                $table->dropColumn('accountability_form_ids');
            });
        }
    }
};
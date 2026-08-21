<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('gate_passes')) {
            Schema::table('gate_passes', function (Blueprint $table) {
                if (! Schema::hasColumn('gate_passes', 'destination')) {
                    $table->string('destination')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'vehicle')) {
                    $table->string('vehicle')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'driver')) {
                    $table->string('driver')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'quantity')) {
                    $table->integer('quantity')->default(1);
                }
                if (! Schema::hasColumn('gate_passes', 'condition_before')) {
                    $table->string('condition_before', 40)->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'condition_after')) {
                    $table->string('condition_after', 40)->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'release_date')) {
                    $table->timestamp('release_date')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'receiving_signature')) {
                    $table->text('receiving_signature')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'receiving_photo_path')) {
                    $table->string('receiving_photo_path')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'security_remarks')) {
                    $table->text('security_remarks')->nullable();
                }
                if (! Schema::hasColumn('gate_passes', 'attachment_path')) {
                    $table->string('attachment_path')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        //
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('audit_asset_counts')) {
            Schema::create('audit_asset_counts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('audit_id')->constrained('physical_audits')->cascadeOnDelete();
                $table->foreignId('asset_id')->constrained('assets');
                $table->integer('expected_quantity')->default(0);
                $table->integer('counted_quantity')->nullable();
                $table->integer('variance')->nullable();
                $table->string('status', 20)->default('uncounted');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['audit_id', 'asset_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_asset_counts');
    }
};
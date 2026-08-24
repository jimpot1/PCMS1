<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('asset_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('unit_code')->nullable()->unique();
            $table->string('serial_number')->nullable();
            $table->string('status', 40)->default('available');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->uuid('custodian_id')->nullable();
            $table->string('condition', 40)->nullable()->default('good');
            $table->string('location')->nullable();
            $table->timestamps();

            $table->index(['asset_id', 'status']);
            $table->index(['department_id', 'custodian_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_units');
    }
};

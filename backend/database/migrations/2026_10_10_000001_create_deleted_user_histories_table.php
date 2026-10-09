<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deleted_user_histories', function (Blueprint $table) {
            $table->id();
            $table->uuid('deleted_user_id')->index();
            $table->string('employee_id', 40)->nullable();
            $table->string('first_name', 80)->nullable();
            $table->string('middle_name', 80)->nullable();
            $table->string('last_name', 80)->nullable();
            $table->string('full_name', 255)->nullable();
            $table->string('email', 160)->index();
            $table->string('role', 80);
            $table->string('department', 160)->nullable();
            $table->string('status', 40);
            $table->uuid('deleted_by_id')->nullable()->index();
            $table->string('deleted_by_name', 255)->nullable();
            $table->string('deleted_by_email', 160)->nullable();
            $table->timestamp('deleted_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deleted_user_histories');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            if (! Schema::hasColumn('users', 'id') || ! Schema::getColumnType('users', 'id') || Schema::getColumnType('users', 'id') === 'integer') {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropPrimary(['id']);
                });

                DB::statement('ALTER TABLE users RENAME TO users_old');
                Schema::create('users', function (Blueprint $table) {
                    $table->uuid('id')->primary();
                    $table->string('employee_id')->nullable()->index();
                    $table->string('first_name')->nullable();
                    $table->string('middle_name')->nullable();
                    $table->string('last_name')->nullable();
                    $table->string('full_name')->nullable();
                    $table->string('email')->unique();
                    $table->string('password_hash')->nullable();
                    $table->string('role')->default('Department User');
                    $table->string('department')->nullable();
                    $table->string('status')->default('active');
                    $table->rememberToken();
                    $table->timestamps();
                });
                DB::statement('INSERT INTO users (id, employee_id, first_name, middle_name, last_name, full_name, email, password_hash, role, department, status, remember_token, created_at, updated_at) SELECT CAST(id AS TEXT), employee_id, first_name, middle_name, last_name, full_name, email, password_hash, role, department, status, remember_token, created_at, updated_at FROM users_old');
                DB::statement('DROP TABLE users_old');
            }

            if (!Schema::hasColumn('users', 'password_hash')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('password_hash')->nullable()->after('email');
                });
            }

            if (Schema::hasColumn('users', 'password') && !Schema::hasColumn('users', 'password_hash')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->renameColumn('password', 'password_hash');
                });
            }

            if (!Schema::hasColumn('users', 'full_name')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('full_name')->nullable()->after('last_name');
                });
            }

            if (!Schema::hasColumn('users', 'remember_token')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->rememberToken();
                });
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            if (Schema::hasColumn('users', 'full_name')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('full_name');
                });
            }

            if (Schema::hasColumn('users', 'password_hash') && !Schema::hasColumn('users', 'password')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('password_hash');
                    $table->string('password')->nullable()->after('email');
                });
            }
        }
    }
};

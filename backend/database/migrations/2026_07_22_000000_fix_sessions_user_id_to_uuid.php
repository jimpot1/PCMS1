<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The original sessions migration used $table->foreignId('user_id'),
     * which creates a BIGINT UNSIGNED column. Our users.id is a UUID
     * (string), so Laravel's session driver fails with:
     * "invalid input syntax for type bigint" whenever it tries to store
     * the authenticated user's id in the sessions table.
     */
    public function up(): void
    {
        if (! Schema::hasTable('sessions')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            // Drop the index Laravel put on the bigint column, change the
            // column type to a plain string/uuid-compatible column, then
            // recreate the index.
            DB::statement('DROP INDEX IF EXISTS sessions_user_id_index');
            DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text');
            DB::statement('CREATE INDEX sessions_user_id_index ON sessions (user_id)');
        } elseif ($driver === 'sqlite') {
            // SQLite is dynamically typed, so string UUIDs already fit in
            // whatever column type is declared. Nothing to change.
        } else {
            // mysql / mariadb
            DB::statement('ALTER TABLE sessions MODIFY user_id VARCHAR(255) NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('sessions')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS sessions_user_id_index');
            DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE BIGINT USING NULL');
            DB::statement('CREATE INDEX sessions_user_id_index ON sessions (user_id)');
        } elseif ($driver === 'mysql') {
            DB::statement('ALTER TABLE sessions MODIFY user_id BIGINT UNSIGNED NULL');
        }
    }
};
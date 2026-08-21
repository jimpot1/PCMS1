<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('activity_logs', 'payload')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->json('payload')->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('activity_logs', 'payload')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropColumn('payload');
            });
        }
    }
};

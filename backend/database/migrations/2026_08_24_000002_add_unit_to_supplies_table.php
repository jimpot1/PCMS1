<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('supplies', 'unit')) {
            Schema::table('supplies', function (Blueprint $table) {
                $table->string('unit', 40)->default('pieces')->after('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('supplies', 'unit')) {
            Schema::table('supplies', function (Blueprint $table) {
                $table->dropColumn('unit');
            });
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('asset_assignments') && !Schema::hasColumn('asset_assignments', 'due_date')) {
            Schema::table('asset_assignments', function (Blueprint $table) {
                $column = $table->date('due_date')->nullable();

                if (Schema::hasColumn('asset_assignments', 'assigned_at')) {
                    $column->after('assigned_at');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('asset_assignments') && Schema::hasColumn('asset_assignments', 'due_date')) {
            Schema::table('asset_assignments', fn (Blueprint $table) => $table->dropColumn('due_date'));
        }
    }
};

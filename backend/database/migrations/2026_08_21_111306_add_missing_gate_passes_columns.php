<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gate_passes', function (Blueprint $table) {
            if (! Schema::hasColumn('gate_passes', 'gate_pass_number')) {
                $table->string('gate_pass_number', 40)->nullable()->after('id');
            }
            if (! Schema::hasColumn('gate_passes', 'asset_id')) {
                $table->unsignedBigInteger('asset_id')->nullable()->after('gate_pass_number');
            }
            if (! Schema::hasColumn('gate_passes', 'purpose')) {
                $table->text('purpose')->nullable()->after('asset_id');
            }
            if (! Schema::hasColumn('gate_passes', 'valid_until')) {
                $table->timestamp('valid_until')->nullable()->after('purpose');
            }
            if (! Schema::hasColumn('gate_passes', 'qr_code_path')) {
                $table->string('qr_code_path', 255)->nullable()->after('valid_until');
            }
            if (! Schema::hasColumn('gate_passes', 'approved_by')) {
                $table->char('approved_by', 36)->nullable()->after('qr_code_path');
            }
            if (! Schema::hasColumn('gate_passes', 'returned_at')) {
                $table->timestamp('returned_at')->nullable()->after('approved_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gate_passes', function (Blueprint $table) {
            foreach (['returned_at', 'approved_by', 'qr_code_path', 'valid_until', 'purpose', 'asset_id', 'gate_pass_number'] as $column) {
                if (Schema::hasColumn('gate_passes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

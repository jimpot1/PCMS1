<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            if (! Schema::hasColumn('supplies', 'sku')) {
                $table->string('sku', 40)->nullable()->after('id')->unique();
            }
            if (! Schema::hasColumn('supplies', 'name')) {
                $table->string('name', 160)->nullable()->after('sku');
            }
            if (! Schema::hasColumn('supplies', 'category')) {
                $table->string('category', 100)->nullable()->after('name');
            }
            if (! Schema::hasColumn('supplies', 'description')) {
                $table->text('description')->nullable()->after('category');
            }
            if (! Schema::hasColumn('supplies', 'stock')) {
                $table->integer('stock')->default(0)->after('description');
            }
            if (! Schema::hasColumn('supplies', 'minimum_stock')) {
                $table->integer('minimum_stock')->default(0)->after('stock');
            }
            if (! Schema::hasColumn('supplies', 'expiration_date')) {
                $table->date('expiration_date')->nullable()->after('minimum_stock');
            }
            if (! Schema::hasColumn('supplies', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->after('expiration_date')->constrained('suppliers');
            }
        });
    }

    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropColumn(['sku', 'name', 'category', 'description', 'stock', 'minimum_stock', 'expiration_date', 'supplier_id']);
        });
    }
};
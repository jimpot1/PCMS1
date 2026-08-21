<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 160);
            $table->string('location', 160)->nullable();
            $table->uuid('head_user_id')->nullable();
            $table->uuid('custodian_user_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('asset_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 160);
            $table->decimal('depreciation_rate', 5, 2)->default(0);
            $table->integer('useful_life_years')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 180);
            $table->string('contact_person', 120)->nullable();
            $table->string('email', 160)->nullable();
            $table->string('phone', 80)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id', 40)->unique();
            $table->string('property_number', 80)->unique();
            $table->string('serial_number', 120)->nullable();
            $table->string('name', 180);
            $table->string('brand', 120)->nullable();
            $table->string('model', 120)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('asset_categories');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->uuid('custodian_id')->nullable();
            $table->string('location', 180)->nullable();
            $table->string('condition', 40)->default('good')->index();
            $table->string('status', 40)->default('available')->index();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 14, 2)->nullable();
            $table->integer('quantity')->default(1);
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->date('warranty_until')->nullable();
            $table->decimal('depreciation_rate', 5, 2)->default(0);
            $table->text('qr_code_path')->nullable();
            $table->text('image_path')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');
            $table->string('type', 60);
            $table->string('priority', 30)->default('medium');
            $table->string('status', 40)->default('scheduled');
            $table->string('technician', 160)->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('cost', 14, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        foreach (['asset_assignments', 'asset_transfers', 'damage_reports', 'supplies', 'stock_movements', 'purchase_requests', 'gate_passes', 'physical_audits', 'ocr_scans', 'anomaly_alerts', 'activity_logs'] as $table) {
            Schema::create($table, function (Blueprint $blueprint) {
                $blueprint->id();
                $blueprint->json('payload')->nullable();
                $blueprint->string('status', 40)->default('active')->index();
                $blueprint->timestamps();
            });
        }
    }

    public function down(): void
    {
        foreach (['activity_logs', 'anomaly_alerts', 'ocr_scans', 'physical_audits', 'gate_passes', 'purchase_requests', 'stock_movements', 'supplies', 'damage_reports', 'asset_transfers', 'asset_assignments', 'maintenance_records', 'assets', 'suppliers', 'asset_categories', 'departments'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};

<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PpmoDashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_dashboard_metrics_return_zeroes_and_a_seven_day_series(): void
    {
        $this->actingAs($this->makePpmoUser())
            ->getJson('/api/ppmo/metrics')
            ->assertOk()
            ->assertJsonPath('returns_due', 0)
            ->assertJsonPath('overdue_returns', 0)
            ->assertJsonPath('receiving_action_count', 0)
            ->assertJsonPath('open_anomaly_alerts', 0)
            ->assertJsonCount(0, 'receiving_actions')
            ->assertJsonCount(0, 'recent_operations')
            ->assertJsonCount(7, 'release_activity');
    }

    public function test_dashboard_metrics_reflect_operational_records_and_exclude_ineligible_rows(): void
    {
        $ppmo = $this->makePpmoUser();
        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'PN-' . Str::upper(Str::random(8)),
            'name' => 'Dashboard Test Laptop',
            'quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'assigned',
        ]);

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $ppmo->id,
            'assignment_type' => 'permanent',
            'quantity' => 1,
            'assigned_at' => now()->subMonth(),
            'due_date' => now()->addDays(3)->toDateString(),
            'status' => 'active',
        ]);
        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $ppmo->id,
            'assignment_type' => 'permanent',
            'quantity' => 1,
            'assigned_at' => now()->subMonth(),
            'due_date' => now()->subDay()->toDateString(),
            'status' => 'active',
        ]);
        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $ppmo->id,
            'assignment_type' => 'permanent',
            'quantity' => 1,
            'assigned_at' => now()->subMonth(),
            'due_date' => now()->addDays(2)->toDateString(),
            'status' => 'returned',
        ]);

        PurchaseRequest::create([
            'request_number' => 'PR-PO-DASHBOARD-1',
            'request_type' => 'purchase_order',
            'status' => 'approved',
            'current_stage' => 'ppmo_staff',
            'procurement_status' => 'received',
            'qc_status' => 'pending',
        ]);
        PurchaseRequest::create([
            'request_number' => 'PR-PO-DASHBOARD-2',
            'request_type' => 'purchase_order',
            'status' => 'approved',
            'current_stage' => 'ppmo_staff',
            'procurement_status' => 'ready_to_release',
            'qc_status' => 'passed',
        ]);
        PurchaseRequest::create([
            'request_number' => 'PR-PO-DASHBOARD-3',
            'request_type' => 'purchase_order',
            'status' => 'cancelled',
            'current_stage' => 'ppmo_staff',
            'procurement_status' => 'received',
            'qc_status' => 'pending',
        ]);

        DB::table('anomaly_alerts')->insert([
            ['status' => 'open', 'priority' => 'high', 'source_type' => 'low_stock', 'payload' => json_encode([]), 'created_at' => now(), 'updated_at' => now()],
            ['status' => 'resolved', 'priority' => 'medium', 'source_type' => 'low_stock', 'payload' => json_encode([]), 'created_at' => now(), 'updated_at' => now()],
        ]);

        foreach (['purchase_request_released', 'gate_pass_released', 'supply_request_partially_released'] as $action) {
            ActivityLog::create([
                'action' => $action,
                'payload' => ['request_number' => 'PR-RELEASED-1'],
                'status' => 'completed',
            ]);
        }
        foreach (['asset_returned', 'po_stock_received', 'po_qc_completed'] as $action) {
            ActivityLog::create([
                'action' => $action,
                'payload' => ['request_number' => 'PR-RECEIVED-1'],
                'status' => 'completed',
            ]);
        }
        ActivityLog::create([
            'action' => 'asset_registered',
            'payload' => ['asset_name' => 'Unrelated asset'],
            'status' => 'completed',
        ]);

        $this->actingAs($ppmo)
            ->getJson('/api/ppmo/metrics')
            ->assertOk()
            ->assertJsonPath('returns_due', 1)
            ->assertJsonPath('overdue_returns', 1)
            ->assertJsonPath('receiving_action_count', 1)
            ->assertJsonPath('receiving_actions.0.request_number', 'PR-PO-DASHBOARD-1')
            ->assertJsonPath('open_anomaly_alerts', 1)
            ->assertJsonPath('release_activity.6.releases', 3)
            ->assertJsonPath('release_activity.6.returns', 1)
            ->assertJsonPath('release_activity.6.receiving_qc', 2)
            ->assertJsonCount(6, 'recent_operations');
    }

    private function makePpmoUser(): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'PPMO-' . Str::upper(Str::random(6)),
            'first_name' => 'PPMO',
            'last_name' => 'Dashboard',
            'full_name' => 'PPMO Dashboard',
            'email' => 'ppmo-' . Str::lower(Str::random(8)) . '@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff',
            'department' => 'Operations',
            'status' => 'active',
        ]);
    }
}
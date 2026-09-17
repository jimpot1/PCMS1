<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetUnit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetUnitTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_asset_unit_can_be_created_and_linked_to_parent_asset(): void
    {
        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-001',
            'property_number' => 'PROP-UNIT-001',
            'name' => 'Asset Unit Test',
            'quantity' => 2,
            'available_quantity' => 2,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 500,
            'purchase_date' => now()->toDateString(),
        ]);

        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-001',
            'serial_number' => 'SN-001',
            'status' => 'available',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Main Storage',
        ]);

        $this->assertSame($asset->id, $unit->asset_id);
        $this->assertSame('UNIT-001', $unit->unit_code);
        $this->assertDatabaseHas('asset_units', ['id' => $unit->id, 'asset_id' => $asset->id]);
    }

    public function test_asset_units_endpoint_returns_unit_records_for_asset(): void
    {
        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-002',
            'property_number' => 'PROP-UNIT-002',
            'name' => 'Asset Unit Endpoint Test',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 750,
            'purchase_date' => now()->toDateString(),
        ]);

        AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-002',
            'serial_number' => 'SN-002',
            'status' => 'assigned',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Logistics Room',
        ]);

        $this->actingAs(
            \App\Models\User::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'employee_id' => 'EMP-UNIT-TEST',
                'first_name' => 'Asset',
                'last_name' => 'Tester',
                'full_name' => 'Asset Tester',
                'email' => 'asset.tester@example.test',
                'password_hash' => bcrypt('secret'),
                'role' => 'PPMO Staff',
                'department' => 'Operations',
                'status' => 'active',
            ])
        );

        $response = $this->getJson('/api/assets/' . $asset->id . '/units');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.unit_code', 'UNIT-002');
    }

    public function test_single_asset_assignment_can_use_available_asset_unit(): void
    {
        $staff = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-AST-003',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'full_name' => 'Staff User',
            'email' => 'staff.003@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff',
            'department' => 'Operations',
            'status' => 'active',
        ]);
        $employee = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-REQ-003',
            'first_name' => 'Employee',
            'last_name' => 'User',
            'full_name' => 'Employee User',
            'email' => 'employee.003@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'Requester',
            'department' => 'Operations',
            'status' => 'active',
        ]);

        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-003',
            'property_number' => 'PROP-UNIT-003',
            'name' => 'Laptop',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);

        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-003',
            'serial_number' => 'SN-003',
            'status' => 'available',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Main Storage',
        ]);

        $this->actingAs($staff);

        $response = $this->postJson('/api/assignments', [
            'asset_id' => $asset->id,
            'asset_unit_ids' => [$unit->id],
            'assigned_to' => $employee->id,
            'quantity' => 1,
            'assignment_type' => 'permanent',
            'accept_now' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('asset_assignments', ['asset_id' => $asset->id, 'assigned_to' => $employee->id, 'quantity' => 1]);
    }

    public function test_multiple_asset_assignment_requires_enough_available_asset_units(): void
    {
        $staff = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-AST-004',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'full_name' => 'Staff User',
            'email' => 'staff.004@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff',
            'department' => 'Operations',
            'status' => 'active',
        ]);
        $employee = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-REQ-004',
            'first_name' => 'Employee',
            'last_name' => 'User',
            'full_name' => 'Employee User',
            'email' => 'employee.004@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'Requester',
            'department' => 'Operations',
            'status' => 'active',
        ]);

        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-004',
            'property_number' => 'PROP-UNIT-004',
            'name' => 'Laptop',
            'quantity' => 3,
            'available_quantity' => 3,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);

        $availableUnits = collect([1, 2])->map(fn ($index) => AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => "UNIT-{$index}",
            'serial_number' => "SN-{$index}",
            'status' => 'available',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Main Storage',
        ]));

        $assignedUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-ASSIGNED',
            'serial_number' => 'SN-ASSIGNED',
            'status' => 'assigned',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Desk 2',
        ]);

        $this->actingAs($staff);

        $response = $this->postJson('/api/assignments', [
            'asset_id' => $asset->id,
            'asset_unit_ids' => $availableUnits->pluck('id')->all(),
            'assigned_to' => $employee->id,
            'quantity' => 3,
            'assignment_type' => 'permanent',
            'accept_now' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.physical_unit_ids.0', 'Select exactly 3 physical unit(s) for this assignment.');

        $this->assertDatabaseMissing('asset_assignments', ['asset_id' => $asset->id, 'assigned_to' => $employee->id]);
        $this->assertDatabaseHas('asset_units', ['id' => $assignedUnit->id, 'status' => 'assigned']);
    }

    public function test_multiple_asset_assignment_can_allocate_required_available_units(): void
    {
        $staff = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-AST-005',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'full_name' => 'Staff User',
            'email' => 'staff.005@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff',
            'department' => 'Operations',
            'status' => 'active',
        ]);
        $employee = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-REQ-005',
            'first_name' => 'Employee',
            'last_name' => 'User',
            'full_name' => 'Employee User',
            'email' => 'employee.005@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'Requester',
            'department' => 'Operations',
            'status' => 'active',
        ]);

        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-005',
            'property_number' => 'PROP-UNIT-005',
            'name' => 'Laptop',
            'quantity' => 5,
            'available_quantity' => 5,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);

        $availableUnits = collect([1, 2, 3, 4, 5])->map(fn ($index) => AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => "UNIT-{$index}",
            'serial_number' => "SN-{$index}",
            'status' => 'available',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Main Storage',
        ]));

        $this->actingAs($staff);

        $response = $this->postJson('/api/assignments', [
            'asset_id' => $asset->id,
            'asset_unit_ids' => $availableUnits->take(3)->pluck('id')->all(),
            'assigned_to' => $employee->id,
            'quantity' => 3,
            'assignment_type' => 'permanent',
            'accept_now' => true,
        ]);

        $response->assertStatus(201);
        $this->assertSame(3, (int) \App\Models\AssetAssignment::where('asset_id', $asset->id)->where('assigned_to', $employee->id)->count());
        $this->assertSame(3, (int) \App\Models\AssetAssignment::where('asset_id', $asset->id)->where('assigned_to', $employee->id)->sum('quantity'));
        $this->assertSame(3, \App\Models\AssetAssignment::where('asset_id', $asset->id)->where('assigned_to', $employee->id)->whereNotNull('asset_unit_id')->count());
        $this->assertSame(3, AssetUnit::where('asset_id', $asset->id)->where('status', 'assigned')->count());
    }

    public function test_multi_unit_assignment_rejects_duplicate_physical_unit_ids(): void
    {
        $staff = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'employee_id' => 'EMP-AST-DUP',
            'first_name' => 'Staff', 'last_name' => 'User', 'full_name' => 'Staff User',
            'email' => 'staff.dup@example.test', 'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff', 'department' => 'Operations', 'status' => 'active',
        ]);
        $employee = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(), 'employee_id' => 'EMP-REQ-DUP',
            'first_name' => 'Employee', 'last_name' => 'User', 'full_name' => 'Employee User',
            'email' => 'employee.dup@example.test', 'password_hash' => bcrypt('secret'),
            'role' => 'Requester', 'department' => 'Operations', 'status' => 'active',
        ]);
        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-DUP', 'property_number' => 'PROP-UNIT-DUP', 'name' => 'Laptop',
            'quantity' => 2, 'available_quantity' => 2, 'condition' => 'good', 'status' => 'available',
            'purchase_cost' => 1000, 'purchase_date' => now()->toDateString(),
        ]);
        $unit = AssetUnit::create([
            'asset_id' => $asset->id, 'unit_code' => 'UNIT-DUP', 'status' => 'available',
            'condition' => 'good', 'location' => 'Main Storage',
        ]);

        $this->actingAs($staff);
        $response = $this->postJson('/api/assignments', [
            'asset_id' => $asset->id,
            'physical_unit_ids' => [$unit->id, $unit->id],
            'assigned_to' => $employee->id,
            'quantity' => 2,
            'accept_now' => true,
        ]);

        $response->assertStatus(422)->assertJsonPath('errors.physical_unit_ids.0', 'Physical unit IDs must be unique.');
        $this->assertDatabaseCount('asset_assignments', 0);
    }

    public function test_multiple_asset_assignment_rejects_unavailable_units_during_transaction(): void
    {
        $staff = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-AST-006',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'full_name' => 'Staff User',
            'email' => 'staff.006@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'PPMO Staff',
            'department' => 'Operations',
            'status' => 'active',
        ]);
        $employee = \App\Models\User::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'employee_id' => 'EMP-REQ-006',
            'first_name' => 'Employee',
            'last_name' => 'User',
            'full_name' => 'Employee User',
            'email' => 'employee.006@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => 'Requester',
            'department' => 'Operations',
            'status' => 'active',
        ]);

        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-006',
            'property_number' => 'PROP-UNIT-006',
            'name' => 'Laptop',
            'quantity' => 2,
            'available_quantity' => 2,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);

        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-006',
            'serial_number' => 'SN-006',
            'status' => 'available',
            'department_id' => null,
            'custodian_id' => null,
            'condition' => 'good',
            'location' => 'Main Storage',
        ]);

        $this->actingAs($staff);

        $unit->update(['status' => 'assigned']);

        $response = $this->postJson('/api/assignments', [
            'asset_id' => $asset->id,
            'asset_unit_ids' => [$unit->id],
            'assigned_to' => $employee->id,
            'quantity' => 1,
            'assignment_type' => 'permanent',
            'accept_now' => true,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('errors.asset.0', 'Only 0 of 1 requested assets are currently available.');
    }
}

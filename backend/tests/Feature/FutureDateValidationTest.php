<?php

namespace Tests\Feature;

use App\Http\Controllers\AuditController;
use App\Http\Controllers\GatePassController;
use App\Http\Controllers\MaintenanceController;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetUnit;
use App\Models\Department;
use App\Models\MaintenanceRecord;
use App\Models\PhysicalAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class FutureDateValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(string $role): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'EMP-' . Str::upper(Str::random(6)),
            'first_name' => $role,
            'last_name' => 'Tester',
            'full_name' => $role . ' Tester',
            'email' => Str::lower(Str::random(10)) . '@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => $role,
            'status' => 'active',
        ]);
    }

    protected function makeDepartment(string $suffix): Department
    {
        return Department::create([
            'code' => 'D-' . $suffix,
            'name' => 'Department ' . $suffix,
            'is_active' => true,
        ]);
    }

    protected function makeAsset(Department $department, string $suffix): Asset
    {
        return Asset::create([
            'asset_id' => 'AST-' . $suffix,
            'property_number' => 'PROP-' . $suffix,
            'name' => 'Asset ' . $suffix,
            'department_id' => $department->id,
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
        ]);
    }

    protected function makeAssignedUnit(Asset $asset, User $holder, string $suffix): AssetUnit
    {
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-' . $suffix,
            'status' => 'assigned',
            'custodian_id' => $holder->id,
            'condition' => 'good',
        ]);

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'assigned_to' => $holder->id,
            'assigned_by' => $holder->id,
            'department_id' => $asset->department_id,
            'quantity' => 1,
            'purpose' => 'Testing',
            'condition_before' => 'good',
            'assigned_at' => now()->subDay(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        return $unit;
    }

    protected function request(User $user, array $input = []): Request
    {
        $request = Request::create('/api/test', 'POST', $input);
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    public function test_gate_pass_rejects_past_valid_until_date(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('GATE');
        $asset = $this->makeAsset($department, 'GATE1');
        $unit = $this->makeAssignedUnit($asset, $user, 'GATE1-001');

        $request = $this->request($user, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'purpose' => 'For testing',
            'valid_until' => now()->subDay()->toDateString(),
            'destination' => 'Office',
            'quantity' => 1,
            'condition_before' => 'good',
        ]);

        try {
            (new GatePassController())->store($request);
            $this->fail('Expected validation exception for a past gate pass date.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('valid_until', $exception->errors());
        }
    }

    public function test_gate_pass_accepts_future_valid_until_date(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('GATE');
        $asset = $this->makeAsset($department, 'GATE2');
        $unit = $this->makeAssignedUnit($asset, $user, 'GATE2-001');

        $request = $this->request($user, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'purpose' => 'For testing',
            'valid_until' => now()->addDay()->toDateString(),
            'destination' => 'Office',
            'quantity' => 1,
            'condition_before' => 'good',
        ]);

        $response = (new GatePassController())->store($request);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame($unit->id, $response->getData(true)['data']['asset_unit_id']);
        $this->assertSame($user->id, $response->getData(true)['data']['holder_id']);
    }

    public function test_maintenance_schedules_only_the_selected_available_unit(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('MAINTENANCE-UNITS');
        $asset = $this->makeAsset($department, 'MAINTENANCE-UNITS');
        $asset->update(['quantity' => 2, 'available_quantity' => 2]);
        $selectedUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-MAINTENANCE-001',
            'status' => 'available',
            'condition' => 'good',
        ]);
        $otherUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-MAINTENANCE-002',
            'status' => 'available',
            'condition' => 'good',
        ]);

        $response = (new MaintenanceController())->store($this->request($user, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $selectedUnit->id,
            'type' => 'preventive',
            'priority' => 'medium',
            'scheduled_at' => now()->addDay()->toDateString(),
            'notes' => 'Service the selected unit.',
        ]));

        $this->assertSame(201, $response->getStatusCode());
        $this->assertSame($selectedUnit->id, $response->getData(true)['asset_unit_id']);
        $this->assertSame('maintenance', $selectedUnit->fresh()->status);
        $this->assertSame('available', $otherUnit->fresh()->status);
        $this->assertSame(1, $asset->fresh()->available_quantity);
    }

    public function test_maintenance_requires_a_unit_when_the_asset_has_tracked_units(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('MAINTENANCE-REQUIRED-UNIT');
        $asset = $this->makeAsset($department, 'MAINTENANCE-REQUIRED-UNIT');
        AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-MAINTENANCE-REQUIRED-001',
            'status' => 'available',
            'condition' => 'good',
        ]);

        $response = (new MaintenanceController())->store($this->request($user, [
            'asset_id' => $asset->id,
            'type' => 'preventive',
            'priority' => 'medium',
            'scheduled_at' => now()->addDay()->toDateString(),
        ]));

        $this->assertSame(422, $response->getStatusCode());
        $this->assertDatabaseCount('maintenance_records', 0);
        $this->assertDatabaseHas('asset_units', [
            'asset_id' => $asset->id,
            'status' => 'available',
        ]);
    }

    public function test_gate_passes_are_tracked_per_physical_unit(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('GATEUNITS');
        $asset = $this->makeAsset($department, 'GATEUNITS');
        $firstUnit = $this->makeAssignedUnit($asset, $user, 'GATEUNITS-001');
        $secondUnit = $this->makeAssignedUnit($asset, $user, 'GATEUNITS-002');

        $createPass = fn (AssetUnit $unit) => (new GatePassController())->store($this->request($user, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'purpose' => 'For testing',
            'valid_until' => now()->addDay()->toDateString(),
        ]));

        $this->assertSame(201, $createPass($firstUnit)->getStatusCode());
        $this->assertSame(201, $createPass($secondUnit)->getStatusCode());

        $duplicate = $createPass($firstUnit);
        $this->assertSame(422, $duplicate->getStatusCode());
        $this->assertSame(
            'This physical unit already has an active or pending gate pass.',
            $duplicate->getData(true)['message'],
        );
    }

    public function test_gate_pass_rejects_an_unassigned_physical_unit(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('GATEUNASSIGNED');
        $asset = $this->makeAsset($department, 'GATEUNASSIGNED');
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-GATEUNASSIGNED-001',
            'status' => 'available',
            'condition' => 'good',
        ]);

        $response = (new GatePassController())->store($this->request($user, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'purpose' => 'For testing',
            'valid_until' => now()->addDay()->toDateString(),
        ]));

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame(
            'Select a physical unit with an active assigned holder before requesting a gate pass.',
            $response->getData(true)['message'],
        );
    }

    public function test_audit_rejects_past_scheduled_date(): void
    {
        $user = $this->makeUser('Property Custodian');
        $department = $this->makeDepartment('AUDIT');

        $request = $this->request($user, [
            'area' => 'Main Store',
            'department_id' => $department->id,
            'scheduled_at' => now()->subDays(2)->toDateString(),
        ]);

        try {
            (new AuditController())->store($request);
            $this->fail('Expected validation exception for a past audit date.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('scheduled_at', $exception->errors());
        }
    }

    public function test_audit_accepts_future_scheduled_date(): void
    {
        $user = $this->makeUser('Property Custodian');
        $department = $this->makeDepartment('AUDIT');

        $request = $this->request($user, [
            'area' => 'Main Store',
            'department_id' => $department->id,
            'scheduled_at' => now()->addDay()->toDateString(),
        ]);

        $response = (new AuditController())->store($request);

        $this->assertSame(201, $response->getStatusCode());
    }

    public function test_maintenance_rejects_past_schedule_date(): void
    {
        $user = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('MAINT');
        $asset = $this->makeAsset($department, 'MAINT1');

        $request = $this->request($user, [
            'asset_id' => $asset->id,
            'type' => 'preventive',
            'priority' => 'medium',
            'scheduled_at' => now()->subDay()->toDateString(),
            'notes' => 'Past schedule should be rejected.',
        ]);

        try {
            (new MaintenanceController())->store($request);
            $this->fail('Expected validation exception for a past maintenance date.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('scheduled_at', $exception->errors());
        }
    }

    public function test_temporary_assignment_rejects_past_due_date(): void
    {
        $user = $this->makeUser('Property Custodian');
        $department = $this->makeDepartment('ASSIGN');
        $asset = $this->makeAsset($department, 'ASSIGN1');

        $request = $this->request($user, [
            'asset_id' => $asset->id,
            'assigned_to' => $user->id,
            'assigned_by' => $user->id,
            'assignment_type' => 'temporary',
            'assigned_at' => now()->subDay()->toDateString(),
            'due_date' => now()->subDay()->toDateString(),
            'quantity' => 1,
            'purpose' => 'Temporary assignment test',
            'condition_before' => 'good',
        ]);

        try {
            (new \App\Http\Controllers\AssetAssignmentController())->store($request);
            $this->fail('Expected validation exception for a past assignment due date.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('due_date', $exception->errors());
        }
    }
}

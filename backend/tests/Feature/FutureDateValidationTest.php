<?php

namespace Tests\Feature;

use App\Http\Controllers\AuditController;
use App\Http\Controllers\GatePassController;
use App\Http\Controllers\MaintenanceController;
use App\Models\Asset;
use App\Models\AssetAssignment;
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

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $user->id,
            'assigned_by' => $user->id,
            'department_id' => $department->id,
            'quantity' => 1,
            'purpose' => 'Testing',
            'condition_before' => 'good',
            'assigned_at' => now()->subDay(),
            'approved_at' => now()->subDay(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $request = $this->request($user, [
            'asset_id' => $asset->id,
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

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $user->id,
            'assigned_by' => $user->id,
            'department_id' => $department->id,
            'quantity' => 1,
            'purpose' => 'Testing',
            'condition_before' => 'good',
            'assigned_at' => now()->subDay(),
            'approved_at' => now()->subDay(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $request = $this->request($user, [
            'asset_id' => $asset->id,
            'purpose' => 'For testing',
            'valid_until' => now()->addDay()->toDateString(),
            'destination' => 'Office',
            'quantity' => 1,
            'condition_before' => 'good',
        ]);

        $response = (new GatePassController())->store($request);

        $this->assertSame(201, $response->getStatusCode());
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
}

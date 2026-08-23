<?php

namespace Tests\Feature;

use App\Http\Controllers\AuditController;
use App\Models\Asset;
use App\Models\Department;
use App\Models\PhysicalAudit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class PhysicalAuditTest extends TestCase
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
            'name' => 'Audit Asset ' . $suffix,
            'department_id' => $department->id,
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
        ]);
    }

    protected function request(User $user, array $input = []): Request
    {
        $request = Request::create('/api/audits', 'POST', $input);
        $request->setUserResolver(fn () => $user);
        return $request;
    }

    public function test_audit_crud_requires_an_audit_manager(): void
    {
        $requester = $this->makeUser('Requester');
        $this->actingAs($requester);

        $response = $this->postJson('/api/audits', [
            'area' => 'Laboratory',
            'scheduled_at' => now()->toDateString(),
        ]);

        $response->assertForbidden();
    }

    public function test_property_custodian_can_manage_audits(): void
    {
        $custodian = $this->makeUser('Property Custodian');
        $this->actingAs($custodian);

        $response = $this->postJson('/api/audits', [
            'area' => 'Custodian Storage',
            'scheduled_at' => now()->toDateString(),
        ]);

        $response->assertCreated();
        $this->getJson('/api/audits')->assertOk()->assertJsonPath('data.0.area', 'Custodian Storage');
    }

    public function test_verified_ocr_scan_is_recorded(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('AUD1');
        $asset = $this->makeAsset($department, 'AUD1');
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000001',
            'area' => 'Laboratory',
            'department_id' => $department->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);
        $ocrScanId = DB::table('ocr_scans')->insertGetId([
            'asset_id' => $asset->id,
            'extracted_payload' => json_encode(['fields' => ['property_number' => $asset->property_number]]),
            'confidence_score' => 96,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = (new AuditController())->scan($this->request($staff, [
            'asset_id' => $asset->id,
            'found_department_id' => $department->id,
            'ocr_scan_id' => $ocrScanId,
        ]), $audit);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertDatabaseHas('audit_scans', [
            'audit_id' => $audit->id,
            'asset_id' => $asset->id,
            'result' => 'verified',
            'ocr_scan_id' => $ocrScanId,
        ]);
    }

    public function test_wrong_department_scan_creates_anomaly_and_transfer_request(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $recordedDepartment = $this->makeDepartment('AUD2A');
        $foundDepartment = $this->makeDepartment('AUD2B');
        $asset = $this->makeAsset($recordedDepartment, 'AUD2');
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000002',
            'area' => 'Office',
            'department_id' => $recordedDepartment->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        (new AuditController())->scan($this->request($staff, [
            'asset_id' => $asset->id,
            'found_department_id' => $foundDepartment->id,
        ]), $audit);

        $this->assertDatabaseHas('anomaly_alerts', [
            'source_type' => 'untracked_transfer',
            'source_id' => (string) $asset->id,
        ]);
        $this->assertDatabaseHas('asset_transfers', [
            'asset_id' => $asset->id,
            'from_department_id' => $recordedDepartment->id,
            'to_department_id' => $foundDepartment->id,
            'status' => 'transfer_requested',
        ]);
    }

    public function test_completing_audit_creates_follow_up_for_missing_assets(): void
    {
        $staff = $this->makeUser('OIC');
        $department = $this->makeDepartment('AUD3');
        $asset = $this->makeAsset($department, 'AUD3');
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000003',
            'area' => 'Storage',
            'department_id' => $department->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        $response = (new AuditController())->complete($this->request($staff), $audit);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertDatabaseHas('audit_scans', [
            'audit_id' => $audit->id,
            'asset_id' => $asset->id,
            'result' => 'missing',
        ]);
        $this->assertDatabaseHas('damage_reports', [
            'asset_id' => $asset->id,
            'description' => 'Physical audit AUD-2026-000003 could not verify this asset.',
            'status' => 'submitted',
        ]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'audit_completed']);
    }
}

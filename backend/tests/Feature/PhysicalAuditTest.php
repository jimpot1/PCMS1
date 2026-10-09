<?php

namespace Tests\Feature;

use App\Http\Controllers\AuditController;
use App\Http\Controllers\TransferController;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetUnit;
use App\Models\AssetTransfer;
use App\Models\AuditScan;
use App\Models\Department;
use App\Models\PhysicalAudit;
use App\Models\Supply;
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
            'employee_id' => 'EMP-'.Str::upper(Str::random(6)),
            'first_name' => $role,
            'last_name' => 'Tester',
            'full_name' => $role.' Tester',
            'email' => Str::lower(Str::random(10)).'@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => $role,
            'status' => 'active',
        ]);
    }

    protected function makeDepartment(string $suffix): Department
    {
        return Department::create([
            'code' => 'D-'.$suffix,
            'name' => 'Department '.$suffix,
            'is_active' => true,
        ]);
    }

    protected function makeAsset(Department $department, string $suffix): Asset
    {
        return Asset::create([
            'asset_id' => 'AST-'.$suffix,
            'property_number' => 'PROP-'.$suffix,
            'name' => 'Audit Asset '.$suffix,
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

    public function test_scheduled_asset_audit_saves_department_asset_snapshot(): void
    {
        $custodian = $this->makeUser('Property Custodian');
        $department = $this->makeDepartment('AUD-SNAPSHOT');
        $otherDepartment = $this->makeDepartment('AUD-SNAPSHOT-OTHER');
        $asset = $this->makeAsset($department, 'AUD-SNAPSHOT');
        $this->makeAsset($otherDepartment, 'AUD-SNAPSHOT-OTHER');
        $this->actingAs($custodian);

        $auditResponse = $this->postJson('/api/audits', [
            'area' => 'Logistics',
            'department_id' => $department->id,
            'scheduled_at' => now()->toDateString(),
        ])->assertCreated();

        $auditId = $auditResponse->json('id');
        $this->assertDatabaseHas('audit_asset_counts', [
            'audit_id' => $auditId,
            'asset_id' => $asset->id,
            'expected_quantity' => 1,
            'asset_name_snapshot' => $asset->name,
            'property_number_snapshot' => $asset->property_number,
            'department_name_snapshot' => $department->name,
        ]);
        $this->assertDatabaseMissing('audit_asset_counts', [
            'audit_id' => $auditId,
            'asset_id' => Asset::where('department_id', $otherDepartment->id)->value('id'),
        ]);

        $asset->update([
            'name' => 'Renamed after audit',
            'quantity' => 5,
            'department_id' => $otherDepartment->id,
        ]);

        $this->postJson('/api/audits/'.$auditId.'/scan', [
            'asset_id' => $asset->id,
            'found_department_id' => $department->id,
        ])->assertCreated()->assertJsonPath('result', 'verified');

        $this->postJson('/api/audits/'.$auditId.'/asset-count', [
            'asset_id' => $asset->id,
            'counted_quantity' => 1,
        ])->assertCreated()->assertJsonPath('expected_quantity', 1);

        $this->getJson('/api/audits/'.$auditId)
            ->assertOk()
            ->assertJsonPath('summary.expected', 1)
            ->assertJsonPath('summary.verified', 1)
            ->assertJsonPath('expected_assets.0.name', 'Audit Asset AUD-SNAPSHOT')
            ->assertJsonPath('expected_assets.0.property_number', 'PROP-AUD-SNAPSHOT')
            ->assertJsonPath('expected_assets.0.department_name', $department->name)
            ->assertJsonPath('expected_assets.0.system_quantity', 1)
            ->assertJsonPath('expected_assets.0.physical_quantity', 1);
    }

    public function test_manual_audit_scan_records_a_selected_unit_of_the_asset(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('AUD-UNIT');
        $asset = $this->makeAsset($department, 'AUD-UNIT');
        $otherAsset = $this->makeAsset($department, 'AUD-UNIT-OTHER');
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-AUD-001',
            'status' => 'assigned',
            'condition' => 'good',
        ]);
        $secondUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-AUD-002',
            'status' => 'assigned',
            'condition' => 'good',
        ]);
        $availableUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-AUD-AVAILABLE',
            'status' => 'available',
            'condition' => 'good',
        ]);
        $otherUnit = AssetUnit::create([
            'asset_id' => $otherAsset->id,
            'unit_code' => 'UNIT-AUD-OTHER',
            'status' => 'assigned',
            'condition' => 'good',
        ]);
        $this->actingAs($staff);
        $audit = $this->postJson('/api/audits', [
            'area' => 'Audit Unit Test',
            'department_id' => $department->id,
            'scheduled_at' => now()->toDateString(),
        ])->assertCreated()->json();

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $otherUnit->id,
            'found_department_id' => $department->id,
        ])->assertUnprocessable();
        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $availableUnit->id,
            'found_department_id' => $department->id,
        ])->assertUnprocessable();

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'found_department_id' => $department->id,
        ])->assertCreated()
            ->assertJsonPath('asset_unit.unit_code', 'UNIT-AUD-001');

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'found_department_id' => $department->id,
        ])->assertStatus(409)
            ->assertJsonPath('message', 'This physical unit has already been scanned in this audit.');

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $secondUnit->id,
            'found_department_id' => $department->id,
        ])->assertCreated()
            ->assertJsonPath('asset_unit.unit_code', 'UNIT-AUD-002');

        $this->assertDatabaseHas('audit_scans', [
            'audit_id' => $audit['id'],
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
        ]);
        $this->getJson('/api/audits/'.$audit['id'])
            ->assertOk()
            ->assertJsonPath('expected_assets.0.physical_unit_code', 'UNIT-AUD-001');

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $otherAsset->id,
            'asset_unit_id' => $otherUnit->id,
            'found_department_id' => $department->id,
        ])->assertCreated()
            ->assertJsonPath('asset_unit.unit_code', 'UNIT-AUD-OTHER');

        $this->getJson('/api/audits/'.$audit['id'])
            ->assertOk()
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.verified', 2);
        $this->assertDatabaseCount('audit_scans', 3);
    }

    public function test_completing_audit_uses_snapshotted_assets_after_reallocation(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('AUD-SNAPSHOT-COMPLETE');
        $newDepartment = $this->makeDepartment('AUD-SNAPSHOT-REASSIGNED');
        $asset = $this->makeAsset($department, 'AUD-SNAPSHOT-COMPLETE');
        $this->actingAs($staff);

        $audit = $this->postJson('/api/audits', [
            'area' => 'Logistics',
            'department_id' => $department->id,
            'scheduled_at' => now()->toDateString(),
        ])->assertCreated()->json();

        $asset->update(['department_id' => $newDepartment->id]);

        $this->patchJson('/api/audits/'.$audit['id'].'/complete')
            ->assertOk()
            ->assertJsonPath('summary.missing', 1);

        $this->assertDatabaseHas('audit_scans', [
            'audit_id' => $audit['id'],
            'asset_id' => $asset->id,
            'result' => 'missing',
        ]);
    }

    public function test_asset_added_after_audit_snapshot_is_reported_as_unexpected(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('AUD-UNEXPECTED');
        $otherDepartment = $this->makeDepartment('AUD-UNEXPECTED-OTHER');
        $this->actingAs($staff);

        $audit = $this->postJson('/api/audits', [
            'area' => 'Logistics',
            'department_id' => $department->id,
            'scheduled_at' => now()->toDateString(),
        ])->assertCreated()->json();
        $asset = $this->makeAsset($otherDepartment, 'AUD-UNEXPECTED');

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $asset->id,
            'found_department_id' => $department->id,
        ])->assertCreated()->assertJsonPath('result', 'unexpected');

        $this->getJson('/api/audits/'.$audit['id'])
            ->assertOk()
            ->assertJsonPath('summary.expected', 0)
            ->assertJsonPath('summary.unexpected_assets', 1)
            ->assertJsonPath('summary.wrong_department', 0)
            ->assertJsonPath('summary.progress_percent', 0)
            ->assertJsonCount(0, 'expected_assets');
    }

    public function test_audit_department_can_only_change_before_activity_and_refreshes_snapshot(): void
    {
        $custodian = $this->makeUser('Property Custodian');
        $department = $this->makeDepartment('AUD-SCOPE-OLD');
        $newDepartment = $this->makeDepartment('AUD-SCOPE-NEW');
        $oldAsset = $this->makeAsset($department, 'AUD-SCOPE-OLD');
        $newAsset = $this->makeAsset($newDepartment, 'AUD-SCOPE-NEW');
        $this->actingAs($custodian);

        $audit = $this->postJson('/api/audits', [
            'area' => 'Logistics',
            'department_id' => $department->id,
            'scheduled_at' => now()->toDateString(),
        ])->assertCreated()->json();

        $this->patchJson('/api/audits/'.$audit['id'], [
            'department_id' => $newDepartment->id,
        ])->assertOk();
        $this->assertDatabaseMissing('audit_asset_counts', [
            'audit_id' => $audit['id'],
            'asset_id' => $oldAsset->id,
        ]);
        $this->assertDatabaseHas('audit_asset_counts', [
            'audit_id' => $audit['id'],
            'asset_id' => $newAsset->id,
        ]);

        $this->postJson('/api/audits/'.$audit['id'].'/scan', [
            'asset_id' => $newAsset->id,
            'found_department_id' => $newDepartment->id,
        ])->assertCreated();

        $this->patchJson('/api/audits/'.$audit['id'], [
            'department_id' => $department->id,
        ])->assertUnprocessable();
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

        $response = (new AuditController)->scan($this->request($staff, [
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
        $auditDepartment = $this->makeDepartment('AUD2L');
        $foundDepartment = $this->makeDepartment('AUD2B');
        $asset = $this->makeAsset($recordedDepartment, 'AUD2');
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-AUD2-001',
            'status' => 'assigned',
            'department_id' => $recordedDepartment->id,
            'custodian_id' => $staff->id,
            'condition' => 'good',
        ]);
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000002',
            'area' => 'Office',
            'department_id' => $auditDepartment->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        (new AuditController)->scan($this->request($staff, [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'found_department_id' => $foundDepartment->id,
        ]), $audit);

        $this->assertDatabaseHas('anomaly_alerts', [
            'source_type' => 'untracked_transfer',
            'source_id' => (string) $asset->id,
        ]);
        $this->assertDatabaseHas('asset_transfers', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'from_department_id' => $auditDepartment->id,
            'to_department_id' => $foundDepartment->id,
            'quantity' => 1,
            'status' => 'transfer_requested',
            'reason' => 'Physical audit found asset in '.$foundDepartment->name.'.',
        ]);
    }

    public function test_unit_transfer_execution_moves_only_the_selected_unit_and_assignment(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $sourceHolder = $this->makeUser('Requester');
        $source = $this->makeDepartment('UNIT-MOVE-SOURCE');
        $destination = $this->makeDepartment('UNIT-MOVE-DEST');
        $receivingEmployee = $this->makeUser('Department Head');
        $receivingEmployee->update(['department' => $destination->name]);
        $asset = Asset::create([
            'asset_id' => 'AST-UNIT-MOVE',
            'property_number' => 'PROP-UNIT-MOVE',
            'name' => 'Multi-unit transfer test asset',
            'department_id' => $source->id,
            'custodian_id' => $sourceHolder->id,
            'current_holder_id' => $sourceHolder->id,
            'quantity' => 2,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'assigned',
        ]);
        $movingUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-MOVE-001',
            'status' => 'assigned',
            'department_id' => $source->id,
            'custodian_id' => $sourceHolder->id,
            'condition' => 'good',
        ]);
        $stationaryUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-MOVE-002',
            'status' => 'assigned',
            'department_id' => $source->id,
            'custodian_id' => $sourceHolder->id,
            'condition' => 'good',
        ]);
        $movingAssignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'asset_unit_id' => $movingUnit->id,
            'assigned_to' => $sourceHolder->id,
            'assigned_by' => $staff->id,
            'department_id' => $source->id,
            'quantity' => 1,
            'purpose' => 'Unit being moved',
            'condition_before' => 'good',
            'assigned_at' => now(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
        $stationaryAssignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'asset_unit_id' => $stationaryUnit->id,
            'assigned_to' => $sourceHolder->id,
            'assigned_by' => $staff->id,
            'department_id' => $source->id,
            'quantity' => 1,
            'purpose' => 'Unit staying at source',
            'condition_before' => 'good',
            'assigned_at' => now(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);
        $transfer = AssetTransfer::create([
            'transfer_number' => 'TR-2026-UNIT-MOVE',
            'asset_id' => $asset->id,
            'asset_unit_id' => $movingUnit->id,
            'from_department_id' => $source->id,
            'to_department_id' => $destination->id,
            'from_custodian_id' => $sourceHolder->id,
            'to_custodian_id' => $receivingEmployee->id,
            'requested_by' => $sourceHolder->id,
            'quantity' => 1,
            'transfer_type' => 'permanent',
            'status' => 'ready_for_transfer',
            'reason' => 'Transfer one physical unit.',
        ]);

        $response = (new TransferController)->execute($this->request($staff), $transfer);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($source->id, $asset->fresh()->department_id);
        $this->assertSame($sourceHolder->id, $asset->fresh()->current_holder_id);
        $this->assertSame($destination->id, $movingUnit->fresh()->department_id);
        $this->assertSame($receivingEmployee->id, $movingUnit->fresh()->custodian_id);
        $this->assertSame($source->id, $stationaryUnit->fresh()->department_id);
        $this->assertSame($sourceHolder->id, $stationaryUnit->fresh()->custodian_id);
        $this->assertSame($receivingEmployee->id, $movingAssignment->fresh()->assigned_to);
        $this->assertSame($destination->id, $movingAssignment->fresh()->department_id);
        $this->assertSame($sourceHolder->id, $stationaryAssignment->fresh()->assigned_to);
        $this->assertSame($source->id, $stationaryAssignment->fresh()->department_id);
    }

    public function test_completing_audit_creates_follow_up_for_missing_assets(): void
    {
        $staff = $this->makeUser('OIC');
        $department = $this->makeDepartment('AUD3');
        $asset = $this->makeAsset($department, 'AUD3');
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-AUD3-001',
            'status' => 'available',
            'condition' => 'good',
        ]);
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000003',
            'area' => 'Storage',
            'department_id' => $department->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        $response = (new AuditController)->complete($this->request($staff), $audit);

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
        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => 'lost',
            'condition' => 'lost',
            'available_quantity' => 0,
        ]);
        $this->assertDatabaseHas('asset_units', [
            'id' => $unit->id,
            'status' => 'disposed',
            'condition' => 'unserviceable',
        ]);
        $this->assertDatabaseHas('activity_logs', ['action' => 'audit_completed']);
    }

    public function test_supply_audit_records_quantity_variance(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $department = $this->makeDepartment('SUPPLY-AUDIT');
        $supply = Supply::create([
            'sku' => 'SUP-AUDIT-001',
            'name' => 'Audit Paper',
            'unit' => 'ream',
            'stock' => 10,
            'minimum_stock' => 2,
            'department_id' => $department->id,
        ]);
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-SUPPLY-001',
            'area' => 'Supply Room',
            'audit_type' => 'supplies',
            'department_id' => $department->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        $response = (new AuditController)->countSupply($this->request($staff, [
            'supply_id' => $supply->id,
            'counted_quantity' => 7,
        ]), $audit);

        $this->assertSame(201, $response->getStatusCode());
        $this->assertDatabaseHas('audit_supply_counts', [
            'audit_id' => $audit->id,
            'supply_id' => $supply->id,
            'expected_quantity' => 10,
            'counted_quantity' => 7,
            'variance' => -3,
            'status' => 'variance',
        ]);
    }

    public function test_audit_can_be_updated_and_deleted_with_scans(): void
    {
        $staff = $this->makeUser('System Administrator');
        $oldDepartment = $this->makeDepartment('AUD4A');
        $newDepartment = $this->makeDepartment('AUD4B');
        $asset = $this->makeAsset($oldDepartment, 'AUD4');
        $audit = PhysicalAudit::create([
            'audit_number' => 'AUD-2026-000004',
            'area' => 'Old Area',
            'department_id' => $oldDepartment->id,
            'auditor_id' => $staff->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        AuditScan::create([
            'audit_id' => $audit->id,
            'asset_id' => $asset->id,
            'found_department_id' => $oldDepartment->id,
            'result' => 'verified',
        ]);

        $update = (new AuditController)->update($this->request($staff, [
            'area' => 'Updated Area',
            'scheduled_at' => now()->addDay()->toDateString(),
        ]), $audit);

        $this->assertSame(200, $update->getStatusCode());
        $this->assertDatabaseHas('physical_audits', [
            'id' => $audit->id,
            'area' => 'Updated Area',
            'department_id' => $oldDepartment->id,
        ]);

        $scopeUpdate = (new AuditController)->update($this->request($staff, [
            'department_id' => $newDepartment->id,
        ]), $audit->fresh());
        $this->assertSame(422, $scopeUpdate->getStatusCode());

        $delete = (new AuditController)->destroy($this->request($staff), $audit->fresh());

        $this->assertSame(200, $delete->getStatusCode());
        $this->assertDatabaseMissing('physical_audits', ['id' => $audit->id]);
        $this->assertDatabaseMissing('audit_scans', ['audit_id' => $audit->id]);
    }

    public function test_executing_transfer_moves_asset_assignment_to_receiving_employee(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $requester = $this->makeUser('Requester');
        $receivingEmployee = $this->makeUser('Department Head');
        $logistics = $this->makeDepartment('LOG4');
        $clinic = $this->makeDepartment('CLN4');
        $requester->update(['department' => $logistics->name]);
        $receivingEmployee->update(['department' => $clinic->name]);
        $asset = $this->makeAsset($logistics, 'TR4');

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $requester->id,
            'assigned_by' => $staff->id,
            'department_id' => $logistics->id,
            'quantity' => 1,
            'purpose' => 'Current assignment',
            'condition_before' => 'good',
            'assigned_at' => now(),
            'status' => 'active',
            'approval_status' => 'approved',
        ]);

        $transfer = AssetTransfer::create([
            'transfer_number' => 'TR-2026-000004',
            'asset_id' => $asset->id,
            'from_department_id' => $logistics->id,
            'to_department_id' => $clinic->id,
            'from_custodian_id' => $requester->id,
            'to_custodian_id' => $receivingEmployee->id,
            'requested_by' => $requester->id,
            'quantity' => 1,
            'transfer_type' => 'permanent',
            'status' => 'ready_for_transfer',
            'reason' => 'Physical audit correction',
        ]);

        $response = (new TransferController)->execute($this->request($staff), $transfer);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($clinic->id, $asset->fresh()->department_id);
        $this->assertSame($receivingEmployee->id, $asset->fresh()->current_holder_id);
        $this->assertDatabaseHas('asset_assignments', [
            'asset_id' => $asset->id,
            'assigned_to' => $receivingEmployee->id,
            'department_id' => $clinic->id,
            'status' => 'active',
        ]);
    }
}

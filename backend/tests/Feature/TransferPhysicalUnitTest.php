<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetUnit;
use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TransferPhysicalUnitTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, ?string $department = null): User
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
            'department' => $department,
            'status' => 'active',
        ]);
    }

    public function test_transfer_requests_can_select_distinct_assigned_units_of_the_same_asset(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $from = Department::create([
            'code' => 'TR-FROM',
            'name' => 'Transfer Source',
            'is_active' => true,
        ]);
        $to = Department::create([
            'code' => 'TR-TO',
            'name' => 'Transfer Destination',
            'is_active' => true,
        ]);
        $custodian = $this->makeUser('Property Custodian', $to->name);
        $currentHolder = $this->makeUser('Requester', $from->name);
        $asset = Asset::create([
            'asset_id' => 'AST-TRANSFER-UNITS',
            'property_number' => 'PROP-TRANSFER-UNITS',
            'name' => 'Transfer Unit Test Asset',
            'department_id' => $from->id,
            'custodian_id' => $staff->id,
            'quantity' => 2,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'assigned',
        ]);
        $firstUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-TRANSFER-001',
            'status' => 'assigned',
            'department_id' => $from->id,
            'custodian_id' => $currentHolder->id,
            'condition' => 'good',
        ]);
        $secondUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-TRANSFER-002',
            'status' => 'assigned',
            'department_id' => $from->id,
            'condition' => 'good',
        ]);
        $availableUnit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-TRANSFER-003',
            'status' => 'available',
            'condition' => 'good',
        ]);
        $this->actingAs($staff);

        $createTransfer = fn (int $unitId) => $this->postJson('/api/transfers', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unitId,
            'to_department_id' => $to->id,
            'to_custodian_id' => $custodian->id,
            'quantity' => 1,
            'reason' => 'Move assigned physical unit.',
        ]);

        $createTransfer($availableUnit->id)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The selected physical unit is not assigned to this asset or is no longer assigned.');

        $firstTransfer = $createTransfer($firstUnit->id)->assertCreated()
            ->assertJsonPath('asset_unit_id', $firstUnit->id)
            ->assertJsonPath('from_custodian_id', $currentHolder->id)
            ->assertJsonPath('to_custodian_id', $custodian->id)
            ->assertJsonPath('status', 'ready_for_transfer')
            ->json();

        $createTransfer($firstUnit->id)->assertUnprocessable()
            ->assertJsonPath(
                'message',
                "UNIT-TRANSFER-001 already has active transfer {$firstTransfer['transfer_number']} (ready for transfer). Select a different physical unit or resolve that transfer first.",
            );

        $createTransfer($secondUnit->id)->assertCreated()
            ->assertJsonPath('asset_unit_id', $secondUnit->id);

        $this->assertDatabaseCount('asset_transfers', 2);
    }

    public function test_same_department_legacy_transfer_does_not_block_unit_transfer_approval(): void
    {
        $staff = $this->makeUser('PPMO Staff');
        $from = Department::create([
            'code' => 'TR-SOURCE',
            'name' => 'Transfer Source',
            'is_active' => true,
        ]);
        $to = Department::create([
            'code' => 'TR-DEST',
            'name' => 'Transfer Destination',
            'is_active' => true,
        ]);
        $custodian = $this->makeUser('Property Custodian', $to->name);
        $asset = Asset::create([
            'asset_id' => 'AST-TRANSFER-APPROVAL',
            'property_number' => 'PROP-TRANSFER-APPROVAL',
            'name' => 'Transfer Approval Test Asset',
            'department_id' => $from->id,
            'quantity' => 2,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'assigned',
        ]);
        $unit = AssetUnit::create([
            'asset_id' => $asset->id,
            'unit_code' => 'UNIT-TRANSFER-APPROVAL',
            'status' => 'assigned',
            'department_id' => $from->id,
            'condition' => 'good',
        ]);
        $this->actingAs($staff);

        $transfer = $this->postJson('/api/transfers', [
            'asset_id' => $asset->id,
            'asset_unit_id' => $unit->id,
            'to_department_id' => $to->id,
            'to_custodian_id' => $custodian->id,
            'quantity' => 1,
            'reason' => 'Move assigned physical unit.',
        ])->assertCreated()->json();

        AssetTransfer::create([
            'transfer_number' => 'TR-LEGACY-SAME-DEPT',
            'asset_id' => $asset->id,
            'from_department_id' => $from->id,
            'to_department_id' => $from->id,
            'status' => 'ready_for_transfer',
            'reason' => 'Legacy no-op transfer',
            'quantity' => 10,
        ]);

        AssetTransfer::whereKey($transfer['id'])->update(['status' => 'department_approved']);
        $this->patchJson("/api/transfers/{$transfer['id']}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'ready_for_transfer')
            ->assertJsonPath('to_custodian_id', $custodian->id);
    }
}

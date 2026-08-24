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
}

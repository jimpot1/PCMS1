<?php

namespace Tests\Feature;

use App\Http\Controllers\AssetAssignmentController;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\User;
use App\Http\Controllers\PurchaseRequestController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use ReflectionMethod;
use Tests\TestCase;

class AssetInventoryLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function invokeSync(AssetAssignmentController $controller, Asset $asset, ?AssetAssignment $assignment = null): void
    {
        $method = new ReflectionMethod($controller, 'syncAssetInventory');
        $method->setAccessible(true);
        $method->invoke($controller, $asset->fresh(), $assignment);
    }

    protected function makeUser(string $role, string $name): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'EMP-' . Str::upper(Str::random(6)),
            'first_name' => $name,
            'last_name' => 'Test',
            'full_name' => $name . ' Test',
            'email' => strtolower(str_replace(' ', '.', $name)) . '-' . Str::lower(Str::random(8)) . '@example.test',
            'password_hash' => bcrypt('secret'),
            'role' => $role,
            'department' => 'Operations',
            'status' => 'active',
        ]);
    }

    public function test_low_stock_auto_requisition_is_disabled_by_default(): void
    {
        $this->assertFalse(\App\Http\Controllers\SystemSettingController::bool('low_stock_auto_requisition_enabled', false));
    }

    public function test_duplicate_property_number_returns_field_specific_validation_message(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $this->actingAs($staff);

        Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'DUP-1001',
            'name' => 'Existing Laptop',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1500,
            'purchase_date' => now()->toDateString(),
        ]);

        $response = $this->postJson('/api/assets', [
            'property_number' => 'DUP-1001',
            'name' => 'New Laptop',
            'quantity' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('errors.property_number.0', 'This property number already exists. Please review the existing asset record or choose a different number.');
    }

    public function test_online_supply_request_routes_to_release_queue_and_deducts_stock_once_on_release(): void
    {
        $requester = $this->makeUser('Requester', 'Employee');
        $ppmoStaff = $this->makeUser('PPMO Staff', 'PPMO');
        $this->actingAs($ppmoStaff);

        $supply = \App\Models\Supply::create([
            'name' => 'Bond Paper',
            'sku' => 'BP-01',
            'category' => 'Office Supplies',
            'description' => 'A4 bond paper',
            'stock' => 10,
            'minimum_stock' => 2,
            'unit_price' => 60,
            'department_id' => null,
        ]);

        $request = new \Illuminate\Http\Request([
            'department_id' => null,
            'request_type' => 'request',
            'date_needed' => now()->addDay()->toDateString(),
            'purpose' => 'Office supply replenishment',
            'line_items' => [[
                'type' => 'supply',
                'source_type' => 'supply',
                'source_id' => $supply->id,
                'item' => 'Bond Paper',
                'qty' => 2,
                'quantity' => 2,
                'unit_price' => 60,
            ]],
        ]);
        $request->setUserResolver(fn () => $requester);

        $response = app(\App\Http\Controllers\PurchaseRequestController::class)->store($request);
        $purchaseRequest = \App\Models\PurchaseRequest::query()->latest('id')->firstOrFail();
        $data = $response->getData(true)['data'] ?? [];

        $this->assertSame('supplies_inventory_release', $purchaseRequest->workflow_destination);
        $this->assertSame('supplies_inventory_release', $data['workflow_destination'] ?? $purchaseRequest->workflow_destination);

        $purchaseRequest->update(['status' => 'approved', 'current_stage' => 'ppmo_staff']);

        $releaseRequest = new \Illuminate\Http\Request();
        $releaseRequest->setUserResolver(fn () => $ppmoStaff);
        $releaseResponse = app(\App\Http\Controllers\PurchaseRequestController::class)->release($releaseRequest, $purchaseRequest);
        $payload = $releaseResponse->getData(true);

        $this->assertSame('released', $purchaseRequest->fresh()->status);
        $this->assertSame(8, (int) $supply->fresh()->stock);
        $this->assertSame(2, (int) \App\Models\StockMovement::query()->where('supply_id', $supply->id)->where('movement_type', 'out')->sum('quantity'));
        $this->assertNotEmpty($payload['data'] ?? null);
    }

    public function test_walk_in_supply_request_routes_to_release_queue_and_releases_stock_once(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'PPMO');
        $this->actingAs($staff);

        $supply = \App\Models\Supply::create([
            'name' => 'Stapler Pins',
            'sku' => 'SP-01',
            'category' => 'Office Supplies',
            'description' => 'Stapler pins',
            'stock' => 5,
            'minimum_stock' => 1,
            'unit_price' => 15,
            'department_id' => null,
        ]);

        $request = new \Illuminate\Http\Request([
            'has_account' => false,
            'walk_in_requester_name' => 'Walk-in Requester',
            'department_id' => null,
            'request_type' => 'request',
            'date_needed' => now()->addDay()->toDateString(),
            'purpose' => 'Office supply issuance',
            'line_items' => [[
                'type' => 'supply',
                'source_type' => 'supply',
                'source_id' => $supply->id,
                'item' => 'Stapler Pins',
                'qty' => 3,
                'quantity' => 3,
                'unit_price' => 15,
            ]],
        ]);
        $request->setUserResolver(fn () => $staff);

        $response = app(\App\Http\Controllers\PurchaseRequestController::class)->storeWalkIn($request);
        $purchaseRequest = \App\Models\PurchaseRequest::query()->latest('id')->firstOrFail();
        $data = $response->getData(true)['data'] ?? [];

        $this->assertSame('supplies_inventory_release', $purchaseRequest->workflow_destination);
        $this->assertSame('approved', $purchaseRequest->status);
        $this->assertSame('supplies_inventory_release', $data['workflow_destination'] ?? $purchaseRequest->workflow_destination);

        $purchaseRequest->update(['status' => 'approved', 'current_stage' => 'ppmo_staff']);

        $releaseRequest = new \Illuminate\Http\Request();
        $releaseRequest->setUserResolver(fn () => $staff);
        app(\App\Http\Controllers\PurchaseRequestController::class)->release($releaseRequest, $purchaseRequest);

        $this->assertSame('released', $purchaseRequest->fresh()->status);
        $this->assertSame(2, (int) $supply->fresh()->stock);
        $this->assertSame(3, (int) \App\Models\StockMovement::query()->where('supply_id', $supply->id)->where('movement_type', 'out')->sum('quantity'));
    }

    public function test_online_asset_request_routes_to_assignment_queue(): void
    {
        $requester = $this->makeUser('Requester', 'Employee');
        $staff = $this->makeUser('PPMO Staff', 'PPMO');
        $this->actingAs($staff);

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-ASSIGN-1001',
            'name' => 'Laptop Dock',
            'quantity' => 3,
            'available_quantity' => 3,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 2500,
            'purchase_date' => now()->toDateString(),
        ]);

        $request = new \Illuminate\Http\Request([
            'department_id' => null,
            'request_type' => 'request',
            'date_needed' => now()->addDay()->toDateString(),
            'purpose' => 'Office equipment issuance',
            'line_items' => [[
                'type' => 'asset',
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'item' => 'Laptop Dock',
                'qty' => 2,
                'quantity' => 2,
                'unit_price' => 2500,
            ]],
        ]);
        $request->setUserResolver(fn () => $requester);

        app(\App\Http\Controllers\PurchaseRequestController::class)->store($request);
        $purchaseRequest = \App\Models\PurchaseRequest::query()->latest('id')->firstOrFail();

        $this->assertSame('asset_assignment', $purchaseRequest->workflow_destination);
        $this->assertSame('pending', $purchaseRequest->status);

        $purchaseRequest->update(['status' => 'approved', 'current_stage' => 'ppmo_staff']);

        $response = $this->getJson('/api/purchase-requests/asset-assignment-queue');

        $response->assertOk()
            ->assertJsonPath('data.0.request_number', $purchaseRequest->request_number)
            ->assertJsonPath('data.0.status', 'Awaiting Assignment');
    }

    public function test_walk_in_asset_request_routes_to_assignment_queue(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'PPMO');
        $this->actingAs($staff);

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-ASSIGN-1002',
            'name' => 'Dual Monitor',
            'quantity' => 4,
            'available_quantity' => 4,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 3200,
            'purchase_date' => now()->toDateString(),
        ]);

        $request = new \Illuminate\Http\Request([
            'has_account' => false,
            'walk_in_requester_name' => 'Walk-in Requester',
            'department_id' => null,
            'request_type' => 'request',
            'date_needed' => now()->addDay()->toDateString(),
            'purpose' => 'Workstation setup',
            'line_items' => [[
                'type' => 'asset',
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'item' => 'Dual Monitor',
                'qty' => 1,
                'quantity' => 1,
                'unit_price' => 3200,
            ]],
        ]);
        $request->setUserResolver(fn () => $staff);

        app(\App\Http\Controllers\PurchaseRequestController::class)->storeWalkIn($request);
        $purchaseRequest = \App\Models\PurchaseRequest::query()->latest('id')->firstOrFail();

        $this->assertSame('asset_assignment', $purchaseRequest->workflow_destination);
        $this->assertSame('approved', $purchaseRequest->status);

        $response = $this->getJson('/api/purchase-requests/asset-assignment-queue');

        $response->assertOk()
            ->assertJsonPath('data.0.request_number', $purchaseRequest->request_number)
            ->assertJsonPath('data.0.status', 'Awaiting Assignment');
    }

    public function test_asset_request_cannot_be_processed_by_generic_release(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'PPMO Staff');
        $requester = $this->makeUser('Requester', 'Requester');
        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-ROUTE-1001',
            'name' => 'Route Test Asset',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);
        $purchaseRequest = \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-ROUTE-1001',
            'requested_by' => $requester->id,
            'current_stage' => 'ppmo_staff',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'asset_assignment',
            'line_items' => [[
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'workflow_destination' => 'asset_assignment',
                'item' => 'Route Test Asset',
                'qty' => 1,
                'quantity' => 1,
            ]],
        ]);

        $this->actingAs($staff)
            ->patchJson("/api/purchase-requests/{$purchaseRequest->id}/release")
            ->assertStatus(422)
            ->assertJsonPath('workflow_destination', 'asset_assignment');

        $this->assertDatabaseMissing('asset_assignments', ['asset_id' => $asset->id]);
        $this->assertSame(1, (int) $asset->fresh()->available_quantity);
    }

    public function test_asset_assignment_process_completes_request_once_without_supply_deduction(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'PPMO Staff');
        $requester = $this->makeUser('Requester', 'Requester');
        $supply = \App\Models\Supply::create([
            'name' => 'Unrelated Supply',
            'sku' => 'ROUTE-SUPPLY-01',
            'stock' => 10,
            'minimum_stock' => 1,
            'unit_price' => 50,
        ]);
        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-ROUTE-1002',
            'name' => 'Untracked Physical Asset',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1000,
            'purchase_date' => now()->toDateString(),
        ]);
        $purchaseRequest = \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-ROUTE-1002',
            'requested_by' => $requester->id,
            'current_stage' => 'ppmo_staff',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'asset_assignment',
            'line_items' => [[
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'workflow_destination' => 'asset_assignment',
                'item' => 'Untracked Physical Asset',
                'qty' => 1,
                'quantity' => 1,
            ]],
        ]);

        $payload = [
            'asset_id' => $asset->id,
            'assigned_to' => $requester->id,
            'quantity' => 1,
            'assignment_type' => 'permanent',
            'accept_now' => true,
            'purchase_request_id' => $purchaseRequest->id,
        ];

        $this->actingAs($staff)
            ->postJson('/api/assignments', $payload)
            ->assertCreated();

        $this->assertSame('released', $purchaseRequest->fresh()->status);
        $this->assertSame(0, (int) $asset->fresh()->available_quantity);
        $this->assertSame(10, (int) $supply->fresh()->stock);
        $this->assertDatabaseCount('asset_assignments', 1);

        $this->postJson('/api/assignments', $payload)->assertStatus(422);
        $this->assertDatabaseCount('asset_assignments', 1);
    }

    public function test_ppmo_staff_can_update_purchase_order_for_receiving_workflow(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        $purchaseRequest = \App\Models\PurchaseRequest::create([
            'request_number' => 'PR-9001',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'purchase_order',
            'workflow_destination' => 'purchase_workflow',
            'purpose' => 'Office supplies',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-1',
                'item' => 'Notebook',
                'qty' => 10,
                'quantity' => 10,
                'unit_price' => 100,
            ]],
            'timeline' => [],
            'procurement_status' => 'approved',
            'qc_status' => 'pending',
            'total_amount' => 1000,
        ]);

        $policy = new \App\Policies\PurchaseRequestPolicy();

        $this->assertTrue($policy->update($staff, $purchaseRequest));
    }

    public function test_ppmo_release_queue_excludes_purchase_order_records(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        \App\Models\PurchaseRequest::create([
            'request_number' => 'PR-9002',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'supplies_inventory_release',
            'purpose' => 'Office supplies',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-2',
                'item' => 'Printer paper',
                'qty' => 5,
                'quantity' => 5,
                'unit_price' => 40,
            ]],
            'timeline' => [],
            'procurement_status' => 'ready_to_release',
            'qc_status' => 'passed',
            'total_amount' => 200,
        ]);

        \App\Models\PurchaseRequest::create([
            'request_number' => 'PO-9003',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'purchase_order',
            'workflow_destination' => 'purchase_workflow',
            'purpose' => 'Procurement replenishment',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-3',
                'item' => 'Printer paper',
                'qty' => 20,
                'quantity' => 20,
                'unit_price' => 50,
            ]],
            'timeline' => [],
            'procurement_status' => 'received',
            'qc_status' => 'passed',
            'total_amount' => 1000,
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);
        $request->merge(['current_stage' => 'property_custodian', 'per_page' => 15]);

        $response = app(PurchaseRequestController::class)->index($request);
        $payload = $response->getData(true);

        $numbers = collect($payload['data'] ?? [])->pluck('request_number')->all();

        $this->assertContains('PR-9002', $numbers);
        $this->assertNotContains('PO-9003', $numbers);
    }

    public function test_purchase_order_requests_are_visible_when_filtering_for_receiving_workflow(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        \App\Models\PurchaseRequest::create([
            'request_number' => 'PO-9012',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'purchase_order',
            'workflow_destination' => 'purchase_workflow',
            'purpose' => 'Procurement replenishment',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-12',
                'item' => 'Notebook',
                'qty' => 25,
                'quantity' => 25,
                'unit_price' => 120,
            ]],
            'timeline' => [],
            'total_amount' => 3000,
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);
        $request->merge(['current_stage' => 'property_custodian', 'status' => 'approved', 'request_type' => 'purchase_order', 'per_page' => 15]);

        $response = app(PurchaseRequestController::class)->index($request);
        $payload = $response->getData(true);
        $numbers = collect($payload['data'] ?? [])->pluck('request_number')->all();

        $this->assertContains('PO-9012', $numbers);
    }

    public function test_purchase_workflow_scope_excludes_regular_request_records(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-9004',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'supplies_inventory_release',
            'purpose' => 'Office supplies',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-4',
                'item' => 'Notebook',
                'qty' => 10,
                'quantity' => 10,
                'unit_price' => 100,
            ]],
            'timeline' => [],
            'total_amount' => 1000,
        ]);

        \App\Models\PurchaseRequest::create([
            'request_number' => 'PO-9005',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'purchase_order',
            'workflow_destination' => 'purchase_workflow',
            'purpose' => 'Procurement replenishment',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-5',
                'item' => 'Notebook',
                'qty' => 25,
                'quantity' => 25,
                'unit_price' => 120,
            ]],
            'timeline' => [],
            'total_amount' => 3000,
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);
        $request->merge(['workflow_destination' => 'purchase_workflow', 'per_page' => 15]);

        $response = app(PurchaseRequestController::class)->index($request);
        $payload = $response->getData(true);
        $numbers = collect($payload['data'] ?? [])->pluck('request_number')->all();

        $this->assertContains('PO-9005', $numbers);
        $this->assertNotContains('REQ-9004', $numbers);
    }

    public function test_release_queue_only_loads_approved_records_for_release_stage(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-9010',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'ppmo_staff',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'supplies_inventory_release',
            'purpose' => 'Approved item',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-10',
                'item' => 'Approved item',
                'qty' => 2,
                'quantity' => 2,
                'unit_price' => 50,
            ]],
            'timeline' => [],
            'total_amount' => 100,
        ]);

        \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-9011',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'ppmo_staff',
            'status' => 'pending',
            'request_type' => 'request',
            'workflow_destination' => 'supplies_inventory_release',
            'purpose' => 'Pending item',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-11',
                'item' => 'Pending item',
                'qty' => 3,
                'quantity' => 3,
                'unit_price' => 70,
            ]],
            'timeline' => [],
            'total_amount' => 210,
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);
        $request->merge(['current_stage' => 'ppmo_staff', 'status' => 'approved', 'per_page' => 15]);

        $response = app(PurchaseRequestController::class)->index($request);
        $payload = $response->getData(true);
        $numbers = collect($payload['data'] ?? [])->pluck('request_number')->all();

        $this->assertContains('REQ-9010', $numbers);
        $this->assertNotContains('REQ-9011', $numbers);
    }

    public function test_ppmo_staff_can_release_inventory_request_when_current_stage_matches_ppmo_staff(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Employee');

        $purchaseRequest = \App\Models\PurchaseRequest::create([
            'request_number' => 'REQ-9012',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'ppmo_staff',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'purchase_workflow',
            'purpose' => 'Supply release for approval',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-12',
                'item' => 'Notebook',
                'qty' => 5,
                'quantity' => 5,
                'unit_price' => 20,
            ]],
            'timeline' => [],
            'total_amount' => 100,
        ]);

        $policy = new \App\Policies\PurchaseRequestPolicy();

        $this->assertTrue($policy->release($staff, $purchaseRequest));
    }

    public function test_walk_in_request_uses_walk_in_workflow_stages(): void
    {
        $requester = $this->makeUser('Requester', 'Employee');

        $purchaseRequest = new \App\Models\PurchaseRequest([
            'request_number' => 'REQ-9004',
            'requested_by' => $requester->id,
            'department_id' => null,
            'department_name' => 'Operations',
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'request_type' => 'request',
            'workflow_destination' => 'supplies_inventory_release',
            'is_walk_in' => true,
            'purpose' => 'Office supplies',
            'line_items' => [[
                'source_type' => 'supply',
                'source_id' => 'supply-4',
                'item' => 'Notebook',
                'qty' => 10,
                'quantity' => 10,
                'unit_price' => 100,
            ]],
            'timeline' => [],
            'total_amount' => 1000,
        ]);

        $method = new ReflectionMethod(PurchaseRequestController::class, 'workflowSummary');
        $method->setAccessible(true);
        $summary = $method->invoke(new PurchaseRequestController(), $purchaseRequest);

        $stageKeys = collect($summary['stages'])->pluck('stage')->all();

        $this->assertContains('ppmo_staff', $stageKeys);
        $this->assertNotContains('department_head', $stageKeys);
        $this->assertNotContains('recommending_approver', $stageKeys);
    }

    public function test_active_assignments_reduce_inventory_but_pending_assignments_do_not(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $employee = $this->makeUser('Requester', 'Employee');

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-1001',
            'name' => 'Laptop',
            'category_id' => null,
            'department_id' => null,
            'quantity' => 10,
            'available_quantity' => 10,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1500,
            'purchase_date' => now()->toDateString(),
        ]);

        $controller = new AssetAssignmentController();

        $activeAssignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $employee->id,
            'assigned_by' => $staff->id,
            'assignment_type' => 'permanent',
            'quantity' => 3,
            'condition_before' => 'good',
            'status' => 'active',
            'accepted_at' => now(),
            'assigned_at' => now(),
        ]);

        $this->invokeSync($controller, $asset, $activeAssignment);

        $this->assertSame(7, (int) $asset->fresh()->available_quantity);
        $this->assertSame('available', $asset->fresh()->status);

        $pendingAssignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $this->makeUser('Requester', 'Another Employee')->id,
            'assigned_by' => $staff->id,
            'assignment_type' => 'temporary',
            'quantity' => 2,
            'condition_before' => 'good',
            'status' => 'pending_acceptance',
            'assigned_at' => now(),
        ]);

        $this->invokeSync($controller, $asset, $pendingAssignment);

        $this->assertSame(7, (int) $asset->fresh()->available_quantity);

        $pendingAssignment->update(['status' => 'active', 'accepted_at' => now()]);
        $this->invokeSync($controller, $asset, $pendingAssignment);

        $this->assertSame(5, (int) $asset->fresh()->available_quantity);

        $pendingAssignment->update(['status' => 'returned', 'returned_at' => now()]);
        $this->invokeSync($controller, $asset);

        $this->assertSame(7, (int) $asset->fresh()->available_quantity);
        $this->assertSame('available', $asset->fresh()->status);
    }

    public function test_staff_release_marks_assignment_active_and_updates_inventory_once(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Requester');

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-2001',
            'name' => 'Dell OptiPlex 7010',
            'category_id' => null,
            'department_id' => null,
            'quantity' => 5,
            'available_quantity' => 5,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 999,
            'purchase_date' => now()->toDateString(),
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $requester->id,
            'assigned_by' => $staff->id,
            'department_id' => null,
            'assignment_type' => 'permanent',
            'quantity' => 1,
            'purpose' => 'Awaiting release',
            'condition_before' => 'good',
            'assigned_at' => now()->subDay(),
            'status' => 'pending_acceptance',
            'approval_status' => 'approved',
            'notes' => 'Awaiting staff release',
        ]);

        $purchaseRequest = new \App\Models\PurchaseRequest([
            'request_number' => 'PR-1001',
            'requested_by' => $requester->id,
            'department_id' => null,
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'department_name' => 'Logistics',
            'purpose' => 'Workstation',
            'line_items' => [[
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'workflow_destination' => 'asset_assignment',
                'qty' => 1,
                'item' => 'Dell OptiPlex 7010',
                'quantity' => 1,
                'unit_price' => 999,
            ]],
            'timeline' => [],
        ]);

        $method = new ReflectionMethod(PurchaseRequestController::class, 'applyReleasedLineItem');
        $method->setAccessible(true);
        $method->invoke(new PurchaseRequestController(), $purchaseRequest, $purchaseRequest->line_items[0], $request);

        $assignment = AssetAssignment::query()->where('asset_id', $asset->id)->where('assigned_to', $requester->id)->firstOrFail();

        $this->assertSame('active', $assignment->status);
        $this->assertSame(1, (int) $assignment->quantity);
        $this->assertSame(4, (int) $asset->fresh()->available_quantity);
        $this->assertSame(5, (int) $asset->fresh()->quantity);
        $this->assertSame('assigned', $asset->fresh()->status);
        $this->assertSame(1, (int) AssetAssignment::where('asset_id', $asset->id)->where('status', 'active')->sum('quantity'));
        $this->assertSame(1, AssetAssignment::where('asset_id', $asset->id)->count());
    }

    public function test_purchase_request_asset_release_creates_par_accountability_record(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $requester = $this->makeUser('Requester', 'Requester');

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-3001',
            'serial_number' => 'SN-3001',
            'name' => 'Laptop',
            'category_id' => null,
            'department_id' => null,
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 1250,
            'purchase_date' => now()->toDateString(),
        ]);

        $request = new \Illuminate\Http\Request();
        $request->setUserResolver(fn () => $staff);

        $purchaseRequest = new \App\Models\PurchaseRequest([
            'request_number' => 'PR-2001',
            'requested_by' => $requester->id,
            'department_id' => null,
            'current_stage' => 'property_custodian',
            'status' => 'approved',
            'department_name' => 'Operations',
            'purpose' => 'Work laptop issuance',
            'line_items' => [[
                'source_type' => 'asset',
                'source_id' => $asset->id,
                'workflow_destination' => 'asset_assignment',
                'qty' => 1,
                'item' => 'Laptop',
                'quantity' => 1,
                'unit_price' => 1250,
            ]],
            'timeline' => [],
        ]);

        $method = new ReflectionMethod(PurchaseRequestController::class, 'applyReleasedLineItem');
        $method->setAccessible(true);
        $method->invoke(new PurchaseRequestController(), $purchaseRequest, $purchaseRequest->line_items[0], $request);

        $assignment = AssetAssignment::query()->where('asset_id', $asset->id)->where('assigned_to', $requester->id)->firstOrFail();
        $record = DB::table('accountability_forms')->where('assignment_id', $assignment->id)->first();

        $this->assertNotNull($record);
        $this->assertStringStartsWith('PAR-', $record->form_number);

        $payload = json_decode($record->payload, true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('INV-3001', $payload['asset']['property_number']);
        $this->assertSame('SN-3001', $payload['asset']['serial_number']);
        $this->assertSame(1250.0, (float) $payload['asset']['acquisition_cost']);
        $this->assertNotEmpty($payload['accountability_statement']);
    }

    public function test_clearance_check_creates_local_clearance_record_and_flags_missing_items(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $employee = $this->makeUser('Requester', 'Employee');
        $this->actingAs($staff);
        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-4001',
            'name' => 'Monitor',
            'category_id' => null,
            'department_id' => null,
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
            'purchase_cost' => 500,
            'purchase_date' => now()->toDateString(),
        ]);

        AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $employee->id,
            'assigned_by' => $staff->id,
            'assignment_type' => 'permanent',
            'quantity' => 1,
            'purpose' => 'Office equipment',
            'condition_before' => 'good',
            'status' => 'active',
            'accepted_at' => now(),
            'assigned_at' => now(),
        ]);

        $response = (new AssetAssignmentController())->clearanceCheck($employee->id);
        $payload = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('data', $payload);
        $this->assertArrayHasKey('clearance', $payload['data']);
        $this->assertSame('pending', $payload['data']['clearance']['status']);
        $this->assertNotEmpty($payload['data']['missing_items']);
    }

    public function test_clearance_cannot_be_cleared_while_active_assignments_remain(): void
    {
        $staff = $this->makeUser('PPMO Staff', 'Staff');
        $employee = $this->makeUser('Requester', 'Employee');
        $this->actingAs($staff);

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-5001',
            'name' => 'Keyboard',
            'quantity' => 1,
            'available_quantity' => 0,
            'condition' => 'good',
            'status' => 'assigned',
        ]);
        $assignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $employee->id,
            'assigned_by' => $staff->id,
            'quantity' => 1,
            'status' => 'active',
        ]);
        $request = new \Illuminate\Http\Request(['decision' => 'cleared']);
        $request->setUserResolver(fn () => $staff);

        $response = (new AssetAssignmentController())->finalizeClearance($request, $employee->id);

        $this->assertSame(422, $response->getStatusCode());
        $this->assertSame([$assignment->id], json_decode($response->getContent(), true)['missing_items']);
        $this->assertDatabaseMissing('clearance_requests', ['user_id' => $employee->id]);
    }

    public function test_hold_clearance_links_par_and_logs_decision(): void
    {
        $staff = $this->makeUser('Property Custodian', 'Custodian');
        $employee = $this->makeUser('Requester', 'Employee');
        $this->actingAs($staff);

        $asset = Asset::create([
            'asset_id' => 'AST-' . Str::upper(Str::random(8)),
            'property_number' => 'INV-6001',
            'name' => 'Mouse',
            'quantity' => 1,
            'available_quantity' => 1,
            'condition' => 'good',
            'status' => 'available',
        ]);
        $assignment = AssetAssignment::create([
            'asset_id' => $asset->id,
            'assigned_to' => $employee->id,
            'assigned_by' => $staff->id,
            'quantity' => 1,
            'status' => 'returned',
        ]);
        $formId = DB::table('accountability_forms')->insertGetId([
            'assignment_id' => $assignment->id,
            'form_number' => 'PAR-2026-' . str_pad((string) $assignment->id, 6, '0', STR_PAD_LEFT),
            'payload' => json_encode(['par_number' => 'PAR-test']),
            'generated_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $request = new \Illuminate\Http\Request(['decision' => 'hold', 'notes' => 'Pending supervisor review.']);
        $request->setUserResolver(fn () => $staff);

        $response = (new AssetAssignmentController())->finalizeClearance($request, $employee->id);
        $payload = json_decode($response->getContent(), true);
        $clearanceId = $payload['data']['clearance']['id'];

        $this->assertSame('hold', $payload['data']['clearance']['status']);
        $record = DB::table('clearance_requests')->where('id', $clearanceId)->first();
        $this->assertSame([$formId], json_decode($record->accountability_form_ids, true));
        $this->assertDatabaseHas('activity_logs', ['action' => 'clearance_decision_recorded']);

        $partialRequest = new \Illuminate\Http\Request(['decision' => 'partial']);
        $partialRequest->setUserResolver(fn () => $staff);
        $partialResponse = (new AssetAssignmentController())->finalizeClearance($partialRequest, $employee->id);

        $this->assertSame('partial', json_decode($partialResponse->getContent(), true)['data']['clearance']['status']);
        $this->assertSame(2, DB::table('activity_logs')->where('action', 'clearance_decision_recorded')->count());
    }

    public function test_requester_cannot_access_clearance_endpoints(): void
    {
        $requester = $this->makeUser('Requester', 'Employee');
        $this->actingAs($requester);
        $request = new \Illuminate\Http\Request;
        $request->setUserResolver(fn () => $requester);

        $this->expectException(\Illuminate\Auth\Access\AuthorizationException::class);
        (new AssetAssignmentController())->clearanceCheck($requester->id);
    }
}

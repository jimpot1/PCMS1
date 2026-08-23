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

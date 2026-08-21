<?php

namespace Tests\Feature;

use App\Http\Controllers\AssetAssignmentController;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\User;
use App\Http\Controllers\PurchaseRequestController;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}

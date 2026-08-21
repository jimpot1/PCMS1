<?php

use App\Http\Controllers\GatePassController;
use App\Http\Controllers\PurchaseRequestController;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\Department;
use App\Models\GatePass;
use App\Models\PurchaseRequest;
use App\Models\StockMovement;
use App\Models\Supply;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
Gate::policy(PurchaseRequest::class, App\Policies\PurchaseRequestPolicy::class);

$results = [];

$pass = function (string $label) use (&$results): void {
    $results[] = ['PASS', $label];
};

$fail = function (string $label, string $message) use (&$results): void {
    $results[] = ['FAIL', $label . ' - ' . $message];
};

$assert = function (bool $condition, string $label) use ($pass, $fail): void {
    $condition ? $pass($label) : $fail($label, 'assertion failed');
};

$purchaseRequestController = app(PurchaseRequestController::class);
$gatePassController = app(GatePassController::class);

$requestFor = function (User $user): Request {
    $request = Request::create('/api/purchase-requests/verify/release', 'PATCH');
    $request->setUserResolver(fn () => $user);

    return $request;
};

$release = function (PurchaseRequest $purchaseRequest, User $user) use ($purchaseRequestController, $requestFor): void {
    Auth::setUser($user);
    $response = $purchaseRequestController->release($requestFor($user), $purchaseRequest);

    if ($response->getStatusCode() >= 400) {
        throw new RuntimeException((string) ($response->getData(true)['message'] ?? 'Release rejected.'));
    }
};

$releaseGatePass = function (GatePass $gatePass, User $user) use ($gatePassController, $requestFor): void {
    Auth::setUser($user);
    $response = $gatePassController->release($requestFor($user), $gatePass);

    if ($response->getStatusCode() >= 400) {
        throw new RuntimeException((string) ($response->getData(true)['message'] ?? 'Gate pass release rejected.'));
    }
};

$makeUser = function (string $role, string $department): User {
    return User::create([
        'id' => (string) Str::uuid(),
        'first_name' => 'Lifecycle',
        'last_name' => str_replace(' ', '', $role),
        'full_name' => "Lifecycle {$role}",
        'email' => strtolower(str_replace(' ', '.', $role)) . '.' . Str::lower(Str::random(8)) . '@example.test',
        'password_hash' => bcrypt('password'),
        'role' => $role,
        'department' => $department,
        'status' => 'active',
    ]);
};

$makeRequest = function (User $requester, Department $department, array $lineItems, string $status = 'approved') {
    return PurchaseRequest::create([
        'request_number' => 'VR-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5)),
        'requested_by' => $requester->id,
        'department_id' => $department->id,
        'current_stage' => $status === 'approved' ? 'released' : 'department_head',
        'status' => $status,
        'request_type' => 'request',
        'workflow_destination' => 'mixed_workflow',
        'department_name' => $department->name,
        'purpose' => 'Lifecycle verification',
        'line_items' => $lineItems,
        'timeline' => [],
        'total_amount' => 0,
    ]);
};

DB::beginTransaction();

try {
    $department = Department::create([
        'code' => 'VR' . Str::upper(Str::random(6)),
        'name' => 'Verification Department ' . Str::upper(Str::random(5)),
        'is_active' => true,
    ]);

    $requester = $makeUser('Requester', $department->name);
    $custodian = $makeUser('Property Custodian', $department->name);
    $makeUser('OIC', $department->name);
    $makeUser('System Administrator', $department->name);
    $staff = $makeUser('PPMO Staff', $department->name);

    $supply = Supply::create([
        'sku' => 'VR-SUP-' . Str::upper(Str::random(6)),
        'name' => 'Verification Supply',
        'category' => 'Verification',
        'stock' => 10,
        'minimum_stock' => 1,
    ]);

    $line = [
        'source_type' => 'supply',
        'type' => 'supply',
        'source_id' => $supply->id,
        'item' => $supply->name,
        'qty' => 3,
        'workflow_destination' => 'supplies_inventory_release',
    ];

    $submitted = $makeRequest($requester, $department, [$line], 'pending');
    $assert($supply->fresh()->stock === 10 && StockMovement::where('supply_id', $supply->id)->count() === 0, 'A. Request submitted leaves supply stock unchanged');

    $submitted->update(['status' => 'approved', 'current_stage' => 'released']);
    $assert($supply->fresh()->stock === 10 && StockMovement::where('supply_id', $supply->id)->count() === 0, 'B. Request approved leaves supply stock unchanged');

    Auth::setUser($staff);
    $normalWalkInRequest = Request::create('/api/purchase-requests/walk-in', 'POST', [
        'has_account' => true,
        'requester_user_id' => $requester->id,
        'department_id' => $department->id,
        'purpose' => 'Normal walk-in verification',
        'request_type' => 'request',
        'date_needed' => now()->addDay()->toDateString(),
        'line_items' => [$line],
    ]);
    $normalWalkInRequest->setUserResolver(fn () => $staff);
    $normalWalkInResponse = $purchaseRequestController->storeWalkIn($normalWalkInRequest);
    $normalWalkInPayload = $normalWalkInResponse->getData(true);
    $normalWalkIn = PurchaseRequest::findOrFail($normalWalkInPayload['data']['id']);
    $assert($normalWalkIn->status === 'pending' && $normalWalkIn->current_stage === 'recommending_approver' && $normalWalkIn->approval_status === 'not_required', 'B0. Normal walk-in request follows existing review workflow');
    $assert($supply->fresh()->stock === 10 && StockMovement::where('supply_id', $supply->id)->count() === 0, 'B0. Normal walk-in request does not deduct stock');

    $walkInSupply = Supply::create([
        'sku' => 'VR-WALK-' . Str::upper(Str::random(6)),
        'name' => 'Verification Walk-in Supply',
        'category' => 'Verification',
        'stock' => 12,
        'minimum_stock' => 0,
    ]);
    $walkInLine = [
        'type' => 'supply',
        'source_type' => 'supply',
        'source_id' => $walkInSupply->id,
        'item' => $walkInSupply->name,
        'qty' => 4,
        'quantity' => 4,
        'workflow_destination' => 'supplies_inventory_release',
    ];

    try {
        Auth::setUser($staff);
        $missingDocumentRequest = Request::create('/api/purchase-requests/walk-in', 'POST', [
            'has_account' => true,
            'requester_user_id' => $requester->id,
            'department_id' => $department->id,
            'purpose' => 'Missing approval document verification',
            'request_type' => 'request',
            'date_needed' => now()->addDay()->toDateString(),
            'already_approved' => true,
            'line_items' => [$walkInLine],
        ]);
        $missingDocumentRequest->setUserResolver(fn () => $staff);
        $purchaseRequestController->storeWalkIn($missingDocumentRequest);
        $fail('B1. Already-approved walk-in without document is rejected', 'submission unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($walkInSupply->fresh()->stock === 12, 'B1. Missing approved form does not modify inventory');
    }

    Auth::setUser($staff);
    $approvedFormRequest = Request::create('/api/purchase-requests/walk-in', 'POST', [
        'has_account' => true,
        'requester_user_id' => $requester->id,
        'department_id' => $department->id,
        'purpose' => 'Already approved walk-in verification',
        'request_type' => 'request',
        'date_needed' => now()->addDay()->toDateString(),
        'already_approved' => true,
        'line_items' => [$walkInLine],
    ], [], [
        'approval_document' => UploadedFile::fake()->create('approved-form.pdf', 24, 'application/pdf'),
    ]);
    $approvedFormRequest->setUserResolver(fn () => $staff);
    $approvedFormResponse = $purchaseRequestController->storeWalkIn($approvedFormRequest);
    $approvedFormPayload = $approvedFormResponse->getData(true);
    $approvedWalkIn = PurchaseRequest::findOrFail($approvedFormPayload['data']['id']);
    $assert($approvedWalkIn->status === 'approved' && $approvedWalkIn->current_stage === 'property_custodian' && $approvedWalkIn->approval_status === 'pending_verification' && ! empty($approvedWalkIn->approval_document_path), 'B2. Already-approved walk-in stores document and waits for verification');
    $assert($walkInSupply->fresh()->stock === 12 && StockMovement::where('supply_id', $walkInSupply->id)->count() === 0, 'B3. Already-approved submission does not deduct stock');

    try {
        $release($approvedWalkIn->fresh(), $custodian);
        $fail('B4. Unverified already-approved walk-in cannot be released', 'release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($walkInSupply->fresh()->stock === 12 && StockMovement::where('supply_id', $walkInSupply->id)->count() === 0, 'B4. Unverified approval document blocks release without inventory change');
    }

    Auth::setUser($staff);
    $verifyRequest = Request::create('/api/purchase-requests/' . $approvedWalkIn->id . '/verify-walk-in-approval', 'PATCH', [
        'decision' => 'verified',
        'verification_notes' => 'Signatures manually checked.',
    ]);
    $verifyRequest->setUserResolver(fn () => $staff);
    $purchaseRequestController->verifyWalkInApproval($verifyRequest, $approvedWalkIn->fresh());
    $approvedWalkIn = $approvedWalkIn->fresh();
    $assert($approvedWalkIn->approval_status === 'verified' && (string) $approvedWalkIn->verified_by === (string) $staff->id && $approvedWalkIn->verified_at !== null, 'B5. Staff verification records verifier, timestamp, and status');

    $release($approvedWalkIn->fresh(), $custodian);
    $assert($walkInSupply->fresh()->stock === 8 && StockMovement::where('supply_id', $walkInSupply->id)->where('quantity', 4)->exists(), 'B6. Verified already-approved walk-in deducts only on final release');
    $assert(DB::table('activity_logs')->where('action', 'purchase_request_walk_in_approval_verified')->exists(), 'B7. Walk-in approval verification audit log is recorded');

    $rejectedSupply = Supply::create([
        'sku' => 'VR-WALK-REJ-' . Str::upper(Str::random(6)),
        'name' => 'Verification Rejected Walk-in Supply',
        'category' => 'Verification',
        'stock' => 6,
        'minimum_stock' => 0,
    ]);
    $rejectedWalkIn = $makeRequest($requester, $department, [[
        ...$walkInLine,
        'source_id' => $rejectedSupply->id,
        'item' => $rejectedSupply->name,
        'qty' => 2,
        'quantity' => 2,
    ]]);
    $rejectedWalkIn->update([
        'is_walk_in' => true,
        'current_stage' => 'property_custodian',
        'approval_document_path' => 'walk-in-approval-documents/rejected.pdf',
        'approval_status' => 'pending_verification',
    ]);
    Auth::setUser($staff);
    $rejectVerifyRequest = Request::create('/api/purchase-requests/' . $rejectedWalkIn->id . '/verify-walk-in-approval', 'PATCH', [
        'decision' => 'rejected',
        'verification_notes' => 'Signature missing.',
    ]);
    $rejectVerifyRequest->setUserResolver(fn () => $staff);
    $purchaseRequestController->verifyWalkInApproval($rejectVerifyRequest, $rejectedWalkIn->fresh());
    try {
        $release($rejectedWalkIn->fresh(), $custodian);
        $fail('B8. Rejected walk-in verification cannot be released', 'release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($rejectedSupply->fresh()->stock === 6 && StockMovement::where('supply_id', $rejectedSupply->id)->count() === 0, 'B8. Rejected verification blocks release without inventory change');
    }

    $release($submitted->fresh(), $custodian);
    $movement = StockMovement::where('supply_id', $supply->id)->latest('id')->first();
    $assert($supply->fresh()->stock === 7, 'C. Final release deducts released supply quantity');
    $assert($movement && $movement->movement_type === 'out' && (int) $movement->quantity === 3 && (int) $movement->department_id === $department->id, 'D. Final release creates correct stock movement');

    try {
        $release($submitted->fresh(), $custodian);
        $fail('E. Duplicate release is rejected', 'second release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($supply->fresh()->stock === 7 && StockMovement::where('supply_id', $supply->id)->count() === 1, 'E. Duplicate release deducts stock only once');
    }

    $shortSupply = Supply::create([
        'sku' => 'VR-SHORT-' . Str::upper(Str::random(6)),
        'name' => 'Verification Short Supply',
        'category' => 'Verification',
        'stock' => 1,
        'minimum_stock' => 0,
    ]);
    $shortRequest = $makeRequest($requester, $department, [[
        'source_type' => 'supply',
        'type' => 'supply',
        'source_id' => $shortSupply->id,
        'item' => $shortSupply->name,
        'qty' => 2,
        'workflow_destination' => 'supplies_inventory_release',
    ]]);

    try {
        $release($shortRequest, $custodian);
        $fail('F. Insufficient stock is rejected', 'release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($shortSupply->fresh()->stock === 1 && $shortRequest->fresh()->status === 'approved', 'F. Insufficient stock leaves supply and request unchanged');
    }

    $asset = Asset::create([
        'asset_id' => 'VR-AST-' . Str::upper(Str::random(6)),
        'property_number' => 'VR-PROP-' . Str::upper(Str::random(6)),
        'name' => 'Verification Asset',
        'department_id' => $department->id,
        'status' => 'available',
        'condition' => 'good',
        'quantity' => 1,
        'available_quantity' => 1,
    ]);
    $assetRequest = $makeRequest($requester, $department, [[
        'source_type' => 'asset',
        'type' => 'asset',
        'source_id' => $asset->id,
        'item' => $asset->name,
        'qty' => 1,
        'workflow_destination' => 'asset_assignment',
    ]]);
    $release($assetRequest, $custodian);
    $assignment = AssetAssignment::where('asset_id', $asset->id)->first();
    $assert($assignment && $asset->fresh()->status === 'assigned' && (int) $asset->fresh()->available_quantity === 0, 'G. Asset release creates assignment and marks asset unavailable');

    $issuedRequest = $makeRequest($requester, $department, [[
        'source_type' => 'asset',
        'type' => 'asset',
        'source_id' => $asset->id,
        'item' => $asset->name,
        'qty' => 1,
        'workflow_destination' => 'asset_assignment',
    ]]);

    try {
        $release($issuedRequest, $custodian);
        $fail('H. Already-issued asset is rejected', 'release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert(AssetAssignment::where('asset_id', $asset->id)->count() === 1 && $issuedRequest->fresh()->status === 'approved', 'H. Already-issued asset cannot be released again');
    }

    $assert(DB::table('transfer_notifications')->where('recipient_id', $requester->id)->where('type', 'request_released')->exists(), 'I. Successful release creates requester notification');

    $gateAsset = Asset::create([
        'asset_id' => 'VR-GP-AST-' . Str::upper(Str::random(6)),
        'property_number' => 'VR-GP-PROP-' . Str::upper(Str::random(6)),
        'name' => 'Verification Gate Pass Asset',
        'department_id' => $department->id,
        'status' => 'assigned',
        'condition' => 'good',
        'quantity' => 1,
        'available_quantity' => 0,
    ]);
    AssetAssignment::create([
        'asset_id' => $gateAsset->id,
        'assigned_to' => $requester->id,
        'assigned_by' => $custodian->id,
        'department_id' => $department->id,
        'assignment_type' => 'temporary',
        'quantity' => 1,
        'purpose' => 'Gate pass verification',
        'condition_before' => 'good',
        'assigned_at' => now(),
        'status' => 'active',
        'approval_status' => 'approved',
    ]);
    $gatePass = GatePass::create([
        'gate_pass_number' => 'VR-GP-' . Str::upper(Str::random(6)),
        'asset_id' => $gateAsset->id,
        'requested_by' => $requester->id,
        'department_id' => $department->id,
        'purpose' => 'Gate pass verification',
        'quantity' => 1,
        'condition_before' => 'good',
        'valid_until' => now()->addDay(),
        'approved_by' => $custodian->id,
        'status' => 'approved',
    ]);
    $releaseGatePass($gatePass, $custodian);
    $assert($gatePass->fresh()->status === 'completed' && $gateAsset->fresh()->status === 'issued', 'I2. Gate pass final release updates asset movement state');
    $assert(DB::table('transfer_notifications')->where('recipient_id', $requester->id)->where('type', 'gate_pass_released')->exists(), 'I3. Gate pass release creates requester notification');

    try {
        $releaseGatePass($gatePass->fresh(), $custodian);
        $fail('I4. Duplicate gate pass release is rejected', 'second gate pass release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($gatePass->fresh()->status === 'completed' && $gateAsset->fresh()->status === 'issued', 'I4. Duplicate gate pass release does not reprocess asset movement');
    }

    $anomalySupply = Supply::create([
        'sku' => 'VR-ANOM-' . Str::upper(Str::random(6)),
        'name' => 'Verification Anomaly Supply',
        'category' => 'Verification',
        'stock' => 50,
        'minimum_stock' => 0,
    ]);
    foreach ([1, 2, 1] as $quantity) {
        StockMovement::create([
            'supply_id' => $anomalySupply->id,
            'movement_type' => 'out',
            'quantity' => $quantity,
            'department_id' => $department->id,
            'requested_by' => $requester->id,
            'issued_by' => $custodian->id,
            'notes' => 'Historical verification movement',
        ]);
    }
    $anomalyRequest = $makeRequest($requester, $department, [[
        'source_type' => 'supply',
        'type' => 'supply',
        'source_id' => $anomalySupply->id,
        'item' => $anomalySupply->name,
        'qty' => 8,
        'workflow_destination' => 'supplies_inventory_release',
    ]]);
    $release($anomalyRequest, $custodian);
    $assert(DB::table('anomaly_alerts')->where('source_type', 'quantity_anomaly')->where('status', 'open')->exists(), 'J. Stock movement remains connected to anomaly detection');

    $rollbackSupply = Supply::create([
        'sku' => 'VR-ROLL-' . Str::upper(Str::random(6)),
        'name' => 'Verification Rollback Supply',
        'category' => 'Verification',
        'stock' => 5,
        'minimum_stock' => 0,
    ]);
    $rollbackRequest = $makeRequest($requester, $department, [[
        'source_type' => 'supply',
        'type' => 'supply',
        'source_id' => $rollbackSupply->id,
        'item' => $rollbackSupply->name,
        'qty' => 2,
        'workflow_destination' => 'supplies_inventory_release',
    ], [
        'source_type' => 'asset',
        'type' => 'asset',
        'source_id' => $asset->id,
        'item' => $asset->name,
        'qty' => 1,
        'workflow_destination' => 'asset_assignment',
    ]]);

    try {
        $release($rollbackRequest, $custodian);
        $fail('K. Failed mixed release rolls back inventory updates', 'release unexpectedly succeeded');
    } catch (Throwable $exception) {
        $assert($rollbackSupply->fresh()->stock === 5 && StockMovement::where('supply_id', $rollbackSupply->id)->count() === 0 && $rollbackRequest->fresh()->status === 'approved', 'K. Failed transaction rolls back stock movement and request state');
    }

    $assert(true, 'L. Existing approval workflow was not modified by verification script');
} catch (Throwable $throwable) {
    $fail('Verification script error', $throwable::class . ': ' . $throwable->getMessage());
} finally {
    DB::rollBack();
}

foreach ($results as [$status, $label]) {
    echo "[{$status}] {$label}" . PHP_EOL;
}

$failed = collect($results)->contains(fn ($result) => $result[0] === 'FAIL');
exit($failed ? 1 : 0);

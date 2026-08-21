<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\PurchaseRequest;
use App\Models\StockMovement;
use App\Models\Supply;
use App\Models\User;
use App\Models\Department;
use App\Services\AnomalyDetectionService;
use App\Services\LlmAnomalyExplanationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PurchaseRequestController extends Controller
{
    private const PURCHASE_STAGES = ['employee', 'department_head', 'recommending_approver', 'president', 'property_custodian', 'released'];
    private const INVENTORY_REQUEST_STAGES = ['employee', 'department_head', 'recommending_approver', 'property_custodian', 'ppmo_staff', 'released'];

    public function __construct()
    {
        // Ensure the authorizeResource middleware uses the same route parameter
        // name that `Route::apiResource('purchase-requests', ...)` registers
        // (which is `purchase_request`). If the parameter name doesn't match
        // the middleware will attempt to authorize a non-existent route
        // binding and return 403 for otherwise-authorized users.
        $this->authorizeResource(PurchaseRequest::class, 'purchase_request');
    }

    public function index(Request $request): JsonResponse
    {
        $requests = PurchaseRequest::query()
            ->with('department', 'requester')
            ->when($request->boolean('mine') || $request->user()?->role === 'Requester', fn ($query) => $query->where('requested_by', $request->user()?->id))
            ->when($request->user()?->role === 'Department Head', fn ($query) => $query->where('department_id', $this->departmentIdForUser($request->user())))
            ->when($request->user()?->role === 'Recommending Approver', fn ($query) => $query->where('current_stage', 'recommending_approver')->where('status', 'pending'))
            ->when(in_array($request->user()?->role, ['President', 'CEO'], true), fn ($query) => $query->where('current_stage', 'president')->where('status', 'pending'))
            ->when(
                in_array($request->user()?->role, ['PPMO Staff', 'Property Custodian', 'OIC'], true)
                    && ($request->filled('current_stage') || $request->filled('status')),
                function ($query) use ($request) {
                    return $query
                        ->when($request->filled('current_stage'), fn ($query) => $query->where('current_stage', $request->current_stage))
                        ->when($request->filled('status'), fn ($query) => $query->where('status', $request->status))
                        ->when($request->current_stage === 'property_custodian' && ! $request->filled('status'), fn ($query) => $query->where('status', 'approved'));
                }
            )
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->current_stage, fn ($query, $value) => $query->where('current_stage', $value))
            ->when($request->department_id, fn ($query, $value) => $query->where('department_id', $value))
            ->when($request->request_type, fn ($query, $value) => $query->where('request_type', $value))
            ->when($request->date_from, fn ($query, $value) => $query->whereDate('created_at', '>=', $value))
            ->when($request->date_to, fn ($query, $value) => $query->whereDate('created_at', '<=', $value))
            ->when($request->search, function ($query, $value) {
                $query->where(function ($query) use ($value) {
                    $query->where('request_number', 'ilike', '%' . trim($value) . '%')
                        ->orWhere('requested_by_name', 'ilike', '%' . trim($value) . '%')
                        ->orWhereHas('requester', fn ($requester) => $requester->where('full_name', 'ilike', '%' . trim($value) . '%')->orWhere('email', 'ilike', '%' . trim($value) . '%'));
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        $requests->getCollection()->transform(function (PurchaseRequest $purchaseRequest) use ($request) {
            $purchaseRequest->setAttribute('workflow', $this->workflowSummary($purchaseRequest));
            return $this->responsePurchaseRequest($purchaseRequest, $request);
        });

        return response()->json($requests);
    }

    public function supplyQueue(Request $request): JsonResponse
    {
        $requests = PurchaseRequest::query()
            ->with('department', 'requester')
            ->whereIn('status', ['pending', 'approved', 'partially_released', 'released', 'completed', 'rejected', 'cancelled'])
            ->when($request->filled('status'), function ($query) use ($request) {
                $status = match ($request->string('status')->toString()) {
                    'partially_released' => 'partially_released',
                    'released' => 'released',
                    'rejected' => 'rejected',
                    'cancelled' => 'cancelled',
                    'approved' => 'approved',
                    'pending' => 'pending',
                    default => null,
                };
                return $status ? $query->whereIn('status', $status === 'released' ? ['released', 'completed'] : [$status]) : $query;
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim($request->string('search')->toString());
                $query->where(function ($inner) use ($search) {
                    $inner->where('request_number', 'ilike', "%{$search}%")
                        ->orWhere('requested_by_name', 'ilike', "%{$search}%")
                        ->orWhereHas('requester', fn ($requester) => $requester
                            ->where('full_name', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->filled('department_id'), fn ($query) => $query->where('department_id', $request->integer('department_id')))
            ->orderByDesc('created_at')
            ->get();

        $supplyIds = $requests->flatMap(fn (PurchaseRequest $purchaseRequest) => collect($purchaseRequest->line_items ?? [])
            ->filter(fn ($lineItem) => ($lineItem['source_type'] ?? $lineItem['type'] ?? null) === 'supply')
            ->pluck('source_id'))
            ->filter()
            ->unique()
            ->values();
        $supplies = Supply::query()->whereIn('id', $supplyIds)->get()->keyBy('id');

        $rows = $requests->flatMap(function (PurchaseRequest $purchaseRequest) use ($supplies) {
            return collect($purchaseRequest->line_items ?? [])
                ->filter(fn ($lineItem) => ($lineItem['source_type'] ?? $lineItem['type'] ?? null) === 'supply')
                ->map(function (array $lineItem) use ($purchaseRequest, $supplies) {
                    $supply = $supplies->get((int) ($lineItem['source_id'] ?? 0));
                    if (! $supply) {
                        return null;
                    }

                    $requestedQuantity = (int) ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
                    $approvedQuantity = (int) ($lineItem['approved_qty'] ?? $lineItem['approved_quantity'] ?? $requestedQuantity);
                    $storedReleasedQuantity = (int) ($lineItem['released_qty'] ?? 0);
                    $movementReleasedQuantity = (int) StockMovement::query()
                        ->where('supply_id', $supply->id)
                        ->where('movement_type', 'out')
                        ->where('notes', 'like', "%Released through {$purchaseRequest->request_number}%")
                        ->sum('quantity');
                    $releasedQuantity = max($storedReleasedQuantity, $movementReleasedQuantity);
                    $remainingQuantity = max(0, $approvedQuantity - $releasedQuantity);
                    $status = match ($purchaseRequest->status) {
                        'approved' => $releasedQuantity > 0 ? 'partially_released' : 'approved',
                        'partially_released' => $remainingQuantity > 0 ? 'partially_released' : 'released',
                        'released', 'completed' => 'released',
                        'rejected' => 'rejected',
                        'cancelled' => 'cancelled',
                        default => 'pending',
                    };

                    return [
                        'id' => $purchaseRequest->id . ':' . $supply->id,
                        'request_id' => $purchaseRequest->id,
                        'request_number' => $purchaseRequest->request_number,
                        'requested_by' => $purchaseRequest->requested_by,
                        'requested_by_name' => $purchaseRequest->requested_by_name,
                        'requester' => $purchaseRequest->requester,
                        'department_id' => $purchaseRequest->department_id,
                        'department_name' => $purchaseRequest->department_name,
                        'department' => $purchaseRequest->department,
                        'purpose' => $purchaseRequest->purpose,
                        'created_at' => $purchaseRequest->created_at,
                        'status' => $purchaseRequest->status,
                        'queue_status' => $status,
                        'current_stage' => $purchaseRequest->current_stage,
                        'timeline' => $purchaseRequest->timeline,
                        'line_items' => [[
                            ...$lineItem,
                            'source_type' => 'supply',
                            'type' => 'supply',
                            'source_id' => $supply->id,
                            'requested_qty' => $requestedQuantity,
                            'approved_qty' => $approvedQuantity,
                            'released_qty' => $releasedQuantity,
                            'remaining_qty' => $remainingQuantity,
                        ]],
                        'supply' => $supply,
                    ];
                })
                ->filter();
        })->values();

        return response()->json(['data' => $rows]);
    }

    public function itemSearch(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));
        $limit = max(5, min(200, $request->integer('limit', 50)));
        $searchOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $assets = Asset::query()
            ->with('category')
            ->whereNotIn('status', ['maintenance', 'disposed', 'damaged'])
            ->where('quantity', '>', 0)
            ->when($search !== '', function ($query) use ($search, $searchOperator) {
                $query->where(function ($query) use ($search, $searchOperator) {
                    $query->where('name', $searchOperator, "%{$search}%")
                        ->orWhere('description', $searchOperator, "%{$search}%")
                        ->orWhere('property_number', $searchOperator, "%{$search}%")
                        ->orWhere('asset_id', $searchOperator, "%{$search}%")
                        ->orWhere('serial_number', $searchOperator, "%{$search}%")
                        ->orWhere('qr_code_path', $searchOperator, "%{$search}%")
                        ->orWhere('brand', $searchOperator, "%{$search}%")
                        ->orWhere('model', $searchOperator, "%{$search}%");
                })
                ->orWhereHas('category', fn ($sub) => $sub->where('name', $searchOperator, "%{$search}%"));
            })
            ->limit($limit)
            ->get()
            ->map(fn (Asset $asset) => $this->requesterCatalogRow($this->catalogRowForAsset($asset)))
            ->toBase();

        $supplies = Supply::query()
            ->when($search !== '', function ($query) use ($search, $searchOperator) {
                $query->where(function ($query) use ($search, $searchOperator) {
                    $query->where('name', $searchOperator, "%{$search}%")
                        ->orWhere('sku', $searchOperator, "%{$search}%")
                        ->orWhere('category', $searchOperator, "%{$search}%")
                        ->orWhere('description', $searchOperator, "%{$search}%");
                });
            })
            ->limit($limit)
            ->get()
            ->map(fn (Supply $supply) => $this->requesterCatalogRow($this->catalogRowForSupply($supply)))
            ->toBase();

        return response()->json([
            'data' => $supplies
                ->merge($assets)
                ->sortBy(fn ($item) => [$item['name'], $item['item_type']])
                ->values()
                ->take($limit),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
       

        $validated = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'department' => ['nullable', 'string'],
            'unit' => ['nullable', 'string'],
            'branch' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,normal,urgent,critical'],
            'date_needed' => ['nullable', 'date'],
            'purpose' => ['required_if:request_type,request', 'nullable', 'string'],
            'requested_by_name' => ['nullable', 'string'],
            'request_type' => ['nullable', 'in:purchase_order,request'],
            'attachment' => ['nullable', 'file', 'max:10240'],
            'line_items' => ['nullable', 'array'],
            'line_items.*.type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_id' => ['nullable', 'integer'],
            'line_items.*.source_ref' => ['nullable', 'string'],
            'line_items.*.qty' => ['nullable', 'integer', 'min:1'],
            'line_items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'line_items.*.unit' => ['nullable', 'string'],
            'line_items.*.item' => ['nullable', 'string'],
            'line_items.*.particular' => ['nullable', 'string'],
            'line_items.*.description' => ['nullable', 'string'],
            'line_items.*.remarks' => ['nullable', 'string'],
            'line_items.*.unit_price' => ['nullable', 'numeric'],
            'line_items.*.unitPrice' => ['nullable', 'numeric'],
            'line_items.*.estimated_cost' => ['nullable', 'numeric'],
            'line_items.*.amount' => ['nullable', 'numeric'],
            'line_items.*.preferred_custodian' => ['nullable', 'string'],
            'line_items.*.expected_usage' => ['nullable', 'string'],
            'line_items.*.location' => ['nullable', 'string'],
            'line_items.*.expected_return_date' => ['nullable', 'date'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (($validated['request_type'] ?? 'purchase_order') === 'request' && empty($validated['date_needed'])) {
            return response()->json(['message' => 'Date needed is required for Request Form submissions.'], 422);
        }

        $resolvedItems = [];
        if (($validated['request_type'] ?? 'purchase_order') === 'request') {
            $resolvedItems = $this->resolveUniversalRequestItems($validated['line_items'] ?? [], $request);
            if (empty($resolvedItems)) {
                return response()->json(['message' => 'At least one valid request item is required.'], 422);
            }
        } else {
            $resolvedItems = $this->normalizePurchaseOrderItems($validated['line_items'] ?? []);
            if (empty($resolvedItems)) {
                return response()->json(['message' => 'At least one valid item with a name and quantity is required.'], 422);
            }
        }

        $departmentId = $this->departmentIdForUser($request->user());

        if ($request->user()?->role !== 'Requester' && !$departmentId && !empty($validated['department'])) {
            $departmentId = Department::query()
                ->where('name', trim($validated['department']))
                ->orWhere('code', trim($validated['department']))
                ->value('id');
        }

        $requestType = $validated['request_type'] ?? 'purchase_order';
        $attachmentPath = $request->hasFile('attachment') ? $request->file('attachment')->store('request-attachments', 'public') : null;
        $workflowDestination = $requestType === 'request' ? $this->aggregateWorkflowDestination($resolvedItems) : 'purchase_workflow';

        $departmentName = optional(Department::find($departmentId))->name ?? $request->user()?->department;

        $purchaseRequest = DB::transaction(function () use ($request, $validated, $departmentId, $departmentName, $requestType, $resolvedItems, $attachmentPath, $workflowDestination) {
            return PurchaseRequest::create([
                'request_number' => $this->generateRequestNumber($requestType),
                'requested_by' => $request->user()?->id,
                'department_id' => $departmentId,
                'current_stage' => 'department_head',
                'status' => 'pending',
                'request_type' => $requestType,
                'workflow_destination' => $workflowDestination,
                'department_name' => $departmentName,
                'unit' => $validated['unit'] ?? null,
                'branch' => $validated['branch'] ?? null,
                'priority' => $validated['priority'] ?? 'normal',
                'date_needed' => $validated['date_needed'] ?? null,
                'purpose' => $validated['purpose'] ?? null,
                'requested_by_name' => $validated['requested_by_name'] ?? null,
                'attachment_path' => $attachmentPath,
                'line_items' => $resolvedItems,
                'timeline' => $this->initialTimeline($request, $requestType, $workflowDestination),
                'total_amount' => $requestType === 'request' ? $this->totalForLineItems($resolvedItems) : ($validated['total_amount'] ?? 0),
            ]);
        });

        $this->logActivity('purchase_request_created', $purchaseRequest, $request);

        $purchaseRequest = $purchaseRequest->fresh()->load('department', 'requester');
        $departmentHead = $this->getDepartmentHeadForRequest($purchaseRequest);

        if ($departmentHead && Schema::hasTable('transfer_notifications')) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $departmentHead->id,
                'recipient_role' => $departmentHead->role,
                'type' => 'request_submitted',
                'title' => 'Approval Required',
                'message' => "Purchase request {$purchaseRequest->request_number} from {$purchaseRequest->department_name} is waiting for your review.",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'data' => $this->responsePurchaseRequest($purchaseRequest, $request),
            'workflow' => $this->workflowSummary($purchaseRequest),
        ], 201);
    }

    /**
     * Walk-in intake: System Administrator or PPMO Staff files a request on
     * behalf of a requester who came to the PPMO office in person, whether
     * or not that requester has a PCMS account.
     *
     * Because staff have already vetted the person and the request face to
     * face, the Department Head review stage is bypassed and the request
     * enters the workflow directly at the Recommending Approver stage.
     */
    /**
     * Minimal Requester account lookup for the Walk-in intake form's account
     * picker. Scoped to System Administrator / PPMO Staff only (same as the
     * walk-in submission itself) so staff can search accounts without full
     * user-management access.
     */
    public function walkInRequesterOptions(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));

        $requesters = User::query()
            ->where('role', 'Requester')
            ->where('status', 'active')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('full_name', 'ilike', "%{$search}%")
                        ->orWhere('first_name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('employee_id', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('full_name')
            ->limit(50)
            ->get(['id', 'full_name', 'first_name', 'last_name', 'email', 'department', 'employee_id']);

        return response()->json(['data' => $requesters]);
    }

    public function storeWalkIn(Request $request): JsonResponse
    {
        $this->authorize('create', PurchaseRequest::class);

        $validated = $request->validate([
            'has_account' => ['required', 'boolean'],
            'requester_user_id' => ['required_if:has_account,true', 'nullable', 'uuid', 'exists:users,id'],
            'walk_in_requester_name' => ['required_if:has_account,false', 'nullable', 'string', 'max:255'],
            'walk_in_requester_contact' => ['nullable', 'string', 'max:255'],
            'walk_in_notes' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'department' => ['nullable', 'string'],
            'unit' => ['nullable', 'string'],
            'branch' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,normal,urgent,critical'],
            'date_needed' => ['nullable', 'date'],
            'purpose' => ['required_if:request_type,request', 'nullable', 'string'],
            'request_type' => ['nullable', 'in:purchase_order,request'],
            'attachment' => ['nullable', 'file', 'max:10240'],
            'already_approved' => ['nullable', 'boolean'],
            'approval_document' => ['required_if:already_approved,true', 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
            'line_items' => ['nullable', 'array'],
            'line_items.*.type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_id' => ['nullable', 'integer'],
            'line_items.*.source_ref' => ['nullable', 'string'],
            'line_items.*.qty' => ['nullable', 'integer', 'min:1'],
            'line_items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'line_items.*.unit' => ['nullable', 'string'],
            'line_items.*.item' => ['nullable', 'string'],
            'line_items.*.particular' => ['nullable', 'string'],
            'line_items.*.description' => ['nullable', 'string'],
            'line_items.*.remarks' => ['nullable', 'string'],
            'line_items.*.unit_price' => ['nullable', 'numeric'],
            'line_items.*.unitPrice' => ['nullable', 'numeric'],
            'line_items.*.estimated_cost' => ['nullable', 'numeric'],
            'line_items.*.amount' => ['nullable', 'numeric'],
            'line_items.*.preferred_custodian' => ['nullable', 'string'],
            'line_items.*.expected_usage' => ['nullable', 'string'],
            'line_items.*.location' => ['nullable', 'string'],
            'line_items.*.expected_return_date' => ['nullable', 'date'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $requesterUser = null;
        if ($validated['has_account']) {
            $requesterUser = User::query()->find($validated['requester_user_id']);
            if (!$requesterUser || $requesterUser->role !== 'Requester') {
                return response()->json(['message' => 'Selected account is not a Requester.'], 422);
            }
        }

        if (($validated['request_type'] ?? 'purchase_order') === 'request' && empty($validated['date_needed'])) {
            return response()->json(['message' => 'Date needed is required for Request Form submissions.'], 422);
        }

        $requestType = $validated['request_type'] ?? 'purchase_order';

        $resolvedItems = [];
        if ($requestType === 'request') {
            $resolvedItems = $this->resolveUniversalRequestItems($validated['line_items'] ?? [], $request);
            if (empty($resolvedItems)) {
                return response()->json(['message' => 'At least one valid request item is required.'], 422);
            }
        } else {
            $resolvedItems = $this->normalizePurchaseOrderItems($validated['line_items'] ?? []);
            if (empty($resolvedItems)) {
                return response()->json(['message' => 'At least one valid item with a name and quantity is required.'], 422);
            }
        }

        $departmentId = $validated['department_id'] ?? null;
        if (!$departmentId && !empty($validated['department'])) {
            $departmentId = Department::query()
                ->where('name', trim($validated['department']))
                ->orWhere('code', trim($validated['department']))
                ->value('id');
        }
        if (!$departmentId && $validated['has_account']) {
            $departmentId = $this->departmentIdForUser($requesterUser);
        }

        $attachmentPath = $request->hasFile('attachment') ? $request->file('attachment')->store('request-attachments', 'public') : null;
        $alreadyApproved = (bool) ($validated['already_approved'] ?? false);
        $approvalDocumentPath = $alreadyApproved && $request->hasFile('approval_document')
            ? $request->file('approval_document')->store('walk-in-approval-documents', 'public')
            : null;
        $workflowDestination = $requestType === 'request' ? $this->aggregateWorkflowDestination($resolvedItems) : 'purchase_workflow';
        $departmentName = optional(Department::find($departmentId))->name ?? ($validated['department'] ?? null);
        $initialStage = $alreadyApproved && $requestType === 'request' && in_array($workflowDestination, ['asset_assignment', 'supplies_inventory_release'], true)
            ? 'ppmo_staff'
            : ($alreadyApproved ? 'property_custodian' : 'recommending_approver');

        $purchaseRequest = DB::transaction(function () use (
            $request,
            $validated,
            $departmentId,
            $departmentName,
            $requestType,
            $resolvedItems,
            $attachmentPath,
            $alreadyApproved,
            $approvalDocumentPath,
            $workflowDestination,
            $initialStage,
            $requesterUser
        ) {
            return PurchaseRequest::create([
                'request_number' => $this->generateRequestNumber($requestType),
                'requested_by' => $validated['has_account'] ? $requesterUser->id : null,
                'department_id' => $departmentId,
                // Walk-ins skip Department Head review since PPMO/Admin already
                // vetted the requester in person; enter directly at Recommending Approver.
                'current_stage' => $initialStage,
                'status' => $alreadyApproved ? 'approved' : 'pending',
                'request_type' => $requestType,
                'workflow_destination' => $workflowDestination,
                'department_name' => $departmentName,
                'unit' => $validated['unit'] ?? null,
                'branch' => $validated['branch'] ?? null,
                'priority' => $validated['priority'] ?? 'normal',
                'date_needed' => $validated['date_needed'] ?? null,
                'purpose' => $validated['purpose'] ?? null,
                'requested_by_name' => $validated['has_account'] ? $requesterUser->name : ($validated['walk_in_requester_name'] ?? null),
                'attachment_path' => $attachmentPath,
                'approval_document_path' => $approvalDocumentPath,
                'approval_status' => $alreadyApproved ? 'pending_verification' : 'not_required',
                'line_items' => $resolvedItems,
                'timeline' => $this->initialTimeline($request, $requestType, $workflowDestination),
                'total_amount' => $requestType === 'request' ? $this->totalForLineItems($resolvedItems) : ($validated['total_amount'] ?? 0),
                'is_walk_in' => true,
                'walk_in_created_by' => $request->user()?->id,
                'walk_in_requester_name' => $validated['walk_in_requester_name'] ?? null,
                'walk_in_requester_contact' => $validated['walk_in_requester_contact'] ?? null,
                'walk_in_has_account' => (bool) $validated['has_account'],
                'walk_in_notes' => $validated['walk_in_notes'] ?? null,
            ]);
        });

        $this->logActivity('purchase_request_walk_in_created', $purchaseRequest, $request);

        $purchaseRequest = $purchaseRequest->fresh()->load('department', 'requester');

        $nextReviewer = $alreadyApproved
            ? $this->getCustodianForRequest($purchaseRequest)
            : User::query()->where('role', 'Recommending Approver')->where('status', 'active')->first();
        if ($nextReviewer && Schema::hasTable('transfer_notifications')) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $nextReviewer->id,
                'recipient_role' => $nextReviewer->role,
                'type' => 'request_submitted',
                'title' => $alreadyApproved ? 'Walk-in Approval Needs Verification' : 'Walk-in Request Awaiting Review',
                'message' => $alreadyApproved
                    ? "Walk-in request {$purchaseRequest->request_number} has an uploaded approved form that needs manual verification."
                    : "Walk-in request {$purchaseRequest->request_number} filed by {$request->user()?->name} is waiting for your review.",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'data' => $this->responsePurchaseRequest($purchaseRequest, $request),
            'workflow' => $this->workflowSummary($purchaseRequest),
        ], 201);
    }

    public function show(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('view', $purchaseRequest);
        return response()->json($this->responsePurchaseRequest($purchaseRequest->load('department', 'requester'), $request));
    }

    public function update(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('update', $purchaseRequest);

        $validated = $request->validate([
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'priority' => ['sometimes', 'in:low,normal,urgent,critical'],
            'date_needed' => ['sometimes', 'nullable', 'date'],
            'purpose' => ['sometimes', 'nullable', 'string'],
            'line_items' => ['sometimes', 'array', 'min:1'],
            'total_amount' => ['sometimes', 'numeric', 'min:0'],
        ]);

        if ($purchaseRequest->status === 'revision_requested' && array_key_exists('line_items', $validated)) {
            $validated['total_amount'] = $this->totalForLineItems($validated['line_items']);
        }

        $purchaseRequest->update($validated);
        $this->logActivity('purchase_request_updated', $purchaseRequest, $request);

        return response()->json($this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request));
    }

    public function resubmit(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('update', $purchaseRequest);

        if ($purchaseRequest->status !== 'revision_requested') {
            return response()->json(['message' => 'Only requests returned for revision can be resubmitted.'], 422);
        }

        if (empty($purchaseRequest->line_items)) {
            return response()->json(['message' => 'At least one request item is required before resubmission.'], 422);
        }

        $timestamp = now();
        $purchaseRequest->update([
            'current_stage' => 'department_head',
            'status' => 'pending',
            'rejection_reason' => null,
            'timeline' => array_merge($purchaseRequest->timeline ?? [], [[
                'stage' => 'Submitted',
                'status' => 'resubmitted',
                'performed_by' => $request->user()?->id,
                'timestamp' => $timestamp->toIso8601String(),
            ], [
                'stage' => 'Department Head Review',
                'status' => 'pending',
                'timestamp' => null,
            ]]),
        ]);

        $this->logActivity('purchase_request_resubmitted', $purchaseRequest, $request);
        $this->notifyWorkflowParticipants($purchaseRequest->fresh(), 'resubmitted', 'Request Resubmitted');

        return response()->json([
            'data' => $this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request),
            'workflow' => $this->workflowSummary($purchaseRequest->fresh()),
        ]);
    }

    public function requestRevision(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->authorize('requestRevision', $purchaseRequest);
        $timestamp = now();
        $purchaseRequest->update([
            'status' => 'revision_requested',
            'rejection_reason' => $validated['reason'],
            'timeline' => array_merge($purchaseRequest->timeline ?? [], [[
                'stage' => $this->stageLabel($purchaseRequest->current_stage, $purchaseRequest),
                'status' => 'revision_requested',
                'performed_by' => $request->user()?->id,
                'notes' => $validated['reason'],
                'timestamp' => $timestamp->toIso8601String(),
            ]]),
        ]);

        $this->logActivity('purchase_request_revision_requested', $purchaseRequest, $request, ['reason' => $validated['reason']]);
        $this->notifyWorkflowParticipants($purchaseRequest->fresh(), 'revision_requested', 'Revision Requested', $validated['reason']);

        return response()->json($this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request));
    }

    public function destroy(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $purchaseRequest->update(['status' => 'cancelled']);
        $this->logActivity('purchase_request_cancelled', $purchaseRequest, $request);

        return response()->json(['message' => 'Purchase request cancelled.']);
    }

    public function updateWalkInDetails(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        // Same audience as verifyWalkInApproval / uploadWalkInApprovalDocument:
        // staff who process the release queue can correct the details of a
        // walk-in request they (or a colleague) entered.
        $this->authorize('verifyWalkInApproval', $purchaseRequest);

        if (! $purchaseRequest->is_walk_in) {
            return response()->json(['message' => 'Only walk-in requests can be edited here.'], 400);
        }

        if ($purchaseRequest->status === 'released') {
            return response()->json(['message' => 'Released requests cannot be edited.'], 400);
        }

        $requestType = $purchaseRequest->request_type ?? 'request';

        $validated = $request->validate([
            'department_id' => ['nullable', 'exists:departments,id'],
            'walk_in_requester_name' => ['nullable', 'string', 'max:255'],
            'walk_in_requester_contact' => ['nullable', 'string', 'max:255'],
            'branch' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'in:low,normal,urgent,critical'],
            'date_needed' => ['nullable', 'date'],
            'purpose' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
            'walk_in_notes' => ['nullable', 'string'],
            'line_items' => ['nullable', 'array'],
            'line_items.*.type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_type' => ['nullable', 'in:asset,supply,new'],
            'line_items.*.source_id' => ['nullable', 'integer'],
            'line_items.*.source_ref' => ['nullable', 'string'],
            'line_items.*.qty' => ['nullable', 'integer', 'min:1'],
            'line_items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'line_items.*.unit' => ['nullable', 'string'],
            'line_items.*.item' => ['nullable', 'string'],
            'line_items.*.particular' => ['nullable', 'string'],
            'line_items.*.description' => ['nullable', 'string'],
            'line_items.*.remarks' => ['nullable', 'string'],
            'line_items.*.unit_price' => ['nullable', 'numeric'],
            'line_items.*.unitPrice' => ['nullable', 'numeric'],
            'line_items.*.estimated_cost' => ['nullable', 'numeric'],
            'line_items.*.amount' => ['nullable', 'numeric'],
        ]);

        $update = collect($validated)->except(['department_id', 'line_items'])->all();

        if (array_key_exists('department_id', $validated)) {
            $update['department_id'] = $validated['department_id'];
            $update['department_name'] = optional(Department::find($validated['department_id']))->name;
        }

        if (! empty($validated['line_items'])) {
            $normalizedItems = $requestType === 'request'
                ? $this->resolveUniversalRequestItems($validated['line_items'], $request)
                : $this->normalizePurchaseOrderItems($validated['line_items']);

            if (empty($normalizedItems)) {
                return response()->json(['message' => 'At least one valid item is required.'], 422);
            }

            $update['line_items'] = $normalizedItems;
            $update['total_amount'] = $this->totalForLineItems($normalizedItems);
        }

        if (array_key_exists('total_amount', $validated) && $requestType === 'purchase_order') {
            $update['total_amount'] = $validated['total_amount'];
        }

        if (! $purchaseRequest->requested_by && array_key_exists('walk_in_requester_name', $validated)) {
            $update['requested_by_name'] = $validated['walk_in_requester_name'];
        }

        if (array_key_exists('walk_in_requester_name', $validated) && empty($validated['walk_in_requester_name'])) {
            $update['walk_in_requester_name'] = null;
        }

        $purchaseRequest->update($update);
        $this->logActivity('walk_in_request_details_updated', $purchaseRequest, $request);

        return response()->json($this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request));
    }

    public function uploadWalkInApprovalDocument(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        // Reuses the verifyWalkInApproval policy check: whoever is allowed to
        // verify a walk-in approval is also allowed to attach/replace the
        // document that verification depends on.
        $this->authorize('verifyWalkInApproval', $purchaseRequest);

        if (! $purchaseRequest->is_walk_in || $purchaseRequest->approval_status === 'not_required') {
            return response()->json(['message' => 'This request does not require a walk-in approval document.'], 400);
        }

        if ($purchaseRequest->status === 'released') {
            return response()->json(['message' => 'Released requests cannot be updated.'], 400);
        }

        $validated = $request->validate([
            'approval_document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $previousPath = $purchaseRequest->approval_document_path;

        $newPath = $request->file('approval_document')->store('walk-in-approval-documents', 'public');

        $purchaseRequest->update([
            'approval_document_path' => $newPath,
            // Attaching a document (re)starts the verification step, so make
            // sure the request is sitting in "needs verification" rather
            // than stuck at whatever state it was left in.
            'approval_status' => 'pending_verification',
        ]);

        if ($previousPath) {
            Storage::disk('public')->delete($previousPath);
        }

        $this->logActivity('walk_in_approval_document_uploaded', $purchaseRequest, $request);

        return response()->json($this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request));
    }

    public function verifyWalkInApproval(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('verifyWalkInApproval', $purchaseRequest);

        $validated = $request->validate([
            'decision' => ['required', 'in:verified,rejected'],
            'verification_notes' => ['nullable', 'string'],
        ]);

        if (! $purchaseRequest->is_walk_in || $purchaseRequest->approval_status === 'not_required') {
            return response()->json(['message' => 'This request does not require walk-in approval document verification.'], 400);
        }

        // Only block the "verified" decision on a missing document — staff
        // can still reject a walk-in that never had a form attached.
        if ($validated['decision'] === 'verified' && empty($purchaseRequest->approval_document_path)) {
            return response()->json(['message' => 'An uploaded approved request form is required before verification.'], 422);
        }

        if ($purchaseRequest->status === 'released') {
            return response()->json(['message' => 'Released requests cannot be re-verified.'], 400);
        }

        $decision = $validated['decision'];
        $status = $decision === 'verified' ? 'verified' : 'needs_verification';
        $timelineStatus = $decision === 'verified' ? 'verified' : 'rejected';

        $purchaseRequest->update([
            'approval_status' => $status,
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
            'verification_notes' => $validated['verification_notes'] ?? null,
            'timeline' => array_merge($purchaseRequest->timeline ?? [], [[
                'stage' => 'Walk-in Approval Document Verification',
                'status' => $timelineStatus,
                'performed_by' => $request->user()?->id,
                'notes' => $validated['verification_notes'] ?? null,
                'timestamp' => now()->toIso8601String(),
            ]]),
        ]);

        $this->logActivity('purchase_request_walk_in_approval_' . $timelineStatus, $purchaseRequest->fresh(), $request, [
            'approval_status' => $status,
            'verified_by' => $request->user()?->id,
        ]);

        return response()->json([
            'data' => $this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request),
            'message' => $decision === 'verified'
                ? 'Approved form verified. Request can proceed to final release.'
                : 'Approved form marked as needing verification. Inventory release remains blocked.',
        ]);
    }

    /**
     * Advance purchase request to next stage (staged approval workflow)
     */
    public function advance(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->status === 'cancelled') {
            return response()->json(['message' => 'Cannot advance a cancelled request.'], 400);
        }

        $stages = $this->workflowStages($purchaseRequest);
        $currentStageIndex = array_search($purchaseRequest->current_stage, $stages);
        
        if ($currentStageIndex === false || $currentStageIndex === count($stages) - 1) {
            return response()->json(['message' => 'Purchase request is already at final stage.'], 400);
        }

        $this->authorize('advance', $purchaseRequest);

        $userRole = $request->user()?->role ?? '';
        if (!$this->canApproveAtStage($purchaseRequest->current_stage, $userRole)) {
            return response()->json(['message' => 'User does not have permission to approve at this stage.'], 403);
        }

        if ($userRole === 'Department Head' && !$this->sameDepartment($request, $purchaseRequest->department_id)) {
            return response()->json(['message' => 'Department Head approvals are limited to their own department.'], 403);
        }

        $nextStage = $stages[$currentStageIndex + 1];
        $fromStage = $purchaseRequest->current_stage;
        $timestamp = now();
        $timeline = $this->upsertTimelineStage($purchaseRequest->timeline ?? [], $this->stageLabel($fromStage, $purchaseRequest), [
            'status' => 'approved',
            'performed_by' => $request->user()?->id,
            'timestamp' => $timestamp->toIso8601String(),
        ]);
        $timeline = $this->upsertTimelineStage($timeline, $this->stageLabel($nextStage, $purchaseRequest), [
            'status' => 'pending',
            'timestamp' => null,
        ]);
        $purchaseRequest->update([
            'current_stage' => $nextStage,
            'status' => in_array($nextStage, ['property_custodian', 'ppmo_staff'], true) ? 'approved' : 'pending',
            'timeline' => $timeline,
        ]);

        $this->logActivity('purchase_request_advanced', $purchaseRequest, $request, ['from_stage' => $fromStage, 'to_stage' => $nextStage]);

        $purchaseRequest = $purchaseRequest->fresh()->load('department', 'requester');

        if (Schema::hasTable('transfer_notifications')) {
            $nextApprover = $this->getUserForStage($nextStage, $purchaseRequest);
            $stageLabel = match ($nextStage) {
                'department_head' => 'Department Head',
                'recommending_approver' => 'Recommending Approver',
                'president' => 'CEO Approval Required',
                'property_custodian' => $purchaseRequest->request_type === 'request' ? 'OIC Approval Required' : 'Request Ready for Processing',
                'ppmo_staff' => 'Request Ready for Release',
                default => 'Request Update',
            };

            if ($nextApprover) {
                DB::table('transfer_notifications')->insert([
                    'transfer_id' => null,
                    'recipient_id' => $nextApprover->id,
                    'recipient_role' => $nextApprover->role,
                    'type' => 'request_advanced',
                    'title' => $stageLabel,
                    'message' => "Purchase request {$purchaseRequest->request_number} from {$purchaseRequest->department_name} is waiting for your review.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $statusMessage = match ($fromStage) {
                'department_head' => "Department Head approved request {$purchaseRequest->request_number}.",
                'recommending_approver' => "Recommending Approver advanced request {$purchaseRequest->request_number}.",
                'president' => "CEO/President approved request {$purchaseRequest->request_number}.",
                'property_custodian' => $purchaseRequest->request_type === 'request' ? "OIC approved request {$purchaseRequest->request_number}." : "Property Custodian processed request {$purchaseRequest->request_number}.",
                'ppmo_staff' => "PPMO Staff is processing request {$purchaseRequest->request_number}.",
                default => "Request {$purchaseRequest->request_number} has advanced.",
            };

            if ($purchaseRequest->requested_by) {
                DB::table('transfer_notifications')->insert([
                    'transfer_id' => null,
                    'recipient_id' => $purchaseRequest->requested_by,
                    'recipient_role' => 'Requester',
                    'type' => 'request_status_update',
                    'title' => 'Request Updated',
                    'message' => $statusMessage,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return response()->json([
            'data' => $purchaseRequest,
            'workflow' => $this->workflowSummary($purchaseRequest),
            'message' => $purchaseRequest->status === 'approved'
                ? 'Purchase request fully approved.'
                : 'Purchase request routed to next approver.',
        ]);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->authorize('reject', $purchaseRequest);

        $userRole = $request->user()?->role ?? '';

        if (!$this->canApproveAtStage($purchaseRequest->current_stage, $userRole)) {
            return response()->json(['message' => 'User does not have permission to reject at this stage.'], 403);
        }

        if ($userRole === 'Department Head' && !$this->sameDepartment($request, $purchaseRequest->department_id)) {
            return response()->json(['message' => 'Department Head approvals are limited to their own department.'], 403);
        }

        $purchaseRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'] ?? null,
            'timeline' => $this->upsertTimelineStage($purchaseRequest->timeline ?? [], $this->stageLabel($purchaseRequest->current_stage, $purchaseRequest), [
                'status' => 'rejected',
                'performed_by' => $request->user()?->id,
                'notes' => $validated['reason'] ?? null,
                'timestamp' => now()->toIso8601String(),
            ]),
        ]);

        $this->logActivity('purchase_request_rejected', $purchaseRequest, $request);

        if (Schema::hasTable('transfer_notifications')) {
            $rows = $purchaseRequest->requested_by ? [[
                    'transfer_id' => null,
                    'recipient_id' => $purchaseRequest->requested_by,
                    'recipient_role' => 'Requester',
                    'type' => 'request_rejected',
                    'title' => 'Request rejected',
                    'message' => "Your request {$purchaseRequest->request_number} was rejected. Reason: " . ($validated['reason'] ?? 'No reason provided'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]] : [];

            if ($purchaseRequest->current_stage !== 'department_head') {
                $departmentHead = $this->getDepartmentHeadForRequest($purchaseRequest);
                if ($departmentHead) {
                    $rows[] = [
                        'transfer_id' => null,
                        'recipient_id' => $departmentHead->id,
                        'recipient_role' => $departmentHead->role,
                        'type' => 'request_rejected',
                        'title' => 'Request rejected',
                        'message' => "Purchase request {$purchaseRequest->request_number} from {$purchaseRequest->department_name} was rejected.",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            DB::table('transfer_notifications')->insert($rows);
        }

        return response()->json($this->responsePurchaseRequest($purchaseRequest->fresh()->load('department', 'requester'), $request));
    }

    public function release(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('release', $purchaseRequest);

        if ($purchaseRequest->request_type === 'request' && $purchaseRequest->workflow_destination === 'purchase_workflow') {
            return response()->json(['message' => 'Insufficient stock. Procurement is required before this request can be released.'], 422);
        }

        $requiredReleaseStage = $this->isInventoryRequestWorkflow($purchaseRequest) ? 'ppmo_staff' : 'property_custodian';
        if ($purchaseRequest->current_stage !== $requiredReleaseStage || $purchaseRequest->status !== 'approved') {
            return response()->json(['message' => 'Only approved requests in the processing/release stage can be released.'], 422);
        }

        // Allow release when request is approved, or when Property Custodian is performing release
        $userRole = $request->user()?->role ?? '';
        $canRelease = fn (PurchaseRequest $lockedRequest) => (
            $lockedRequest->status === 'approved'
            || ($lockedRequest->current_stage === ($this->isInventoryRequestWorkflow($lockedRequest) ? 'ppmo_staff' : 'property_custodian') && in_array($userRole, ['PPMO Staff', 'Property Custodian', 'OIC'], true))
        );

        if (! $canRelease($purchaseRequest)) {
            return response()->json(['message' => 'Only approved requests or Property Custodian can perform release.'], 400);
        }

        if ($purchaseRequest->is_walk_in && $purchaseRequest->approval_status === 'pending_verification') {
            return response()->json(['message' => 'Uploaded walk-in approval form must be manually verified before final release.'], 422);
        }

        if ($purchaseRequest->is_walk_in && $purchaseRequest->approval_status === 'needs_verification') {
            return response()->json(['message' => 'Walk-in approval form needs verification before final release.'], 422);
        }

        $quantityAnomalyIds = [];

        $releasedRequest = DB::transaction(function () use ($purchaseRequest, $request, $canRelease, &$quantityAnomalyIds) {
            $lockedRequest = PurchaseRequest::query()
                ->whereKey($purchaseRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $canRelease($lockedRequest)) {
                throw ValidationException::withMessages([
                    'request' => 'This request has already been released or is no longer eligible for release.',
                ]);
            }

            if ($lockedRequest->is_walk_in && in_array($lockedRequest->approval_status, ['pending_verification', 'needs_verification'], true)) {
                throw ValidationException::withMessages([
                    'request' => 'Uploaded walk-in approval form must be manually verified before final release.',
                ]);
            }

            foreach ($lockedRequest->line_items ?? [] as $lineItem) {
                $anomalyId = $this->applyReleasedLineItem($lockedRequest, $lineItem, $request);

                if ($anomalyId) {
                    $quantityAnomalyIds[] = $anomalyId;
                }
            }

            $releasedAt = now();
            $receiptNumber = $this->generateReceiptNumber($releasedAt);

            $lockedRequest->update([
                'status' => 'released',
                'current_stage' => 'released',
                'released_by' => $request->user()?->id,
                'released_at' => $releasedAt,
                'receipt_number' => $receiptNumber,
                'timeline' => $this->upsertTimelineStage($lockedRequest->timeline ?? [], 'Released', [
                    'status' => 'released',
                    'performed_by' => $request->user()?->id,
                    'timestamp' => $releasedAt->toIso8601String(),
                ]),
            ]);

            $receiptPath = $this->generateReleaseReceiptDocument($lockedRequest->fresh()->load('department', 'requester'), $receiptNumber, $request);

            $lockedRequest->update([
                'receipt_document_path' => $receiptPath,
                'receipt_generated_at' => now(),
            ]);

            $this->logActivity('purchase_request_released', $lockedRequest, $request);

            if (Schema::hasTable('transfer_notifications') && $lockedRequest->requested_by) {
                DB::table('transfer_notifications')->insert([
                    'transfer_id' => null,
                    'recipient_id' => $lockedRequest->requested_by,
                    'recipient_role' => 'Requester',
                    'type' => 'request_released',
                    'title' => 'Item Released',
                    'message' => "Your requested item from {$lockedRequest->request_number} has been released.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $lockedRequest->fresh()->load('department', 'requester');
        });

        foreach (array_unique($quantityAnomalyIds) as $anomalyId) {
            app(LlmAnomalyExplanationService::class)->generateForAnomalyId($anomalyId);
        }

        return response()->json([
            'data' => $releasedRequest,
            'workflow' => [
                'status' => 'released',
                'message' => 'Purchase request released and inventory updates applied where applicable.',
            ],
        ]);
    }

    public function supplyRelease(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('release', $purchaseRequest);

        $validated = $request->validate([
            'supply_id' => ['required', 'integer', 'exists:supplies,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $releasedRequest = DB::transaction(function () use ($purchaseRequest, $request, $validated) {
            $lockedRequest = PurchaseRequest::query()->whereKey($purchaseRequest->id)->lockForUpdate()->firstOrFail();
            $requiredStage = $this->isInventoryRequestWorkflow($lockedRequest) ? 'ppmo_staff' : 'property_custodian';
            if ($lockedRequest->current_stage !== $requiredStage || ! in_array($lockedRequest->status, ['approved', 'partially_released'], true)) {
                throw ValidationException::withMessages(['request' => 'Only approved requests with remaining quantity can be released.']);
            }

            $items = collect($lockedRequest->line_items ?? []);
            $lineIndex = $items->search(fn ($item) => ($item['source_type'] ?? $item['type'] ?? null) === 'supply'
                && (string) ($item['source_id'] ?? '') === (string) $validated['supply_id']);
            if ($lineIndex === false) {
                throw ValidationException::withMessages(['supply_id' => 'This request does not contain the selected supply.']);
            }

            $lineItem = $items->get($lineIndex);
            $approvedQuantity = (int) ($lineItem['approved_qty'] ?? $lineItem['approved_quantity'] ?? $lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
            $releasedQuantity = (int) ($lineItem['released_qty'] ?? 0);
            $remainingQuantity = max(0, $approvedQuantity - $releasedQuantity);
            if ($validated['quantity'] > $remainingQuantity) {
                throw ValidationException::withMessages(['quantity' => "Only {$remainingQuantity} unit(s) remain approved for release."]);
            }

            $supply = Supply::query()->whereKey($validated['supply_id'])->lockForUpdate()->firstOrFail();
            if ((int) $supply->stock < $validated['quantity']) {
                throw ValidationException::withMessages(['quantity' => "Insufficient stock. Only {$supply->stock} unit(s) available."]);
            }

            $newReleasedQuantity = $releasedQuantity + (int) $validated['quantity'];
            $lineItem['approved_qty'] = $approvedQuantity;
            $lineItem['released_qty'] = $newReleasedQuantity;
            $lineItem['remaining_qty'] = max(0, $approvedQuantity - $newReleasedQuantity);
            $items->put($lineIndex, $lineItem);

            $movement = StockMovement::create([
                'supply_id' => $supply->id,
                'movement_type' => 'out',
                'quantity' => $validated['quantity'],
                'department_id' => $lockedRequest->department_id,
                'requested_by' => $lockedRequest->requested_by,
                'issued_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?: "Released through {$lockedRequest->request_number}.",
            ]);
            $supply->update(['stock' => (int) $supply->stock - (int) $validated['quantity']]);

            $allSupplyLinesReleased = $items->filter(fn ($item) => ($item['source_type'] ?? $item['type'] ?? null) === 'supply')
                ->every(fn ($item) => (int) ($item['remaining_qty'] ?? ((int) ($item['approved_qty'] ?? $item['qty'] ?? $item['quantity'] ?? 0) - (int) ($item['released_qty'] ?? 0))) === 0);
            $lockedRequest->update([
                'line_items' => $items->values()->all(),
                'status' => $allSupplyLinesReleased ? 'released' : 'partially_released',
                'current_stage' => $allSupplyLinesReleased ? 'released' : 'property_custodian',
                'released_by' => $allSupplyLinesReleased ? $request->user()?->id : $lockedRequest->released_by,
                'released_at' => $allSupplyLinesReleased ? now() : $lockedRequest->released_at,
                'timeline' => array_merge($lockedRequest->timeline ?? [], [[
                    'stage' => $allSupplyLinesReleased ? 'Released' : 'Partial Release',
                    'status' => $allSupplyLinesReleased ? 'released' : 'partially_released',
                    'performed_by' => $request->user()?->id,
                    'timestamp' => now()->toIso8601String(),
                    'quantity' => (int) $validated['quantity'],
                    'movement_id' => $movement->id,
                ]]),
            ]);

            $this->logActivity('supply_request_partially_released', $lockedRequest, $request);
            return $lockedRequest->fresh()->load('department', 'requester');
        });

        return response()->json([
            'data' => $this->responsePurchaseRequest($releasedRequest, $request),
            'message' => 'Supply release recorded and inventory updated.',
        ]);
    }

    /**
     * Return (and, if missing, generate) the release receipt for an already-released request.
     * Useful for reprints and for legacy released requests created before receipts existed.
     */
    public function receipt(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->status !== 'released') {
            return response()->json(['message' => 'This request has not been released yet.'], 422);
        }

        // Re-render on access so legacy receipts uploaded without an HTML
        // content type are repaired without changing the receipt number.
        $receiptNumber = $purchaseRequest->receipt_number ?? $this->generateReceiptNumber($purchaseRequest->released_at ?? now());
        $receiptPath = $this->generateReleaseReceiptDocument($purchaseRequest->load('department', 'requester'), $receiptNumber, $request);

        $purchaseRequest->update([
            'receipt_number' => $receiptNumber,
            'receipt_document_path' => $receiptPath,
            'receipt_generated_at' => now(),
        ]);

        return response()->json([
            'data' => $purchaseRequest->fresh()->load('department', 'requester'),
        ]);
    }

    public function receiptDocument(PurchaseRequest $purchaseRequest)
    {
        if ($purchaseRequest->status !== 'released' || ! $purchaseRequest->receipt_document_path) {
            return response('Receipt not found.', 404);
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($purchaseRequest->receipt_document_path)) {
            return response('Receipt not found.', 404);
        }

        return response($disk->get($purchaseRequest->receipt_document_path), 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * Get pending approvals for current user
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        $userRole = $request->user()?->role ?? '';
        
        // Filter by the stage that matches the user's role
        $stageFilter = $this->getStageForRole($userRole);

        if (!$stageFilter) {
            return response()->json(['data' => []]);
        }

        $requests = PurchaseRequest::query()
            ->where('current_stage', $stageFilter)
            ->where('status', 'pending')
            ->when($userRole === 'Department Head', function ($query) use ($request) {
                $departmentId = $this->departmentIdForUser($request->user());
                $query->where('department_id', $departmentId)
                    ->whereHas('requester', function ($query) use ($request) {
                        $query->where('department', $request->user()?->department);
                    });
            })
            ->with('department', 'requester')
            ->orderBy('created_at', 'asc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($requests);
    }

    /**
     * Role-specific dashboard for Recommending Approver
     */
    public function recommendingDashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        // ensure role
        if ($user?->role !== 'Recommending Approver') {
            return response()->json(['message' => 'This action is unauthorized.'], 403);
        }

        $baseQuery = PurchaseRequest::query()->where('current_stage', 'recommending_approver');

        $pending = (clone $baseQuery)->where('status', 'pending')->count();
        $approved = (clone $baseQuery)->where('status', 'approved')->count();
        $rejected = (clone $baseQuery)->where('status', 'rejected')->count();
        $infoRequired = (clone $baseQuery)->where('status', 'information_required')->count();
        $conditional = (clone $baseQuery)->where('status', 'conditionally_approved')->count();
        $validationIssues = 0;
        if (Schema::hasColumn('purchase_requests', 'validation_status')) {
            $validationIssues = PurchaseRequest::query()->whereIn('validation_status', ['failed', 'requires_attention'])->count();
        }

        // load a small actionable queue for the user (server-side filtering by stage)
        $queue = (clone $baseQuery)
            ->with('department', 'requester')
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->limit(200)
            ->get();

        return response()->json([
            'stats' => [
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'information_required' => $infoRequired,
                'conditional_approvals' => $conditional,
                'validation_issues' => $validationIssues,
            ],
            'queue' => $queue,
        ]);
    }

    public function recommendingHistory(Request $request): JsonResponse
    {
        $userId = (string) $request->user()?->id;
        $history = PurchaseRequest::query()
            ->with('department', 'requester')
            ->latest('updated_at')
            ->limit(500)
            ->get()
            ->filter(function (PurchaseRequest $purchaseRequest) use ($userId) {
                return collect($purchaseRequest->timeline ?? [])->contains(function ($entry) use ($userId) {
                    return ($entry['stage'] ?? null) === 'Recommending Approver'
                        && (string) ($entry['performed_by'] ?? '') === $userId
                        && in_array($entry['status'] ?? null, ['approved', 'rejected', 'revision_requested'], true);
                });
            })
            ->values()
            ->map(function (PurchaseRequest $purchaseRequest) use ($request) {
                $purchaseRequest->setAttribute('workflow', $this->workflowSummary($purchaseRequest));
                return $this->responsePurchaseRequest($purchaseRequest, $request);
            });

        return response()->json(['data' => $history]);
    }

    protected function canApproveAtStage(string $stage, string $role): bool
    {
        $stageRoleMap = [
            'employee' => ['Requester', 'Department Requester'],
            'department_head' => ['Department Head'],
            'recommending_approver' => ['Recommending Approver'],
            'property_custodian' => ['Property Custodian', 'OIC'],
            'president' => ['President', 'CEO'],
        ];

        return isset($stageRoleMap[$stage]) && in_array($role, $stageRoleMap[$stage]);
    }

    protected function getStageForRole(string $role): ?string
    {
        $roleStageMap = [
            'Department Head' => 'department_head',
            'Recommending Approver' => 'recommending_approver',
            'Property Custodian' => 'property_custodian',
            'OIC' => 'property_custodian',
            'PPMO Staff' => 'ppmo_staff',
            'President' => 'president',
            'CEO' => 'president',
        ];

        return $roleStageMap[$role] ?? null;
    }

    protected function workflowStages(PurchaseRequest $purchaseRequest): array
    {
        return $this->workflowStagesForValues($purchaseRequest->request_type, $purchaseRequest->workflow_destination);
    }

    protected function isInventoryRequestWorkflow(PurchaseRequest $purchaseRequest): bool
    {
        return $this->workflowStages($purchaseRequest) === self::INVENTORY_REQUEST_STAGES;
    }

    protected function workflowStagesForValues(?string $requestType, ?string $workflowDestination): array
    {
        return $requestType === 'request' && in_array($workflowDestination, ['asset_assignment', 'supplies_inventory_release'], true)
            ? self::INVENTORY_REQUEST_STAGES
            : self::PURCHASE_STAGES;
    }

    protected function generateRequestNumber(string $requestType = 'purchase_order'): string
    {
        $sequence = PurchaseRequest::count() + 1;
        $prefix = $requestType === 'request' ? 'REQ' : 'PR';
        return sprintf('%s-%s-%06d', $prefix, now()->format('Y'), $sequence);
    }

    protected function generateReceiptNumber($releasedAt): string
    {
        $sequence = PurchaseRequest::whereNotNull('receipt_number')->count() + 1;
        return sprintf('RR-%s-%06d', $releasedAt->format('Y'), $sequence);
    }

    /**
     * Render and store a printable release receipt document for a released request.
     * Layout mirrors the physical "Request Form" slip (Qty / Item / Sign Receive,
     * Purpose, Requested By, Approved By, Released By) so the printed output matches
     * what staff already use on paper.
     */
    protected function generateReleaseReceiptDocument(PurchaseRequest $purchaseRequest, string $receiptNumber, Request $request): string
    {
        $items = collect($purchaseRequest->line_items ?? [])
            ->map(fn ($line) => sprintf(
                '<tr><td>%s</td><td class="text-center">%s</td><td class="sign-cell"></td></tr>',
                e($line['item'] ?? $line['particular'] ?? $line['name'] ?? $line['description'] ?? 'Item'),
                e($line['qty'] ?? $line['quantity'] ?? 1)
            ))
            ->implode('');

        // Pad out to at least 6 rows so the printed slip has the same blank-row
        // look as the paper form, even for short requests.
        $rowCount = $purchaseRequest->line_items ? count($purchaseRequest->line_items) : 0;
        for ($i = $rowCount; $i < 6; $i++) {
            $items .= '<tr><td>&nbsp;</td><td class="text-center">&nbsp;</td><td class="sign-cell"></td></tr>';
        }

        $releasedByName = $request->user()?->name ?? $request->user()?->email ?? 'PPMO Staff';
        $requesterName = $purchaseRequest->requester?->name ?? $purchaseRequest->requester?->email ?? $purchaseRequest->requested_by_name ?? '-';
        $departmentName = $purchaseRequest->department?->name ?? $purchaseRequest->department_name ?? '-';
        $branch = $purchaseRequest->branch ?? '-';
        $purpose = $purchaseRequest->purpose ?? '-';
        $dateReleased = $purchaseRequest->released_at?->format('F j, Y') ?? now()->format('F j, Y');

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Request Form {$receiptNumber}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; max-width: 720px; margin: 0 auto; }
  .form-header { background: #1a1a1a; color: #fff; text-align: center; padding: 10px; font-weight: bold; letter-spacing: 1px; }
  .top-row { display: flex; justify-content: space-between; margin: 16px 0; font-size: 13px; }
  .top-row div { flex: 1; }
  .top-row .field-line { border-bottom: 1px solid #333; display: inline-block; min-width: 160px; margin-left: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #333; padding: 8px; font-size: 13px; }
  th { background: #f0f0f0; text-align: left; }
  .text-center { text-align: center; }
  .sign-cell { min-width: 140px; }
  .purpose-block { margin: 16px 0; font-size: 13px; }
  .purpose-line { border-bottom: 1px solid #333; display: block; min-height: 22px; }
  .signoff { margin-top: 32px; font-size: 13px; }
  .signoff-row { display: flex; justify-content: space-between; margin-top: 28px; }
  .signoff-block { width: 47%; }
  .signoff-block .name-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; text-align: center; font-weight: bold; }
  .signoff-block .role-line { text-align: center; font-size: 11px; color: #444; }
  .print-bar { text-align: right; margin-bottom: 16px; }
  .print-bar button { background: #1a1a1a; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .print-bar button:hover { background: #333; }
  @media print {
    .print-bar { display: none; }
    body { padding: 0; max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="print-bar"><button onclick="window.print()">🖨 Print</button></div>

  <div class="form-header">REQUEST FORM — {$receiptNumber}</div>

  <div class="top-row">
    <div>Department: <span class="field-line">{$departmentName}</span></div>
    <div>Branch: <span class="field-line">{$branch}</span></div>
  </div>
  <div class="top-row">
    <div>Request No.: <span class="field-line">{$purchaseRequest->request_number}</span></div>
    <div>Date: <span class="field-line">{$dateReleased}</span></div>
  </div>

  <table>
    <thead><tr><th>Item</th><th class="text-center">Qty</th><th>Sign Receive</th></tr></thead>
    <tbody>{$items}</tbody>
  </table>

  <div class="purpose-block">
    Purpose: <span class="purpose-line">{$purpose}</span>
  </div>

  <div class="signoff">
    <div class="signoff-row">
      <div class="signoff-block">
        <div class="name-line">{$requesterName}</div>
        <div class="role-line">Requested By (Full Name / Signature)</div>
      </div>
      <div class="signoff-block">
        <div class="name-line">&nbsp;</div>
        <div class="role-line">Recommending Approval</div>
      </div>
    </div>
    <div class="signoff-row">
      <div class="signoff-block">
        <div class="name-line">&nbsp;</div>
        <div class="role-line">Approved By</div>
      </div>
      <div class="signoff-block">
        <div class="name-line">{$releasedByName}</div>
        <div class="role-line">Released By (PPMO Staff)</div>
      </div>
    </div>
  </div>

  <script>
    if (new URLSearchParams(window.location.search).get('print') === '1') {
      window.addEventListener('load', () => window.print());
    }
  </script>
</body>
</html>
HTML;

        $filename = "release-receipts/receipt-{$purchaseRequest->id}.html";
        Storage::disk('public')->put($filename, $html, [
            'ContentType' => 'text/html; charset=UTF-8',
            'CacheControl' => 'no-cache, no-store, must-revalidate',
        ]);

        return $filename;
    }

    protected function generateAssetPropertyNumber(): string
    {
        $sequence = \App\Models\Asset::withTrashed()->count() + 1;
        return sprintf('BCP-PPMO-%s-%06d', now()->format('Y'), $sequence);
    }

    protected function resolveUniversalRequestItems(array $items, Request $request): array
    {
        return collect($items)
            ->map(function (array $lineItem) use ($request) {
                $qty = (int) ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
                $name = trim((string) ($lineItem['item'] ?? $lineItem['particular'] ?? $lineItem['description'] ?? ''));

                if ($qty <= 0 || $name === '') {
                    return null;
                }

                [$sourceType, $sourceId] = $this->decodeCatalogReference(
                    $lineItem['source_ref'] ?? null,
                    $lineItem['source_type'] ?? $lineItem['type'] ?? null,
                    $lineItem['source_id'] ?? null,
                );
                $catalog = $this->resolveCatalogItem($sourceType, $sourceId, $name);
                $manualUnitCost = (float) ($lineItem['unit_price'] ?? $lineItem['unitPrice'] ?? $lineItem['estimated_cost'] ?? 0);
                $unitCost = $catalog
                    ? (float) ($catalog['unit_cost'] ?? $catalog['unit_price'] ?? 0)
                    : $manualUnitCost;
                $available = (int) ($catalog['available_quantity'] ?? $catalog['current_stock'] ?? 0);
                $destination = $this->destinationForLine($catalog['item_type'] ?? 'new', $available, $qty);

                if ($catalog && $this->hasDuplicatePendingLine($request->user()?->id, $catalog['item_type'], $catalog['source_id'])) {
                    throw ValidationException::withMessages([
                        'line_items' => "{$catalog['name']} already has a pending request.",
                    ]);
                }

                return [
                    'qty' => $qty,
                    'quantity' => $qty,
                    'unit' => $lineItem['unit'] ?? null,
                    'item' => $catalog['name'] ?? $name,
                    'particular' => $catalog['name'] ?? $name,
                    'description' => $lineItem['description'] ?? ($catalog['description'] ?? null),
                    'remarks' => $lineItem['remarks'] ?? null,
                    'type' => $catalog['item_type'] ?? 'new',
                    'source_type' => $catalog['item_type'] ?? 'new',
                    'source_id' => $catalog['source_id'] ?? null,
                    'workflow_destination' => $destination,
                    'availability_status' => $catalog['status'] ?? 'New Item',
                    'unit_price' => $unitCost,
                    'unitPrice' => $unitCost,
                    'amount' => $qty * (float) $unitCost,
                    'estimated_cost' => $qty * (float) $unitCost,
                    'preferred_custodian' => $lineItem['preferred_custodian'] ?? null,
                    'expected_usage' => $lineItem['expected_usage'] ?? null,
                    'location' => $lineItem['location'] ?? null,
                    'expected_return_date' => $lineItem['expected_return_date'] ?? null,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * For 'purchase_order' type submissions we don't run the full catalog
     * resolution (items may be brand new / not yet in inventory), but we
     * still need to guarantee every saved line has a usable name and a
     * correctly computed amount, otherwise the UI has nothing to display
     * except generic "Item N" / PHP 0 placeholders.
     */
    protected function normalizePurchaseOrderItems(array $items): array
    {
        return collect($items)
            ->map(function (array $lineItem) {
                $qty = (int) ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
                $name = trim((string) ($lineItem['item'] ?? $lineItem['particular'] ?? $lineItem['description'] ?? ''));

                if ($qty <= 0 || $name === '') {
                    return null;
                }

                $unitCost = (float) ($lineItem['unit_price'] ?? $lineItem['unitPrice'] ?? $lineItem['estimated_cost'] ?? 0);
                $amount = (float) ($lineItem['amount'] ?? ($qty * $unitCost));

                return array_merge($lineItem, [
                    'qty' => $qty,
                    'quantity' => $qty,
                    'item' => $name,
                    'particular' => $name,
                    'unit_price' => $unitCost,
                    'unitPrice' => $unitCost,
                    'amount' => $amount,
                    'estimated_cost' => $lineItem['estimated_cost'] ?? $amount,
                ]);
            })
            ->filter()
            ->values()
            ->all();
    }

    protected function resolveCatalogItem(?string $sourceType, mixed $sourceId, string $name): ?array
    {
        if ($sourceType === 'supply' && $sourceId) {
            $supply = Supply::find($sourceId);
            return $supply ? $this->catalogRowForSupply($supply) : null;
        }

        if ($sourceType === 'asset' && $sourceId) {
            $asset = Asset::with('department', 'category')->find($sourceId);
            return $asset ? $this->catalogRowForAsset($asset) : null;
        }

        $supply = Supply::query()
            ->where('name', 'like', "%{$name}%")
            ->orWhere('sku', 'like', "%{$name}%")
            ->first();

        if ($supply) {
            return $this->catalogRowForSupply($supply);
        }

        $asset = Asset::with('department', 'category')
            ->where('name', 'like', "%{$name}%")
            ->orWhere('property_number', 'like', "%{$name}%")
            ->orWhere('serial_number', 'like', "%{$name}%")
            ->first();

        return $asset ? $this->catalogRowForAsset($asset) : null;
    }

    protected function catalogRowForSupply(Supply $supply): array
    {
        $stock = (int) ($supply->stock ?? 0);

        return [
            'source_id' => $supply->id,
            'item_type' => 'supply',
            'sku' => $supply->sku,
            'name' => $supply->name,
            'category' => $supply->category,
            'unit' => 'unit',
            'description' => $supply->description ?: $supply->category,
            'status' => $this->availabilityStatus($stock, (int) ($supply->minimum_stock ?? 0)),
            'current_stock' => $stock,
            'minimum_stock' => (int) ($supply->minimum_stock ?? 0),
            'available_quantity' => $stock,
            'available_stock' => $stock,
            'assigned_quantity' => 0,
            'reserved_quantity' => 0,
            'warehouse' => 'Supplies Inventory',
            'current_department' => null,
            'current_custodian' => null,
            'condition' => null,
            'warranty' => null,
            'unit_cost' => (float) ($supply->unit_price ?? 0),
            'unit_price' => (float) ($supply->unit_price ?? 0),
            'workflow_destination' => $stock > 0 ? 'supplies_inventory_release' : 'purchase_workflow',
        ];
    }

    protected function catalogRowForAsset(Asset $asset): array
    {
        $assigned = AssetAssignment::where('asset_id', $asset->id)
            ->whereIn('status', ['active', 'pending_acceptance'])
            ->sum('quantity');
        $available = max(0, (int) ($asset->available_quantity ?? ((int) ($asset->quantity ?? 1) - (int) $assigned)));

        return [
            'source_id' => $asset->id,
            'item_type' => 'asset',
            'name' => $asset->name,
            'category' => optional($asset->category)->name ?: 'Asset',
            'unit' => 'unit',
            'description' => $asset->description,
            'status' => $this->displayStatus($asset->status, $available),
            'current_stock' => (int) ($asset->quantity ?? 1),
            'available_quantity' => in_array($asset->status, ['maintenance', 'disposed', 'damaged'], true) ? 0 : $available,
            'assigned_quantity' => (int) $assigned,
            'reserved_quantity' => 0,
            'warehouse' => $asset->location,
            'current_department' => optional($asset->department)->name,
            'current_custodian' => $asset->custodian_id ?: $asset->current_holder_id,
            'condition' => $asset->condition,
            'warranty' => optional($asset->warranty_until)->toDateString(),
            'unit_cost' => (float) ($asset->purchase_cost ?? 0),
            'workflow_destination' => $available > 0 && ! in_array($asset->status, ['maintenance', 'disposed', 'damaged'], true) ? 'asset_assignment' : 'purchase_workflow',
        ];
    }

    protected function displayStatus(?string $status, int $available): string
    {
        return match ($status) {
            'maintenance' => 'Maintenance',
            'disposed' => 'Disposed',
            'damaged' => 'Unavailable',
            'assigned' => $available > 0 ? 'Available' : 'Out of Stock',
            default => $available > 0 ? 'Available' : 'Out of Stock',
        };
    }

    protected function availabilityStatus(int $available, int $minimumStock = 0): string
    {
        if ($available <= 0) {
            return 'Out of Stock';
        }

        if ($minimumStock > 0 && $available <= $minimumStock) {
            return 'Low Stock';
        }

        return 'Available';
    }

    protected function requesterCatalogRow(array $catalog): array
    {
        return [
            'id' => $catalog['source_id'],
            'source_ref' => Crypt::encryptString("{$catalog['item_type']}:{$catalog['source_id']}"),
            'item_type' => $catalog['item_type'],
            'name' => $catalog['name'],
            'sku' => $catalog['sku'] ?? null,
            'category' => $catalog['category'] ?? null,
            'unit' => $catalog['unit'] ?? 'unit',
            'description' => $catalog['description'] ?? null,
            'status' => $catalog['status'],
            'unit_price' => (float) ($catalog['unit_price'] ?? $catalog['unit_cost'] ?? 0),
            'unit_cost' => (float) ($catalog['unit_cost'] ?? $catalog['unit_price'] ?? 0),
            'estimated_cost' => (float) ($catalog['unit_cost'] ?? $catalog['unit_price'] ?? 0),
            'available_quantity' => (int) ($catalog['available_quantity'] ?? 0),
            'current_stock' => (int) ($catalog['current_stock'] ?? 0),
            'minimum_stock' => (int) ($catalog['minimum_stock'] ?? 0),
            'workflow_destination' => $catalog['workflow_destination'] ?? 'purchase_workflow',
        ];
    }

    protected function decodeCatalogReference(?string $sourceRef, ?string $sourceType, mixed $sourceId): array
    {
        if ($sourceRef) {
            try {
                [$type, $id] = explode(':', Crypt::decryptString($sourceRef), 2);
                if (in_array($type, ['asset', 'supply'], true) && ctype_digit((string) $id)) {
                    return [$type, (int) $id];
                }
            } catch (\Throwable) {
                throw ValidationException::withMessages(['line_items' => 'Selected item could not be verified. Please search and select the item again.']);
            }
        }

        return [$sourceType, $sourceId];
    }

    protected function catalogItemCanBeRequested(array $catalog, int $qty): bool
    {
        if ($catalog['item_type'] === 'supply') {
            return (int) ($catalog['available_quantity'] ?? 0) >= $qty;
        }

        if ($catalog['item_type'] === 'asset') {
            return ($catalog['workflow_destination'] ?? null) === 'asset_assignment'
                && (int) ($catalog['available_quantity'] ?? 0) >= $qty;
        }

        return true;
    }

    protected function catalogUnavailableMessage(array $catalog): string
    {
        if ($catalog['item_type'] === 'supply') {
            return "{$catalog['name']} is not currently available for release. Please submit a purchase order or choose another item.";
        }

        return "{$catalog['name']} is not currently requestable. Please choose another item or submit a purchase order.";
    }

    protected function responsePurchaseRequest(PurchaseRequest $purchaseRequest, Request $request)
    {
        $timeline = collect($purchaseRequest->timeline ?? [])->values();
        $performerIds = $timeline->pluck('performed_by')->filter()->unique()->values();
        $performers = $performerIds->isEmpty()
            ? collect()
            : User::query()->whereIn('id', $performerIds)->get()->keyBy('id');
        $purchaseRequest->setAttribute('timeline', $timeline->map(function ($entry) use ($performers) {
            if (! empty($entry['performed_by']) && isset($performers[$entry['performed_by']])) {
                $performer = $performers[$entry['performed_by']];
                $entry['performed_by_name'] = $performer->full_name
                    ?: trim(($performer->first_name ?? '') . ' ' . ($performer->last_name ?? ''))
                    ?: $performer->email;
            }
            return $entry;
        })->all());

        if ($request->user()?->role !== 'Requester') {
            return $purchaseRequest;
        }

        $purchaseRequest->line_items = collect($purchaseRequest->line_items ?? [])
            ->map(fn ($item) => collect($item)->except([
                'source_id',
                'available_quantity',
                'current_stock',
                'assigned_quantity',
                'reserved_quantity',
                'remaining_quantity',
                'current_department',
                'current_custodian',
                'warehouse',
                'warranty',
                'condition',
                'preferred_custodian',
                'location',
            ])->all())
            ->values()
            ->all();

        return $purchaseRequest;
    }

    protected function destinationForLine(string $itemType, int $available, int $qty): string
    {
        if ($available < $qty) {
            return 'purchase_workflow';
        }

        return match ($itemType) {
            'supply' => 'supplies_inventory_release',
            'asset' => 'asset_assignment',
            default => 'purchase_workflow',
        };
    }

    protected function aggregateWorkflowDestination(array $items): string
    {
        $destinations = collect($items)->pluck('workflow_destination')->unique()->values();

        return $destinations->count() === 1 ? $destinations->first() : 'mixed_workflow';
    }

    protected function totalForLineItems(array $items): float
    {
        return (float) collect($items)->sum(fn ($item) => (float) ($item['amount'] ?? $item['estimated_cost'] ?? 0));
    }

    protected function hasDuplicatePendingLine(?string $userId, string $sourceType, mixed $sourceId): bool
    {
        if (! $userId || ! $sourceId) {
            return false;
        }

        return PurchaseRequest::query()
            ->where('requested_by', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->get(['line_items'])
            ->contains(function (PurchaseRequest $request) use ($sourceType, $sourceId) {
                return collect($request->line_items ?? [])->contains(fn ($item) => ($item['source_type'] ?? null) === $sourceType && (string) ($item['source_id'] ?? '') === (string) $sourceId);
            });
    }

    protected function initialTimeline(Request $request, string $requestType = 'purchase_order', string $workflowDestination = 'purchase_workflow'): array
    {
        $stages = $this->workflowStagesForValues($requestType, $workflowDestination);
        return [[
            'stage' => 'Submitted',
            'status' => 'submitted',
            'performed_by' => $request->user()?->id,
            'timestamp' => now()->toIso8601String(),
        ], ...collect(array_slice($stages, 1))->map(fn ($stage) => [
            'stage' => $this->stageLabelForValues($stage, $requestType, $workflowDestination),
            'status' => 'pending',
            'timestamp' => null,
        ])->all()];
    }

    protected function upsertTimelineStage(array $timeline, string $stage, array $changes): array
    {
        $found = false;
        $updated = collect($timeline)->map(function ($entry) use ($stage, $changes, &$found) {
            if (($entry['stage'] ?? null) !== $stage) {
                return $entry;
            }

            $found = true;
            return [...$entry, ...$changes];
        })->values()->all();

        return $found ? $updated : [...$updated, ['stage' => $stage, ...$changes]];
    }

    protected function applyReleasedLineItem(PurchaseRequest $purchaseRequest, array $lineItem, Request $request): ?int
    {
        $qty = (int) ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
        if ($qty <= 0) {
            return null;
        }

        if (($lineItem['workflow_destination'] ?? null) === 'supplies_inventory_release' && ($lineItem['source_type'] ?? null) === 'supply') {
            $supply = Supply::lockForUpdate()->find($lineItem['source_id'] ?? null);
            if (! $supply) {
                throw ValidationException::withMessages([
                    'supply' => 'Requested supply is no longer available.',
                ]);
            }

            if ((int) $supply->stock < $qty) {
                throw ValidationException::withMessages([
                    'supply' => "Insufficient stock for {$supply->name}. Only {$supply->stock} unit(s) available.",
                ]);
            }

            $supply->decrement('stock', $qty);
            $movement = StockMovement::create([
                'supply_id' => $supply->id,
                'movement_type' => 'out',
                'quantity' => $qty,
                'department_id' => $purchaseRequest->department_id,
                'requested_by' => $purchaseRequest->requested_by,
                'issued_by' => $request->user()?->id,
                'notes' => "Released through {$purchaseRequest->request_number}.",
            ]);
            $anomalyId = $purchaseRequest->department_id
                ? AnomalyDetectionService::detectQuantityAnomaly(
                    $purchaseRequest->department_id,
                    $supply->id,
                    $qty,
                    $movement->id
                )
                : null;

            // Notify requester and roles about supplies release
            if (Schema::hasTable('transfer_notifications')) {
                $rows = collect([
                    [
                        'transfer_id' => null,
                        'recipient_id' => $purchaseRequest->requested_by,
                        'recipient_role' => 'Requester',
                        'type' => 'supply_released',
                        'title' => 'Supply released',
                        'message' => "{$supply->name} ({$qty} unit(s)) released for {$purchaseRequest->request_number}.",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                    [
                        'transfer_id' => null,
                        'recipient_id' => $request->user()?->id,
                        'recipient_role' => $request->user()?->role ?? 'Property Custodian',
                        'type' => 'supply_released',
                        'title' => 'Supply released',
                        'message' => "{$supply->name} ({$qty} unit(s)) released for {$purchaseRequest->request_number}.",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ])->filter(fn ($row) => ! empty($row['recipient_id']))->values()->all();

                if (! empty($rows)) {
                    DB::table('transfer_notifications')->insert($rows);
                }
            }

            return $anomalyId;
        }

        if (($lineItem['workflow_destination'] ?? null) === 'asset_assignment' && ($lineItem['source_type'] ?? null) === 'asset') {
            $asset = Asset::lockForUpdate()->find($lineItem['source_id'] ?? null);
            if (! $asset) {
                throw ValidationException::withMessages([
                    'asset' => 'Requested asset is no longer available.',
                ]);
            }

            if (in_array($asset->status, ['disposed', 'damaged'], true)) {
                throw ValidationException::withMessages([
                    'asset' => "{$asset->name} is not available for issuance.",
                ]);
            }

            $assigned = AssetAssignment::where('asset_id', $asset->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->sum('quantity');
            $available = max(0, (int) ($asset->quantity ?? 1) - (int) $assigned);

            if ($available < $qty) {
                throw ValidationException::withMessages([
                    'asset' => "Insufficient available quantity for {$asset->name}. Only {$available} unit(s) available.",
                ]);
            }

            $assignment = AssetAssignment::where('asset_id', $asset->id)
                ->where('assigned_to', $purchaseRequest->requested_by)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->latest('assigned_at')
                ->first();

            if ($assignment) {
                $assignment->update([
                    'assigned_by' => $request->user()?->id ?? $assignment->assigned_by,
                    'department_id' => $purchaseRequest->department_id ?? $assignment->department_id,
                    'assignment_type' => empty($lineItem['expected_return_date']) ? 'permanent' : 'temporary',
                    'quantity' => (int) max((int) ($assignment->quantity ?? 1), $qty),
                    'purpose' => $purchaseRequest->purpose,
                    'condition_before' => $asset->condition,
                    'assigned_at' => $assignment->assigned_at ?? now(),
                    'due_date' => $lineItem['expected_return_date'] ?? $assignment->due_date,
                    'accepted_at' => now(),
                    'status' => 'active',
                    'approval_status' => 'approved',
                    'notes' => trim(($assignment->notes ? $assignment->notes . "\n" : '') . "Created from {$purchaseRequest->request_number}.") ?: "Created from {$purchaseRequest->request_number}.",
                ]);
            } else {
                $assignment = AssetAssignment::create([
                    'asset_id' => $asset->id,
                    'assigned_to' => $purchaseRequest->requested_by,
                    'assigned_by' => $request->user()?->id,
                    'department_id' => $purchaseRequest->department_id,
                    'assignment_type' => empty($lineItem['expected_return_date']) ? 'permanent' : 'temporary',
                    'quantity' => $qty,
                    'purpose' => $purchaseRequest->purpose,
                    'condition_before' => $asset->condition,
                    'assigned_at' => now(),
                    'accepted_at' => now(),
                    'due_date' => $lineItem['expected_return_date'] ?? null,
                    'status' => 'active',
                    'approval_status' => 'approved',
                    'notes' => "Created from {$purchaseRequest->request_number}.",
                ]);
                $this->logActivity('asset_assigned', $purchaseRequest, $request, [
                    'asset_assignment_id' => $assignment->id,
                    'asset_id' => $assignment->asset_id,
                    'assigned_to' => $assignment->assigned_to,
                    'quantity' => $assignment->quantity,
                ]);
            }

            $assigned = AssetAssignment::where('asset_id', $asset->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->sum('quantity');
            $available = max(0, (int) ($asset->quantity ?? 1) - (int) $assigned);
            $asset->update([
                'available_quantity' => $available,
                'current_holder_id' => $purchaseRequest->requested_by,
                'last_assigned_at' => now(),
                'status' => $available <= 0 ? 'assigned' : 'available',
            ]);
            // Create assignment notifications so requester and related roles are informed
            if (Schema::hasTable('assignment_notifications')) {
                $assignment = AssetAssignment::whereKey($assignment->id)->first();

                if ($assignment) {
                    $assetName = optional($asset)->name ?? "Asset #{$asset->id}";
                    $employeeName = optional($assignment->assignedTo)->full_name ?? $purchaseRequest->requested_by;
                    $rows = collect([
                        ['recipient_id' => $assignment->assigned_to, 'recipient_role' => 'Employee'],
                        ['recipient_id' => $request->user()?->id, 'recipient_role' => 'Property Custodian'],
                        ['recipient_id' => null, 'recipient_role' => 'Department Head'],
                        ['recipient_id' => null, 'recipient_role' => 'System Administrator'],
                    ])->unique(fn ($row) => ($row['recipient_id'] ?? '') . '|' . ($row['recipient_role'] ?? ''))
                        ->map(fn ($row) => [
                            'assignment_id' => $assignment->id,
                            'asset_id' => $assignment->asset_id,
                            'recipient_id' => $row['recipient_id'],
                            'recipient_role' => $row['recipient_role'],
                            'type' => 'new_assignment',
                            'title' => 'New asset assignment',
                            'message' => "{$assetName} ({$assignment->quantity} unit(s)) assigned.",
                            'created_at' => now(),
                            'updated_at' => now(),
                        ])->values()->all();

                    DB::table('assignment_notifications')->insert($rows);
                }
            }
        }

        if (($lineItem['workflow_destination'] ?? null) === 'purchase_workflow' && (($lineItem['source_type'] ?? null) === 'asset' || ($lineItem['type'] ?? null) === 'asset')) {
            for ($i = 0; $i < $qty; $i++) {
                $propertyNumber = $this->generateAssetPropertyNumber();
                $newAsset = Asset::create([
                    'asset_id' => $propertyNumber,
                    'property_number' => $propertyNumber,
                    'name' => $lineItem['item'] ?? $lineItem['particular'] ?? 'Requested asset',
                    'department_id' => $purchaseRequest->department_id,
                    'status' => 'available',
                    'condition' => 'good',
                    'purchase_cost' => $lineItem['unit_price'] ?? null,
                    'quantity' => 1,
                    'available_quantity' => 1,
                    'purchase_date' => now()->toDateString(),
                    'purchase_request_id' => $purchaseRequest->id,
                ]);
                $newAsset->update(['qr_code_path' => \App\Services\AssetQrCodeService::generate($newAsset)]);
            }
        }

        return null;
    }

    protected function departmentIdForUser(?User $user): ?int
    {
        if (!$user?->department) {
            return null;
        }

        return Department::query()
            ->where('name', $user->department)
            ->orWhere('code', $user->department)
            ->value('id');
    }

    protected function sameDepartment(Request $request, ?int $departmentId): bool
    {
        return $departmentId && $departmentId === $this->departmentIdForUser($request->user());
    }

    protected function workflowSummary(PurchaseRequest $purchaseRequest): array
    {
        $nextApprover = $this->getUserForStage($purchaseRequest->current_stage, $purchaseRequest);
        $nextRole = null;

        if ($nextApprover) {
            $nextRole = $nextApprover->role;
        } else {
            $nextRole = match ($purchaseRequest->current_stage) {
                'department_head' => 'Department Head',
                'recommending_approver' => 'Recommending Approver',
                'president' => 'CEO / President',
                'property_custodian' => 'Property Custodian',
                'ppmo_staff' => 'PPMO Staff',
                default => null,
            };
        }

        $timeline = collect($purchaseRequest->timeline ?? []);
        $stages = $this->workflowStages($purchaseRequest);
        $chain = collect($stages)->map(function (string $stage) use ($purchaseRequest, $timeline) {
            $entry = $timeline->last(fn ($item) => ($item['stage'] ?? null) === $this->stageLabel($stage, $purchaseRequest));
            $approver = $this->getUserForStage($stage, $purchaseRequest);
            $status = $entry['status'] ?? ($stage === $purchaseRequest->current_stage ? 'current' : 'pending');
            if ($purchaseRequest->status === 'rejected' && $stage === $purchaseRequest->current_stage) {
                $status = 'rejected';
            }

            return [
                'stage' => $stage,
                'label' => $this->stageLabel($stage, $purchaseRequest),
                'role' => $stage === 'property_custodian' && $purchaseRequest->request_type === 'request' ? 'OIC' : ($this->getRoleForStage($stage) ?: $this->stageLabel($stage, $purchaseRequest)),
                'approver' => $approver ? [
                    'id' => $approver->id,
                    'name' => $approver->full_name ?: trim("{$approver->first_name} {$approver->last_name}"),
                    'role' => $approver->role,
                ] : null,
                'status' => $status,
                'timestamp' => $entry['timestamp'] ?? null,
                'remarks' => $entry['notes'] ?? ($stage === $purchaseRequest->current_stage ? $purchaseRequest->rejection_reason : null),
            ];
        })->values()->all();

        return [
            'current_stage' => $purchaseRequest->current_stage,
            'status' => $purchaseRequest->status,
            'workflow_type' => $this->workflowStages($purchaseRequest) === self::INVENTORY_REQUEST_STAGES ? 'request' : 'purchase_order',
            'is_procurement_required' => $purchaseRequest->workflow_destination === 'purchase_workflow',
            'stages' => $chain,
            'next_approver_role' => $nextRole,
            'next_approver' => $nextApprover ? [
                'id' => $nextApprover->id,
                'name' => trim("{$nextApprover->first_name} {$nextApprover->last_name}"),
                'email' => $nextApprover->email,
                'role' => $nextApprover->role,
            ] : null,
        ];
    }

    protected function stageLabel(string $stage, ?PurchaseRequest $purchaseRequest = null): string
    {
        if ($purchaseRequest) {
            return $this->stageLabelForValues($stage, $purchaseRequest->request_type, $purchaseRequest->workflow_destination);
        }

        return $this->stageLabelForValues($stage, 'purchase_order', 'purchase_workflow');
    }

    protected function stageLabelForValues(string $stage, ?string $requestType, ?string $workflowDestination): string
    {
        $inventoryRequest = $requestType === 'request' && in_array($workflowDestination, ['asset_assignment', 'supplies_inventory_release'], true);

        return match ($stage) {
            'employee' => 'Submitted',
            'department_head' => 'Department Head',
            'recommending_approver' => 'Recommending Approver',
            'president' => 'President / CEO',
            'property_custodian' => $inventoryRequest ? 'OIC' : 'Processing / Release',
            'ppmo_staff' => 'PPMO Staff — Processing / Release',
            'released' => 'Released',
            default => ucwords(str_replace('_', ' ', $stage)),
        };
    }

    protected function notifyWorkflowParticipants(
        PurchaseRequest $purchaseRequest,
        string $type,
        string $title,
        ?string $reason = null
    ): void {
        if (! Schema::hasTable('transfer_notifications') || ! $purchaseRequest->requested_by) {
            return;
        }

        $message = match ($type) {
            'revision_requested' => "Purchase request {$purchaseRequest->request_number} needs revision. Reason: " . ($reason ?: 'Please review the comments.'),
            'resubmitted' => "Purchase request {$purchaseRequest->request_number} was resubmitted and is waiting for Department Head review.",
            default => "Purchase request {$purchaseRequest->request_number} was updated.",
        };

        $exists = DB::table('transfer_notifications')
            ->where('recipient_id', $purchaseRequest->requested_by)
            ->where('type', $type)
            ->where('message', $message)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();

        if (! $exists) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $purchaseRequest->requested_by,
                'recipient_role' => 'Requester',
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    protected function getRoleForStage(string $stage): ?string
    {
        return match ($stage) {
            'department_head' => 'Department Head',
            'recommending_approver' => 'Recommending Approver',
            'president' => 'CEO',
            'property_custodian' => 'Property Custodian',
            'ppmo_staff' => 'PPMO Staff',
            default => null,
        };
    }

    protected function getUserForStage(string $stage, PurchaseRequest $purchaseRequest): ?User
    {
        return match ($stage) {
            'department_head' => $this->getDepartmentHeadForRequest($purchaseRequest),
            'recommending_approver' => User::query()->where('role', 'Recommending Approver')->where('status', 'active')->first(),
            'president' => $this->getAuthorizedApproverForRequest($purchaseRequest),
            'property_custodian' => $this->getCustodianForRequest($purchaseRequest),
            'ppmo_staff' => User::query()->where('role', 'PPMO Staff')->where('status', 'active')->first(),
            default => null,
        };
    }

    protected function getDepartmentHeadForRequest(PurchaseRequest $purchaseRequest): ?User
    {
        if ($purchaseRequest->department_id) {
            $department = Department::find($purchaseRequest->department_id);
            if ($department && $department->head_user_id) {
                return User::query()
                    ->where('id', $department->head_user_id)
                    ->where('role', 'Department Head')
                    ->where('status', 'active')
                    ->first();
            }
        }

        if ($purchaseRequest->department_name) {
            return User::query()
                ->where('role', 'Department Head')
                ->where('status', 'active')
                ->where(function ($query) use ($purchaseRequest) {
                    $query->where('department', $purchaseRequest->department_name)
                        ->orWhere('department', 'like', '%' . $purchaseRequest->department_name . '%');
                })
                ->first();
        }

        return null;
    }

    protected function getAuthorizedApproverForRequest(PurchaseRequest $purchaseRequest): ?User
    {
        return User::query()
            ->whereIn('role', ['CEO', 'President'])
            ->where('status', 'active')
            ->orderByRaw("CASE role WHEN 'CEO' THEN 1 WHEN 'President' THEN 2 ELSE 3 END")
            ->first();
    }

    protected function getCustodianForRequest(PurchaseRequest $purchaseRequest): ?User
    {
        return User::query()
            ->whereIn('role', ['OIC', 'Property Custodian'])
            ->where('status', 'active')
            ->orderByRaw("CASE role WHEN 'OIC' THEN 1 WHEN 'Property Custodian' THEN 2 ELSE 3 END")
            ->first();
    }

    /**
     * Department Head dashboard data — department-scoped metrics and recent activity.
     */
    public function departmentHeadDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $departmentId = $this->departmentIdForUser($user);

        if (! $departmentId) {
            return response()->json(['message' => 'User department not found.'], 400);
        }

        // Pending approvals (department_head, pending)
        $pendingCount = PurchaseRequest::query()
            ->where('current_stage', 'department_head')
            ->where('status', 'pending')
            ->where('department_id', $departmentId)
            ->count();

        // Returned for revision
        $returnedCount = PurchaseRequest::query()
            ->where('department_id', $departmentId)
            ->where('status', 'revision_requested')
            ->count();

        // Pending requests list (latest 6)
        $pendingRequests = PurchaseRequest::query()
            ->with('requester', 'department')
            ->where('current_stage', 'department_head')
            ->where('status', 'pending')
            ->where('department_id', $departmentId)
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        // Activity logs for this department (recent)
        $activityRows = DB::table('activity_logs')->orderBy('created_at', 'desc')->limit(200)->get();
        $recentActivity = [];
        foreach ($activityRows as $row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];
            $prId = $payload['purchase_request_id'] ?? $payload['purchase_request'] ?? null;
            if ($prId) {
                $pr = PurchaseRequest::find($prId);
                if ($pr && $pr->department_id === $departmentId) {
                    $recentActivity[] = [
                        'action' => $row->action,
                        'payload' => $payload,
                        'created_at' => $row->created_at,
                    ];
                }
            }
        }

        // Approved today by this department head
        $today = now()->toDateString();
        $approvedToday = 0;
        $monthlyApprovals = 0;
        $reviewDurations = [];

        $advances = DB::table('activity_logs')
            ->where('action', 'purchase_request_advanced')
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($advances as $row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];
            if (($payload['from_stage'] ?? null) !== 'department_head') continue;
            if (($payload['user'] ?? null) !== ($user->email ?? null)) continue;
            $prId = $payload['purchase_request_id'] ?? null;
            if (! $prId) continue;
            $pr = PurchaseRequest::find($prId);
            if (! $pr || $pr->department_id !== $departmentId) continue;

            $createdDate = optional($pr->created_at)->toDateString();
            if ($createdDate === $today) {
                $approvedToday++;
            }

            if (optional($row->created_at)->between(now()->startOfMonth(), now()->endOfMonth())) {
                $monthlyApprovals++;
            }

            // review duration: time between PR created and this advance
            if ($pr->created_at && $row->created_at) {
                $dur = strtotime($row->created_at) - strtotime($pr->created_at);
                if ($dur > 0) $reviewDurations[] = $dur;
            }
        }

        $averageReviewSeconds = count($reviewDurations) ? array_sum($reviewDurations) / count($reviewDurations) : null;
        $averageReviewTime = $averageReviewSeconds ? round($averageReviewSeconds / 3600, 2) : null; // hours

        return response()->json([
            'pending_approvals' => $pendingCount,
            'approved_today' => $approvedToday,
            'returned_for_revision' => $returnedCount,
            'average_review_time_hours' => $averageReviewTime,
            'pending_requests' => $pendingRequests,
            'recent_activity' => array_slice($recentActivity, 0, 10),
            'analytics' => [
                'monthly_approvals' => $monthlyApprovals,
                'average_review_hours' => $averageReviewTime,
            ],
        ]);
    }

    protected function logActivity(string $action, PurchaseRequest $purchaseRequest, Request $request, array $extra = []): void
    {
        $data = [
            'action' => $action,
            'purchase_request_id' => $purchaseRequest->id,
            'request_number' => $purchaseRequest->request_number,
            'user' => optional($request->user())->email ?? 'system',
            'ip' => $request->ip(),
            ...$extra,
        ];

        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode($data),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
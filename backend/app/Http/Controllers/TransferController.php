<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransferController extends Controller
{
    protected array $relations = ['asset', 'fromDepartment', 'toDepartment', 'requester', 'fromCustodian', 'toCustodian', 'approvedBy'];

    public function __construct()
    {
        $this->authorizeResource(AssetTransfer::class, 'transfer');
    }

    public function index(Request $request): JsonResponse
    {
        $transfers = AssetTransfer::query()
            ->with($this->relations)
            ->when($request->boolean('mine') || $request->user()?->role === 'Requester', fn ($query) => $query->where('requested_by', $request->user()?->id))
            ->when($request->boolean('department_queue') || $request->is('api/department-head/transfers/pending'), function ($query) use ($request) {
                $query
                    ->whereIn('status', ['transfer_requested', 'revision_requested'])
                    ->whereHas('requester', fn ($requester) => $requester->where('department', $request->user()?->department));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->status))
            ->when($request->filled('transfer_type'), fn ($query) => $query->where('transfer_type', $request->transfer_type))
            ->when($request->filled('department_id'), fn ($query) => $query->where(function ($q) use ($request) {
                $q->where('from_department_id', $request->department_id)->orWhere('to_department_id', $request->department_id);
            }))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('transfer_number', 'like', "%{$search}%")
                        ->orWhereHas('asset', fn ($asset) => $asset
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('property_number', 'like', "%{$search}%"))
                        ->orWhereHas('toDepartment', fn ($department) => $department->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('fromDepartment', fn ($department) => $department->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('toCustodian', fn ($user) => $user->where('full_name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($transfers);
    }

    public function dashboard(): JsonResponse
    {
        $base = AssetTransfer::query();

        return response()->json([
            'pending_transfers' => (clone $base)->whereIn('status', ['transfer_requested', 'revision_requested'])->count(),
            'approved' => (clone $base)->whereIn('status', ['department_approved', 'ready_for_transfer'])->count(),
            'completed' => (clone $base)->where('status', 'transfer_completed')->count(),
            'rejected' => (clone $base)->where('status', 'rejected')->count(),
            'on_hold' => (clone $base)->where('status', 'on_hold')->count(),
            'temporary_transfers' => (clone $base)->where('transfer_type', 'temporary')->whereIn('status', ['ready_for_transfer', 'transfer_completed'])->count(),
            'transfers_today' => (clone $base)->whereDate('transfer_date', now()->toDateString())->count(),
            'transfers_this_month' => (clone $base)->where('created_at', '>=', now()->startOfMonth())->count(),
            'temporary_due' => AssetTransfer::with($this->relations)
                ->where('transfer_type', 'temporary')
                ->where('status', 'transfer_completed')
                ->whereNotNull('expected_return_date')
                ->whereDate('expected_return_date', '<=', now()->addDays(7)->toDateString())
                ->orderBy('expected_return_date')
                ->limit(10)
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'to_department_id' => ['required', 'exists:departments,id'],
            'to_custodian_id' => ['required', 'uuid', 'exists:users,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:2000'],
            'transfer_type' => ['nullable', 'in:permanent,temporary'],
            'expected_return_date' => ['nullable', 'required_if:transfer_type,temporary', 'date', 'after_or_equal:today'],
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        $quantity = (int) ($validated['quantity'] ?? 1);
        $toCustodian = User::findOrFail($validated['to_custodian_id']);

        $validationError = $this->validateTransferRequest($asset, $quantity, $request);
        if ($validationError) {
            return response()->json(['message' => $validationError], 422);
        }

        if (($toCustodian->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Destination custodian must be an active employee.'], 422);
        }

        $transfer = DB::transaction(function () use ($validated, $request, $asset, $quantity) {
            $transfer = AssetTransfer::create([
                'transfer_number' => $this->generateTransferNumber(),
                'asset_id' => $asset->id,
                'from_department_id' => $asset->department_id,
                'to_department_id' => $validated['to_department_id'],
                'from_custodian_id' => $asset->current_holder_id ?: $asset->custodian_id,
                'to_custodian_id' => $validated['to_custodian_id'],
                'requested_by' => $request->user()?->id,
                'status' => 'transfer_requested',
                'reason' => $validated['reason'],
                'quantity' => $quantity,
                'transfer_type' => $validated['transfer_type'] ?? 'permanent',
                'expected_return_date' => $validated['expected_return_date'] ?? null,
                'risk_score' => $this->calculateRiskScore($asset, $quantity),
            ]);

            $this->recordHistory($transfer, 'transfer_requested', $request);
            $this->logActivity('transfer_requested', $transfer, $request);
            $this->notifyTransfer($transfer, 'pending_approval', $request, ['Department Head', 'PPMO Staff', 'System Administrator']);

            return $transfer;
        });

        return response()->json($transfer->fresh()->load($this->relations), 201);
    }

    public function show(AssetTransfer $transfer): JsonResponse
    {
        return response()->json([
            'transfer' => $transfer->load($this->relations),
            'history' => DB::table('transfer_history')->where('transfer_id', $transfer->id)->orderByDesc('created_at')->get(),
            'recommendations' => $this->buildRecommendations($transfer),
        ]);
    }

    public function update(Request $request, AssetTransfer $transfer): JsonResponse
    {
        if (! in_array($transfer->status, ['transfer_requested', 'revision_requested', 'on_hold'], true)) {
            return response()->json(['message' => 'Only requested, revision, or held transfers can be edited.'], 400);
        }

        $validated = $request->validate([
            'to_department_id' => ['sometimes', 'exists:departments,id'],
            'to_custodian_id' => ['sometimes', 'uuid', 'exists:users,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'reason' => ['sometimes', 'string', 'max:2000'],
            'transfer_type' => ['sometimes', 'in:permanent,temporary'],
            'expected_return_date' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        if (($validated['transfer_type'] ?? $transfer->transfer_type) === 'temporary' && empty($validated['expected_return_date']) && ! $transfer->expected_return_date) {
            return response()->json(['message' => 'Expected return date is required for temporary transfers.'], 422);
        }

        $transfer->update(array_merge($validated, ['status' => 'transfer_requested']));
        $this->recordHistory($transfer, 'resubmitted', $request, $validated);
        $this->logActivity('transfer_updated', $transfer, $request);
        $this->notifyTransfer($transfer, 'pending_approval', $request, ['Department Head', 'PPMO Staff', 'System Administrator']);

        return response()->json($transfer->fresh()->load($this->relations));
    }

    public function destroy(Request $request, AssetTransfer $transfer): JsonResponse
    {
        if (! in_array($transfer->status, ['transfer_requested', 'revision_requested', 'rejected', 'on_hold'], true)) {
            return response()->json(['message' => 'Only unexecuted transfers can be cancelled.'], 400);
        }

        $transfer->update(['status' => 'cancelled']);
        $this->recordHistory($transfer, 'cancelled', $request);
        $this->logActivity('transfer_cancelled', $transfer, $request);

        return response()->json(['message' => 'Transfer cancelled.']);
    }

    public function approve(Request $request, AssetTransfer $transfer): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($transfer->status === 'transfer_requested' || $transfer->status === 'pending') {
            if ($request->user()?->role === 'Department Head' && ! $this->requesterInSameDepartment($request, $transfer)) {
                return response()->json(['message' => 'Department Head approvals are limited to their own department.'], 403);
            }

            $transfer->update([
                'status' => 'department_approved',
                'department_approved_by' => $request->user()?->id,
                'approval_notes' => $validated['notes'] ?? $transfer->approval_notes,
            ]);

            $this->recordHistory($transfer, 'department_approved', $request, $validated);
            $this->logActivity('transfer_department_approved', $transfer, $request);
            $this->notifyTransfer($transfer, 'approved', $request, ['OIC', 'Property Custodian']);

            return response()->json($transfer->fresh()->load($this->relations));
        }

        if ($transfer->status === 'department_approved' || $transfer->status === 'on_hold') {
            $asset = Asset::find($transfer->asset_id);
            $validationError = $asset ? $this->validateTransferRequest($asset, (int) $transfer->quantity, $request, $transfer->id) : 'Asset no longer exists.';
            if ($validationError) {
                return response()->json(['message' => $validationError], 422);
            }

            $transfer->update([
                'status' => 'ready_for_transfer',
                'approved_by' => $request->user()?->id,
                'approval_notes' => $validated['notes'] ?? $transfer->approval_notes,
            ]);

            $this->recordHistory($transfer, 'ready_for_transfer', $request, $validated);
            $this->logActivity('transfer_oic_approved', $transfer, $request);
            $this->notifyTransfer($transfer, 'approved', $request, ['Requester', 'Receiving Custodian', 'Current Custodian']);

            return response()->json($transfer->fresh()->load($this->relations));
        }

        return response()->json(['message' => 'Transfer is not ready for approval.'], 400);
    }

    public function reject(Request $request, AssetTransfer $transfer): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (! in_array($transfer->status, ['transfer_requested', 'pending', 'department_approved', 'ready_for_transfer', 'on_hold'], true)) {
            return response()->json(['message' => 'This transfer can no longer be rejected.'], 400);
        }

        $transfer->update([
            'status' => 'rejected',
            'approved_by' => $request->user()?->id,
            'rejection_reason' => $validated['reason'],
        ]);

        $this->recordHistory($transfer, 'rejected', $request, $validated);
        $this->logActivity('transfer_rejected', $transfer, $request);
        $this->notifyTransfer($transfer, 'rejected', $request, ['Requester', 'Department Head']);

        return response()->json($transfer->fresh()->load($this->relations));
    }

    public function hold(Request $request, AssetTransfer $transfer): JsonResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        if (! in_array($transfer->status, ['department_approved', 'ready_for_transfer'], true)) {
            return response()->json(['message' => 'Only department-approved transfers can be placed on hold.'], 400);
        }

        $transfer->update(['status' => 'on_hold', 'hold_reason' => $validated['reason']]);
        $this->recordHistory($transfer, 'on_hold', $request, $validated);
        $this->logActivity('transfer_on_hold', $transfer, $request);
        $this->notifyTransfer($transfer, 'on_hold', $request, ['Requester']);

        return response()->json($transfer->fresh()->load($this->relations));
    }

    public function requestRevision(Request $request, AssetTransfer $transfer): JsonResponse
    {
        $validated = $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        if (! in_array($transfer->status, ['transfer_requested', 'department_approved', 'on_hold'], true)) {
            return response()->json(['message' => 'This transfer is not available for revision request.'], 400);
        }

        $transfer->update(['status' => 'revision_requested', 'revision_notes' => $validated['reason']]);
        $this->recordHistory($transfer, 'revision_requested', $request, $validated);
        $this->logActivity('transfer_revision_requested', $transfer, $request);
        $this->notifyTransfer($transfer, 'revision_requested', $request, ['Requester']);

        return response()->json($transfer->fresh()->load($this->relations));
    }

    public function execute(Request $request, AssetTransfer $transfer): JsonResponse
    {
        if ($transfer->status !== 'ready_for_transfer') {
            return response()->json(['message' => 'Only ready transfers can be executed.'], 400);
        }

        $validated = $request->validate([
            'transfer_date' => ['nullable', 'date'],
            'actual_quantity' => ['nullable', 'integer', 'min:1'],
            'condition_before' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged,lost_parts'],
            'condition_after' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged,lost_parts'],
            'photo_before' => ['nullable', 'image', 'max:5120'],
            'photo_after' => ['nullable', 'image', 'max:5120'],
            'receiving_signature' => ['required', 'string'],
            'releasing_signature' => ['required', 'string'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $asset = Asset::findOrFail($transfer->asset_id);
        $actualQuantity = (int) ($validated['actual_quantity'] ?? $transfer->quantity ?? 1);

        if ($actualQuantity > (int) $transfer->quantity) {
            return response()->json(['message' => 'Actual quantity cannot exceed the approved transfer quantity.'], 422);
        }

        $photoBefore = $request->hasFile('photo_before') ? $request->file('photo_before')->store('transfer-photos', 'public') : null;
        $photoAfter = $request->hasFile('photo_after') ? $request->file('photo_after')->store('transfer-photos', 'public') : null;

        DB::transaction(function () use ($transfer, $asset, $request, $validated, $actualQuantity, $photoBefore, $photoAfter) {
            $previous = [
                'department_id' => $asset->department_id,
                'custodian_id' => $asset->custodian_id,
                'current_holder_id' => $asset->current_holder_id,
                'quantity' => $asset->quantity,
            ];

            $transfer->update([
                'status' => 'transfer_completed',
                'transfer_date' => $validated['transfer_date'] ?? now(),
                'actual_quantity' => $actualQuantity,
                'condition_before' => $validated['condition_before'] ?? $asset->condition,
                'condition_after' => $validated['condition_after'] ?? $asset->condition,
                'photo_before_path' => $photoBefore,
                'photo_after_path' => $photoAfter,
                'receiving_signature' => $validated['receiving_signature'],
                'releasing_signature' => $validated['releasing_signature'],
                'remarks' => $validated['remarks'] ?? null,
                'executed_by' => $request->user()?->id,
            ]);

            $assetUpdates = [
                'department_id' => $transfer->to_department_id,
                'custodian_id' => $transfer->to_custodian_id,
                'current_holder_id' => $transfer->to_custodian_id,
                'last_transfer_at' => now(),
                'location' => optional($transfer->toDepartment)->location ?: $asset->location,
            ];

            if (in_array($transfer->condition_after, ['needs_repair', 'damaged', 'lost_parts'], true)) {
                $assetUpdates['condition'] = $transfer->condition_after;
                $assetUpdates['status'] = $transfer->condition_after === 'damaged' ? 'damaged' : 'maintenance';
            }

            $asset->update($assetUpdates);

            DB::table('asset_assignments')
                ->where('asset_id', $asset->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->update([
                    'assigned_to' => $transfer->to_custodian_id,
                    'department_id' => $transfer->to_department_id,
                    'updated_at' => now(),
                ]);

            DB::table('stock_movements')->insert([
                'payload' => json_encode([
                    'type' => 'asset_transfer',
                    'transfer_id' => $transfer->id,
                    'transfer_number' => $transfer->transfer_number,
                    'asset_id' => $asset->id,
                    'quantity' => $actualQuantity,
                    'from_department_id' => $previous['department_id'],
                    'to_department_id' => $transfer->to_department_id,
                ]),
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (in_array($transfer->condition_after, ['needs_repair', 'damaged', 'lost_parts'], true)) {
                DB::table('damage_reports')->insert([
                    'asset_id' => $asset->id,
                    'department_id' => $transfer->to_department_id,
                    'reported_by' => $request->user()?->id,
                    'severity' => $transfer->condition_after === 'damaged' ? 'moderate' : 'minor',
                    'description' => $validated['remarks'] ?? 'Issue recorded during transfer receiving inspection.',
                    'photo_path' => $photoAfter,
                    'status' => 'submitted',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->recordHistory($transfer, 'transfer_completed', $request, ['previous' => $previous, 'actual_quantity' => $actualQuantity]);
            $this->logActivity('transfer_completed', $transfer, $request, $previous);
            $this->notifyTransfer($transfer, 'transfer_completed', $request, ['Requester', 'Department Head', 'Receiving Custodian', 'Current Custodian']);

            if ($transfer->transfer_type === 'temporary') {
                $this->notifyTransfer($transfer, 'temporary_transfer_due', $request, ['Receiving Custodian', 'Current Custodian']);
            }
        });

        return response()->json($transfer->fresh()->load($this->relations));
    }

    public function recommendations(Request $request): JsonResponse
    {
        $transfer = $request->filled('transfer_id') ? AssetTransfer::with($this->relations)->find($request->transfer_id) : null;
        $asset = $transfer?->asset ?: ($request->filled('asset_id') ? Asset::find($request->asset_id) : null);
        $quantity = (int) ($request->quantity ?? $transfer?->quantity ?? 1);

        return response()->json(['data' => $asset ? $this->buildRecommendations($transfer, $asset, $quantity) : []]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = AssetTransfer::with($this->relations)->orderByDesc('created_at');
        $filename = 'transfer-history-' . now()->format('YmdHis') . '.csv';

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Transfer No', 'Asset', 'Property Number', 'Quantity', 'Type', 'From Department', 'To Department', 'From Custodian', 'To Custodian', 'Requested By', 'Approved By', 'Transfer Date', 'Status', 'Remarks']);

            $query->cursor()->each(function ($transfer) use ($handle) {
                fputcsv($handle, [
                    $transfer->transfer_number,
                    optional($transfer->asset)->name,
                    optional($transfer->asset)->property_number,
                    $transfer->actual_quantity ?: $transfer->quantity,
                    $transfer->transfer_type,
                    optional($transfer->fromDepartment)->name,
                    optional($transfer->toDepartment)->name,
                    optional($transfer->fromCustodian)->full_name,
                    optional($transfer->toCustodian)->full_name,
                    optional($transfer->requester)->full_name,
                    optional($transfer->approvedBy)->full_name,
                    optional($transfer->transfer_date)->toDateString(),
                    $transfer->status,
                    $transfer->remarks ?: $transfer->reason,
                ]);
            });

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    protected function validateTransferRequest(Asset $asset, int $quantity, Request $request, ?int $ignoreTransferId = null): ?string
    {
        if (in_array($asset->status, ['disposed', 'damaged'], true)) {
            return 'Asset must be active and not disposed or damaged before transfer.';
        }

        if ($quantity > (int) ($asset->quantity ?? 1)) {
            return 'Transfer quantity cannot exceed asset quantity.';
        }

        $pending = AssetTransfer::where('asset_id', $asset->id)
            ->whereIn('status', ['transfer_requested', 'pending', 'department_approved', 'ready_for_transfer', 'on_hold', 'revision_requested'])
            ->when($ignoreTransferId, fn ($query) => $query->where('id', '!=', $ignoreTransferId))
            ->exists();
        if ($pending) {
            return 'This asset already has a pending transfer workflow.';
        }

        $user = $request->user();
        $isElevated = in_array($user?->role, ['System Administrator', 'Property Custodian', 'PPMO Staff', 'OIC'], true);
        $ownsAsset = $user && in_array($user->id, array_filter([$asset->custodian_id, $asset->current_holder_id]), true);

        if ($user && ! $isElevated && ! $ownsAsset) {
            return 'Requester must currently own or hold the asset before requesting transfer.';
        }

        return null;
    }

    protected function buildRecommendations(?AssetTransfer $transfer = null, ?Asset $asset = null, int $quantity = 1): array
    {
        $asset = $asset ?: $transfer?->asset;
        if (! $asset) {
            return [];
        }

        $items = [];
        $recentCount = AssetTransfer::where('asset_id', $asset->id)->where('created_at', '>=', now()->subDays(90))->count();
        if ($recentCount >= 3) {
            $items[] = ['type' => 'unusual_frequency', 'severity' => 'high', 'message' => 'This asset has moved frequently in the last 90 days. Review the operational need.'];
        }
        if ($quantity > max(1, floor((int) ($asset->quantity ?? 1) / 2))) {
            $items[] = ['type' => 'abnormal_quantity', 'severity' => 'medium', 'message' => 'Requested quantity is high compared with recorded asset quantity.'];
        }
        if (in_array($asset->condition, ['fair', 'needs_repair'], true)) {
            $items[] = ['type' => 'high_risk_asset', 'severity' => 'medium', 'message' => 'Asset condition increases transfer risk. Require receiving inspection photos.'];
        }

        $similarApproved = AssetTransfer::where('asset_id', $asset->id)
            ->where('status', 'transfer_completed')
            ->where('created_at', '>=', now()->subYear())
            ->exists();
        if ($similarApproved) {
            $items[] = ['type' => 'similar_transfer', 'severity' => 'info', 'message' => 'Similar completed transfers exist for this asset. Approval is likely routine if documentation matches.'];
        }

        return $items;
    }

    protected function generateTransferNumber(): string
    {
        $sequence = AssetTransfer::count() + 1;
        return sprintf('TR-%s-%06d', now()->format('Y'), $sequence);
    }

    protected function recordHistory(AssetTransfer $transfer, string $eventType, Request $request, array $payload = []): void
    {
        if (! Schema::hasTable('transfer_history')) {
            return;
        }

        DB::table('transfer_history')->insert([
            'transfer_id' => $transfer->id,
            'asset_id' => $transfer->asset_id,
            'transfer_number' => $transfer->transfer_number,
            'event_type' => $eventType,
            'payload' => json_encode($payload),
            'performed_by' => $request->user()?->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function logActivity(string $action, AssetTransfer $transfer, Request $request, array $previous = []): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'transfer_id' => $transfer->id,
                'transfer_number' => $transfer->transfer_number,
                'asset_id' => $transfer->asset_id,
                'previous_department_id' => $previous['department_id'] ?? $transfer->from_department_id,
                'new_department_id' => $transfer->to_department_id,
                'previous_custodian_id' => $previous['custodian_id'] ?? $transfer->from_custodian_id,
                'new_custodian_id' => $transfer->to_custodian_id,
                'old_quantity' => $previous['quantity'] ?? null,
                'new_quantity' => $transfer->actual_quantity ?: $transfer->quantity,
                'reason' => $transfer->reason,
                'user' => optional($request->user())->email ?? 'system',
                'role' => $request->user()?->role,
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function notifyTransfer(AssetTransfer $transfer, string $type, Request $request, array $roles): void
    {
        if (! Schema::hasTable('transfer_notifications')) {
            return;
        }

        $transfer->loadMissing($this->relations);
        $titles = [
            'pending_approval' => 'Transfer pending approval',
            'approved' => 'Transfer approved',
            'rejected' => 'Transfer rejected',
            'on_hold' => 'Transfer on hold',
            'revision_requested' => 'Transfer revision requested',
            'transfer_completed' => 'Transfer completed',
            'temporary_transfer_due' => 'Temporary transfer return reminder',
        ];

        $recipientMap = [
            'Requester' => $transfer->requested_by,
            'Receiving Custodian' => $transfer->to_custodian_id,
            'Current Custodian' => $transfer->from_custodian_id,
            'Department Head' => User::query()
                ->where('role', 'Department Head')
                ->where('status', 'active')
                ->whereIn('department', collect([$transfer->fromDepartment?->name, $transfer->toDepartment?->name])->filter()->unique()->values())
                ->pluck('id')
                ->all(),
            'OIC' => User::query()->where('role', 'OIC')->where('status', 'active')->pluck('id')->all(),
            'Property Custodian' => User::query()->where('role', 'Property Custodian')->where('status', 'active')->pluck('id')->all(),
            'PPMO Staff' => User::query()->where('role', 'PPMO Staff')->where('status', 'active')->pluck('id')->all(),
            'System Administrator' => User::query()->where('role', 'System Administrator')->where('status', 'active')->pluck('id')->all(),
        ];

        $rows = collect($roles)->flatMap(function ($role) use ($recipientMap, $transfer, $type, $titles) {
            $recipientIds = is_array($recipientMap[$role] ?? null) ? $recipientMap[$role] : [$recipientMap[$role] ?? null];

            return collect($recipientIds)->filter()->unique()->map(fn ($recipientId) => [
                'transfer_id' => $transfer->id,
                'recipient_id' => $recipientId,
                'recipient_role' => $role,
                'type' => $type,
                'title' => $titles[$type] ?? 'Transfer notification',
                'message' => "{$transfer->transfer_number} for " . (optional($transfer->asset)->name ?? "Asset #{$transfer->asset_id}") . '.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        })->values()->all();

        if (! empty($rows)) {
            DB::table('transfer_notifications')->insert($rows);
        }
    }

    protected function requesterInSameDepartment(Request $request, AssetTransfer $transfer): bool
    {
        $requester = $transfer->requester;

        return $requester && $requester->department && $requester->department === $request->user()?->department;
    }
}

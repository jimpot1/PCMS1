<?php

namespace App\Http\Controllers;

use App\Models\GatePass;
use App\Models\Asset;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GatePassController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(GatePass::class, 'gatePass');
    }

    public function index(Request $request): JsonResponse
    {
        $passes = GatePass::query()
            ->with('asset.department', 'department', 'requester')
            ->when($request->boolean('mine') || $request->user()?->role === 'Requester', fn ($query) => $query->where('requested_by', $request->user()?->id))
            ->when($request->boolean('deliverable'), fn ($query) => $query->where('status', 'approved'))
            ->when($request->boolean('department_queue') || $request->is('api/department-head/gate-passes/pending'), function ($query) use ($request) {
                $query
                    ->where('status', 'pending')
                    ->where('department_id', $this->departmentIdForUser($request));
            })
            ->when($request->status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->asset_id, fn ($query, $value) => $query->where('asset_id', $value))
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($passes);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'purpose' => ['required', 'string'],
            'valid_until' => ['required', 'date'],
            'destination' => ['nullable', 'string', 'max:180'],
            'vehicle' => ['nullable', 'string', 'max:120'],
            'driver' => ['nullable', 'string', 'max:120'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'condition_before' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged'],
        ]);

        $asset = Asset::with('currentAssignment')->findOrFail($validated['asset_id']);

        if (! $asset->currentAssignment) {
            return response()->json(['message' => 'Asset must be assigned before a gate pass can be requested.'], 422);
        }

        if (GatePass::where('asset_id', $asset->id)->whereIn('status', ['pending', 'approved', 'completed'])->exists()) {
            return response()->json(['message' => 'This asset already has an active or pending gate pass.'], 422);
        }

        $gatePass = GatePass::create([
            'gate_pass_number' => $this->generateGatePassNumber(),
            'asset_id' => $validated['asset_id'],
            'requested_by' => $request->user()?->id,
            'department_id' => $this->departmentIdForUser($request),
            'purpose' => $validated['purpose'],
            'destination' => $validated['destination'] ?? null,
            'vehicle' => $validated['vehicle'] ?? null,
            'driver' => $validated['driver'] ?? null,
            'quantity' => $validated['quantity'] ?? 1,
            'condition_before' => $validated['condition_before'] ?? $asset->condition,
            'valid_until' => $validated['valid_until'],
            'status' => 'pending',
        ]);

        // Generate QR code
        $qrPath = $this->generateQrCode($gatePass);
        $gatePass->update(['qr_code_path' => $qrPath]);

        $this->logActivity('gate_pass_created', $gatePass, $request);

        $gatePass = $gatePass->fresh()->load('asset.department', 'department', 'requester');

        return response()->json([
            'data' => $gatePass,
            'workflow' => [
                'status' => $gatePass->status,
                'next_approver_role' => 'Department Head',
                'next_approver' => $this->nextDepartmentHead($gatePass),
            ],
        ], 201);
    }

    public function storeWalkIn(Request $request): JsonResponse
    {
        $this->authorize('create', GatePass::class);

        $validated = $request->validate([
            'has_account' => ['required', 'boolean'],
            'requester_user_id' => ['required_if:has_account,true', 'nullable', 'uuid', 'exists:users,id'],
            'walk_in_requester_name' => ['required_if:has_account,false', 'nullable', 'string', 'max:255'],
            'walk_in_requester_contact' => ['nullable', 'string', 'max:255'],
            'walk_in_notes' => ['nullable', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'asset_id' => ['required', 'exists:assets,id'],
            'purpose' => ['required', 'string'],
            'valid_until' => ['required', 'date'],
            'destination' => ['nullable', 'string', 'max:180'],
            'vehicle' => ['nullable', 'string', 'max:120'],
            'driver' => ['nullable', 'string', 'max:120'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'condition_before' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged'],
        ]);

        $requesterUser = null;
        if ($validated['has_account']) {
            $requesterUser = User::query()->find($validated['requester_user_id']);
            if (!$requesterUser || $requesterUser->role !== 'Requester') {
                return response()->json(['message' => 'Selected account is not a Requester.'], 422);
            }
        }

        $asset = Asset::with('currentAssignment')->findOrFail($validated['asset_id']);

        if (! $asset->currentAssignment) {
            return response()->json(['message' => 'Asset must be assigned before a gate pass can be requested.'], 422);
        }

        if (GatePass::where('asset_id', $asset->id)->whereIn('status', ['pending', 'approved', 'completed'])->exists()) {
            return response()->json(['message' => 'This asset already has an active or pending gate pass.'], 422);
        }

        $departmentId = $validated['department_id'] ?? null;
        if (!$departmentId && $requesterUser) {
            $departmentId = Department::query()
                ->where('name', $requesterUser->department)
                ->orWhere('code', $requesterUser->department)
                ->value('id');
        }
        if (!$departmentId) {
            $departmentId = $asset->department_id;
        }

        $gatePass = GatePass::create([
            'gate_pass_number' => $this->generateGatePassNumber(),
            'asset_id' => $validated['asset_id'],
            'requested_by' => $requesterUser?->id,
            'department_id' => $departmentId,
            'purpose' => $validated['purpose'],
            'destination' => $validated['destination'] ?? null,
            'vehicle' => $validated['vehicle'] ?? null,
            'driver' => $validated['driver'] ?? null,
            'quantity' => $validated['quantity'] ?? 1,
            'condition_before' => $validated['condition_before'] ?? $asset->condition,
            'valid_until' => $validated['valid_until'],
            'status' => 'pending',
            'security_remarks' => collect([
                'Walk-in gate pass',
                $validated['has_account'] ? null : 'Requester: ' . ($validated['walk_in_requester_name'] ?? ''),
                empty($validated['walk_in_requester_contact']) ? null : 'Contact: ' . $validated['walk_in_requester_contact'],
                empty($validated['walk_in_notes']) ? null : 'Notes: ' . $validated['walk_in_notes'],
            ])->filter()->implode("\n"),
        ]);

        $qrPath = $this->generateQrCode($gatePass);
        $gatePass->update(['qr_code_path' => $qrPath]);

        $this->logActivity('gate_pass_walk_in_created', $gatePass, $request, [
            'walk_in_requester' => $requesterUser?->email ?? ($validated['walk_in_requester_name'] ?? null),
        ]);

        $gatePass = $gatePass->fresh()->load('asset.department', 'department', 'requester');

        return response()->json([
            'data' => $gatePass,
            'workflow' => [
                'status' => $gatePass->status,
                'next_approver_role' => 'Department Head',
                'next_approver' => $this->nextDepartmentHead($gatePass),
            ],
        ], 201);
    }

    public function show(GatePass $gatePass): JsonResponse
    {
        return response()->json($gatePass->load('asset.department', 'department', 'requester'));
    }

    public function update(Request $request, GatePass $gatePass): JsonResponse
    {
        $validated = $request->validate([
            'purpose' => ['sometimes', 'string'],
            'valid_until' => ['sometimes', 'date'],
        ]);

        $gatePass->update($validated);
        $this->logActivity('gate_pass_updated', $gatePass, $request);

        return response()->json($gatePass->fresh()->load('asset.department', 'department', 'requester'));
    }

    public function destroy(Request $request, GatePass $gatePass): JsonResponse
    {
        if ($gatePass->qr_code_path) {
            Storage::disk('public')->delete($gatePass->qr_code_path);
        }

        $gatePass->delete();
        $this->logActivity('gate_pass_deleted', $gatePass, $request);

        return response()->json(['message' => 'Gate pass deleted.']);
    }

    /**
     * Approve a gate pass
     */
    public function approve(Request $request, GatePass $gatePass): JsonResponse
    {
        if ($gatePass->status !== 'pending') {
            return response()->json(['message' => 'Only pending gate passes can be approved.'], 400);
        }

        if ($request->user()?->role === 'Department Head' && !$this->sameDepartment($request, $gatePass->department_id)) {
            return response()->json(['message' => 'Department Head approvals are limited to their own department.'], 403);
        }

        $gatePass->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
        ]);

        $this->logActivity('gate_pass_approved', $gatePass, $request);

        return response()->json([
            'data' => $gatePass->fresh()->load('asset.department', 'department', 'requester'),
            'workflow' => [
                'status' => 'approved',
                'message' => 'Gate pass fully approved.',
            ],
        ]);
    }

    public function reject(Request $request, GatePass $gatePass): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($gatePass->status !== 'pending') {
            return response()->json(['message' => 'Only pending gate passes can be rejected.'], 400);
        }

        if ($request->user()?->role === 'Department Head' && !$this->sameDepartment($request, $gatePass->department_id)) {
            return response()->json(['message' => 'Department Head approvals are limited to their own department.'], 403);
        }

        $gatePass->update([
            'status' => 'rejected',
            'approved_by' => $request->user()?->id,
            'rejection_reason' => $validated['reason'] ?? null,
        ]);

        $this->logActivity('gate_pass_rejected', $gatePass, $request);

        return response()->json($gatePass->fresh()->load('asset.department', 'department', 'requester'));
    }

    public function release(Request $request, GatePass $gatePass): JsonResponse
    {
        if ($gatePass->status !== 'approved') {
            return response()->json(['message' => 'Only approved gate passes can be released.'], 400);
        }

        $releasedGatePass = DB::transaction(function () use ($gatePass, $request) {
            $lockedGatePass = GatePass::query()
                ->whereKey($gatePass->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedGatePass->status !== 'approved') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'gate_pass' => 'This gate pass has already been released or is no longer eligible for release.',
                ]);
            }

            $asset = Asset::query()->lockForUpdate()->find($lockedGatePass->asset_id);
            if (! $asset) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'asset' => 'Gate pass asset is no longer available.',
                ]);
            }

            if (! $asset->currentAssignment()->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'asset' => 'Asset must have an active assignment before gate pass release.',
                ]);
            }

            $lockedGatePass->update([
                'status' => 'completed',
                'approved_by' => $request->user()?->id,
                'release_date' => now(),
                'returned_at' => null,
            ]);

            $asset->update([
                'status' => 'issued',
                'location' => $asset->location ?: 'Off Campus',
            ]);

            $this->logActivity('gate_pass_released', $lockedGatePass, $request);

            if (\Illuminate\Support\Facades\Schema::hasTable('transfer_notifications') && $lockedGatePass->requested_by) {
                DB::table('transfer_notifications')->insert([
                    'transfer_id' => null,
                    'recipient_id' => $lockedGatePass->requested_by,
                    'recipient_role' => 'Requester',
                    'type' => 'gate_pass_released',
                    'title' => 'Gate pass released',
                    'message' => "Gate pass {$lockedGatePass->gate_pass_number} has been released.",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $lockedGatePass->fresh()->load('asset.department', 'department', 'requester');
        });

        return response()->json([
            'data' => $releasedGatePass,
            'workflow' => [
                'status' => 'completed',
                'message' => 'Gate pass released and asset movement updated.',
            ],
        ]);
    }

    /**
     * Record gate pass return (mark as returned)
     */
    public function return(Request $request, GatePass $gatePass): JsonResponse
    {
        if ($gatePass->status !== 'approved') {
            return response()->json(['message' => 'Only approved gate passes can be returned.'], 400);
        }

        if ($request->user()?->role === 'Requester' && $gatePass->requested_by !== $request->user()?->id) {
            return response()->json(['message' => 'Requesters can only confirm receipt for their own gate passes.'], 403);
        }

        $validated = $request->validate([
            'condition_after' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged'],
            'receiving_signature' => ['nullable', 'string'],
            'security_remarks' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $photoPath = $request->hasFile('photo') ? $request->file('photo')->store('gate-pass-receipts', 'public') : null;

        $gatePass->update([
            'status' => 'returned',
            'returned_at' => now(),
            'condition_after' => $validated['condition_after'] ?? null,
            'receiving_signature' => $validated['receiving_signature'] ?? null,
            'receiving_photo_path' => $photoPath,
            'security_remarks' => $validated['security_remarks'] ?? null,
        ]);

        $assetStatus = in_array($validated['condition_after'] ?? null, ['needs_repair', 'damaged'], true)
            ? (($validated['condition_after'] ?? null) === 'damaged' ? 'damaged' : 'maintenance')
            : 'available';

        $asset = $gatePass->asset()->first();
        $gatePass->asset()->update([
            'status' => $assetStatus,
            'condition' => $validated['condition_after'] ?? optional($asset)->condition,
        ]);

        if (in_array($validated['condition_after'] ?? null, ['needs_repair', 'damaged'], true)) {
            DB::table('damage_reports')->insert([
                'asset_id' => $gatePass->asset_id,
                'department_id' => $gatePass->department_id,
                'reported_by' => $request->user()?->id,
                'severity' => ($validated['condition_after'] ?? null) === 'damaged' ? 'moderate' : 'minor',
                'description' => $validated['security_remarks'] ?? 'Damage reported while confirming requester receipt.',
                'photo_path' => $photoPath,
                'status' => 'submitted',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->logActivity('gate_pass_returned', $gatePass, $request);

        return response()->json($gatePass->fresh()->load('asset.department', 'department', 'requester'));
    }

    /**
     * Scan gate pass (check in/out)
     */
    public function scan(Request $request, GatePass $gatePass): JsonResponse
    {
        if ($gatePass->status === 'pending') {
            return response()->json(['message' => 'Gate pass must be approved before scanning.'], 400);
        }

        // Toggle status between 'approved' (released) and 'returned'
        $newStatus = $gatePass->status === 'returned' ? 'approved' : 'returned';
        $returnedAt = $newStatus === 'returned' ? now() : null;

        $gatePass->update([
            'status' => $newStatus,
            'returned_at' => $returnedAt,
        ]);

        $gatePass->asset()->update([
            'status' => $newStatus === 'returned' ? 'issued' : 'available',
        ]);

        $this->logActivity('gate_pass_scanned', $gatePass, $request, ['new_status' => $newStatus]);

        return response()->json([
            'message' => $newStatus === 'returned' ? 'Asset checked in' : 'Asset checked out',
            'gate_pass' => $gatePass->fresh()->load('asset'),
        ]);
    }

    protected function generateQrCode(GatePass $gatePass): string
    {
        $filename = "gate-passes/qr-{$gatePass->id}.txt";
        $qrContent = $gatePass->gate_pass_number;
        Storage::disk('public')->put($filename, $qrContent);

        return $filename;
    }

    protected function generateGatePassNumber(): string
    {
        $sequence = GatePass::count() + 1;
        return sprintf('GP-%s-%06d', now()->format('Y'), $sequence);
    }

    protected function departmentIdForUser(Request $request): ?int
    {
        $department = $request->user()?->department;

        if (!$department) {
            return null;
        }

        return Department::query()
            ->where('name', $department)
            ->orWhere('code', $department)
            ->value('id');
    }

    protected function sameDepartment(Request $request, ?int $departmentId): bool
    {
        return $departmentId && $departmentId === $this->departmentIdForUser($request);
    }

    protected function nextDepartmentHead(GatePass $gatePass): ?array
    {
        $departmentName = optional($gatePass->department)->name;
        $head = \App\Models\User::query()
            ->where('role', 'Department Head')
            ->when($departmentName, fn ($query) => $query->where('department', $departmentName))
            ->first();

        return $head ? [
            'id' => $head->id,
            'name' => trim("{$head->first_name} {$head->last_name}"),
            'email' => $head->email,
            'role' => $head->role,
        ] : null;
    }

    protected function logActivity(string $action, GatePass $gatePass, Request $request, array $extra = []): void
    {
        $data = [
            'action' => $action,
            'gate_pass_id' => $gatePass->id,
            'gate_pass_number' => $gatePass->gate_pass_number,
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

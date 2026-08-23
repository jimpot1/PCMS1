<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssetAssignmentController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(AssetAssignment::class, 'assignment');
    }

    public function index(Request $request): JsonResponse
    {
        $query = AssetAssignment::query()
            ->with('asset', 'assignedTo', 'assignedBy')
            ->orderBy('created_at', 'desc');

        if ($request->filled('user_id')) {
            $query->where('assigned_to', $request->input('user_id'));
        }

        if ($request->filled('asset_id')) {
            $query->where('asset_id', $request->input('asset_id'));
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'overdue') {
                $query->where('status', 'active')->whereDate('due_date', '<', now()->toDateString());
            } else {
                $query->where('status', $status);
            }
        }

        if ($request->filled('assignment_type')) {
            $query->where('assignment_type', $request->input('assignment_type'));
        }

        if ($request->filled('condition')) {
            $query->where('condition_before', $request->input('condition'));
        }

        if ($request->filled('department')) {
            $department = $request->input('department');
            $query->whereHas('assignedTo', fn ($user) => $user->where('department', 'like', "%{$department}%"));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($subquery) use ($search) {
                $subquery
                    ->whereHas('asset', fn ($asset) => $asset
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('property_number', 'like', "%{$search}%"))
                    ->orWhereHas('assignedTo', fn ($user) => $user
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%"));
            });
        }

        $perPage = $request->integer('per_page', 15);
        $results = $query->paginate($perPage);

        return response()->json($results);
    }

    public function dashboard(): JsonResponse
    {
        $assignments = AssetAssignment::query();
        $activeAssignments = AssetAssignment::where('status', 'active');
        $today = now()->toDateString();

        return response()->json([
            'total_assigned_assets' => (clone $activeAssignments)->sum('quantity'),
            'available_assets' => Asset::where('status', 'available')->count(),
            'pending_assignments' => (clone $assignments)->where('status', 'pending_acceptance')->count(),
            'returned_assets' => (clone $assignments)->where('status', 'returned')->sum('quantity'),
            'assets_due_for_return' => (clone $activeAssignments)->whereBetween('due_date', [$today, now()->addDays(7)->toDateString()])->count(),
            'overdue_assignments' => (clone $activeAssignments)->whereDate('due_date', '<', $today)->count(),
            'total_available_quantity' => Asset::query()->sum(DB::raw('COALESCE(available_quantity, quantity, 1)')),
            'recently_assigned_assets' => AssetAssignment::with('asset', 'assignedTo')->latest('assigned_at')->limit(5)->get(),
            'assignment_trends' => AssetAssignment::query()
                ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get(),
            'reminders' => $this->returnReminders(),
        ]);
    }

    public function assignees(): JsonResponse
    {
        $columns = Schema::getColumnListing('users');
        $optionalColumns = ['employee_id', 'first_name', 'middle_name', 'last_name', 'full_name', 'email', 'role', 'department', 'status'];
        $selectColumns = array_values(array_intersect(array_merge(['id'], $optionalColumns), $columns));

        $query = DB::table('users')->select($selectColumns);

        if (in_array('status', $columns, true)) {
            $query->where('status', 'active');
        }

        foreach (['last_name', 'first_name', 'email'] as $orderColumn) {
            if (in_array($orderColumn, $columns, true)) {
                $query->orderBy($orderColumn);
            }
        }

        $users = $query->get();

        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'exists:assets,id'],
            'assigned_to' => ['bail', 'required', 'uuid', 'exists:users,id'],
            'assigned_by' => ['bail', 'nullable', 'uuid', 'exists:users,id'],
            'assignment_type' => ['nullable', 'in:permanent,temporary,borrowed'],
            'assigned_at' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'purpose' => ['nullable', 'string', 'max:1000'],
            'condition_before' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'employee_signature' => ['nullable', 'string'],
            'custodian_signature' => ['nullable', 'string'],
            'accept_now' => ['nullable', 'boolean'],
            'remarks' => ['nullable', 'string'],
        ]);

        $asset = Asset::with('category', 'department')->whereKey($validated['asset_id'])->lockForUpdate()->firstOrFail();
        $employee = User::findOrFail($validated['assigned_to']);
        $quantity = (int) ($validated['quantity'] ?? 1);
        $availableQuantity = $this->availableQuantity($asset);

        if (($employee->status ?? 'active') !== 'active') {
            return response()->json(['message' => 'Selected employee is not active.'], 422);
        }

        if ($asset->status === 'maintenance') {
            return response()->json(['message' => 'Asset is currently under maintenance and cannot be assigned.'], 422);
        }

        if ($asset->condition === 'damaged' || ($validated['condition_before'] ?? $asset->condition) === 'damaged') {
            return response()->json(['message' => 'Damaged assets must be repaired before assignment.'], 422);
        }

        if ($availableQuantity < $quantity) {
            return response()->json(['message' => "Only {$availableQuantity} unit(s) are available for assignment."], 422);
        }

        if (
            AssetAssignment::where('asset_id', $asset->id)
                ->where('assigned_to', $employee->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->exists()
        ) {
            return response()->json(['message' => 'This asset is already assigned to the selected employee.'], 422);
        }

        $photoPath = $request->hasFile('photo') ? $request->file('photo')->store('assignment-photos', 'public') : null;
        $status = $request->boolean('accept_now') || ! empty($validated['employee_signature']) ? 'active' : 'pending_acceptance';

        $assignment = DB::transaction(function () use ($validated, $request, $asset, $employee, $quantity, $photoPath, $status) {
            $assignment = AssetAssignment::create([
                'asset_id' => $asset->id,
                'assigned_to' => $employee->id,
                'assigned_by' => $validated['assigned_by'] ?? optional($request->user())->id ?? null,
                'department_id' => $asset->department_id,
                'assignment_type' => $validated['assignment_type'] ?? 'permanent',
                'quantity' => $quantity,
                'purpose' => $validated['purpose'] ?? null,
                'condition_before' => $validated['condition_before'] ?? $asset->condition,
                'photo_path' => $photoPath,
                'assigned_at' => $validated['assigned_at'] ?? now(),
                'due_date' => $validated['due_date'] ?? null,
                'accepted_at' => $status === 'active' ? now() : null,
                'employee_signature' => $validated['employee_signature'] ?? null,
                'custodian_signature' => $validated['custodian_signature'] ?? null,
                'status' => $status,
                'approval_status' => 'not_required',
                'notes' => $validated['remarks'] ?? null,
            ]);

            $this->syncAssetInventory($asset->fresh(), $status === 'active' ? $assignment : null);
            $this->createAccountabilityForm($assignment, $asset, $employee);
            $this->recordHistory($assignment, 'created', $request, [
                'quantity' => $quantity,
                'status' => $status,
                'available_before' => $this->availableQuantity($asset),
            ]);
            $this->logActivity($status === 'active' ? 'asset_assigned' : 'assignment_pending_acceptance', $assignment, $request);
            $this->notifyAssignment($assignment, $status === 'active' ? 'assignment_approved' : 'new_assignment', $request);

            return $assignment;
        });

        return response()->json($assignment->fresh()->load('asset', 'assignedTo', 'assignedBy'), 201);
    }

    public function show($id): JsonResponse
    {
        $record = AssetAssignment::with('asset', 'assignedTo', 'assignedBy')->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $accountabilityForm = DB::table('accountability_forms')->where('assignment_id', $record->id)->first();
        if ($accountabilityForm) {
            $accountabilityForm->payload = json_decode($accountabilityForm->payload ?? '{}', true);
        }

        return response()->json([
            'assignment' => $record,
            'accountability_form' => $accountabilityForm,
            'history' => DB::table('assignment_history')->where('assignment_id', $record->id)->orderByDesc('created_at')->get(),
            'available_quantity' => $record->asset ? $this->availableQuantity($record->asset) : 0,
        ]);
    }

    public function accept(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'employee_signature' => ['nullable', 'string'],
        ]);

        $record = AssetAssignment::with('asset')->lockForUpdate()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($record->status !== 'pending_acceptance') {
            return response()->json(['message' => 'Only pending assignments can be accepted.'], 400);
        }

        $asset = $record->asset;
        if ($asset && $this->availableQuantity($asset) < (int) ($record->quantity ?? 1)) {
            return response()->json(['message' => 'Insufficient inventory available to accept this assignment.'], 422);
        }

        $record->update([
            'status' => 'active',
            'accepted_at' => now(),
            'employee_signature' => $validated['employee_signature'] ?? $record->employee_signature,
        ]);

        if ($record->asset) {
            $this->syncAssetInventory($record->asset->fresh(), $record);
        }
        $this->recordHistory($record, 'accepted', $request);
        $this->logActivity('assignment_accepted', $record, $request);
        $this->notifyAssignment($record, 'assignment_approved', $request);

        return response()->json($record->fresh()->load('asset', 'assignedTo', 'assignedBy'));
    }

    public function update(Request $request, $id): JsonResponse
    {
        $record = AssetAssignment::with('asset')->lockForUpdate()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! in_array($record->status, ['pending_acceptance', 'active'], true)) {
            return response()->json(['message' => 'Only pending or active assignments can be updated.'], 400);
        }

        $validated = $request->validate([
            'assignment_type' => ['sometimes', 'in:permanent,temporary,borrowed'],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'purpose' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        if (array_key_exists('quantity', $validated) && $record->asset) {
            $availableIncludingCurrent = $this->availableQuantity($record->asset) + (int) $record->quantity;
            if ((int) $validated['quantity'] > $availableIncludingCurrent) {
                return response()->json(['message' => "Only {$availableIncludingCurrent} unit(s) are available including this assignment."], 422);
            }
        }

        DB::transaction(function () use ($record, $validated, $request) {
            $record->update($validated);

            if ($record->asset) {
                $this->syncAssetInventory($record->asset->fresh(), $record->status === 'active' ? $record : null);
            }

            $this->recordHistory($record, 'updated', $request, $validated);
            $this->logActivity('asset_updated', $record, $request);
        });

        return response()->json($record->fresh()->load('asset', 'assignedTo', 'assignedBy'));
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $record = AssetAssignment::lockForUpdate()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! in_array($record->status, ['pending_acceptance', 'active'], true)) {
            return response()->json(['message' => 'Only pending or active assignments can be cancelled.'], 400);
        }

        DB::transaction(function () use ($record, $request) {
            $record->update([
                'status' => 'cancelled',
                'notes' => trim(implode("\n", array_filter([$record->notes, $request->input('reason') ? 'Cancel reason: ' . $request->input('reason') : null]))) ?: null,
            ]);

            if ($record->asset) {
                $this->syncAssetInventory($record->asset->fresh());
            }
            $this->recordHistory($record, 'cancelled', $request, ['reason' => $request->input('reason')]);
            $this->logActivity('assignment_cancelled', $record, $request);
            $this->notifyAssignment($record, 'assignment_cancelled', $request);
        });

        return response()->json($record->fresh()->load('asset', 'assignedTo', 'assignedBy'));
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $record = AssetAssignment::lockForUpdate()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! in_array($record->status, ['pending_acceptance', 'active'], true)) {
            return response()->json(['message' => 'Only pending or active assignments can be cancelled.'], 400);
        }

        DB::transaction(function () use ($record, $request) {
            $record->update([
                'status' => 'cancelled',
                'notes' => trim(implode("\n", array_filter([$record->notes, 'Cancelled through delete action.']))) ?: null,
            ]);

            if ($record->asset) {
                $this->syncAssetInventory($record->asset->fresh());
            }

            $this->recordHistory($record, 'cancelled', $request, ['reason' => 'delete_action']);
            $this->logActivity('assignment_cancelled', $record, $request);
            $this->notifyAssignment($record, 'assignment_cancelled', $request);
        });

        return response()->json(['message' => 'Assignment cancelled and history retained.']);
    }

    public function returnAssignment(Request $request, $id): JsonResponse
    {
        $record = AssetAssignment::lockForUpdate()->find($id);
        if (! $record) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (! in_array($record->status, ['active', 'pending_acceptance'], true)) {
            return response()->json(['message' => 'Only active or pending assignments can be returned.'], 400);
        }

        $validated = $request->validate([
            'condition_after' => ['nullable', 'in:excellent,good,fair,needs_repair,damaged'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($record, $request, $validated) {
            $conditionAfter = $validated['condition_after'] ?? 'good';

            $record->update([
                'status' => 'returned',
                'returned_at' => now(),
                'condition_after' => $conditionAfter,
                'return_notes' => $validated['notes'] ?? null,
                'notes' => trim(implode("\n", array_filter([$record->notes, $validated['notes'] ?? null ? "Return notes: {$validated['notes']}" : null]))) ?: null,
            ]);

            DB::table('return_records')->insert([
                'assignment_id' => $record->id,
                'asset_id' => $record->asset_id,
                'returned_by' => $record->assigned_to,
                'condition_after' => $conditionAfter,
                'inspection_notes' => $validated['notes'] ?? null,
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $asset = Asset::whereKey($record->asset_id)->lockForUpdate()->first();
            if ($asset && in_array($conditionAfter, ['needs_repair', 'damaged'], true)) {
                $asset->update([
                    'condition' => $conditionAfter,
                    'status' => $conditionAfter === 'damaged' ? 'damaged' : 'maintenance',
                    'available_quantity' => $this->availableQuantity($asset),
                    'current_holder_id' => null,
                ]);

                DB::table('damage_reports')->insert([
                    'asset_id' => $asset->id,
                    'department_id' => $asset->department_id,
                    'reported_by' => optional($request->user())->id,
                    'severity' => $conditionAfter === 'damaged' ? 'moderate' : 'minor',
                    'description' => $validated['notes'] ?? 'Condition issue found during asset return inspection.',
                    'status' => 'submitted',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } elseif ($asset) {
                $this->syncAssetInventory($asset->fresh());
            }

            $this->recordHistory($record, 'returned', $request, [
                'condition_after' => $conditionAfter,
                'notes' => $validated['notes'] ?? null,
            ]);
            $this->logActivity('asset_returned', $record, $request);
            $this->notifyAssignment($record, 'assignment_returned', $request);
        });

        return response()->json($record->fresh()->load('asset', 'assignedTo', 'assignedBy'));
    }

    public function clearanceCheck($userId): JsonResponse
    {
        $this->authorize('clearance', AssetAssignment::class);

        $activeAssignments = AssetAssignment::with('asset')
            ->where('status', 'active')
            ->where('assigned_to', $userId)
            ->get();

        $missingItems = $activeAssignments->map(function (AssetAssignment $assignment) {
            $asset = $assignment->asset;

            return [
                'assignment_id' => $assignment->id,
                'asset_id' => $asset?->id,
                'property_number' => $asset?->property_number,
                'asset_name' => $asset?->name,
                'status' => 'pending_return',
                'required_action' => 'return_asset',
                'message' => 'Asset is still active and must be checked in before clearance can be finalized.',
            ];
        })->values()->all();

        $clearanceRecord = DB::table('clearance_requests')
            ->where('user_id', $userId)
            ->latest('created_at')
            ->first();
        $accountabilityFormIds = DB::table('accountability_forms')
            ->whereIn('assignment_id', AssetAssignment::where('assigned_to', $userId)->pluck('id'))
            ->pluck('id')
            ->values()
            ->all();

        if (! $clearanceRecord) {
            $clearanceId = DB::table('clearance_requests')->insertGetId([
                'user_id' => $userId,
                'status' => empty($missingItems) ? 'cleared' : 'pending',
                'decision' => 'pending',
                'missing_items' => json_encode($missingItems),
                'verified_items' => json_encode([]),
                'accountability_form_ids' => json_encode($accountabilityFormIds),
                'notes' => null,
                'finalized_by' => null,
                'finalized_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $clearanceRecord = DB::table('clearance_requests')->where('id', $clearanceId)->first();
        } else {
            DB::table('clearance_requests')
                ->where('id', $clearanceRecord->id)
                ->update([
                    'missing_items' => json_encode($missingItems),
                    'status' => empty($missingItems) ? 'cleared' : 'pending',
                    'decision' => empty($missingItems) ? 'cleared' : 'pending',
                    'accountability_form_ids' => json_encode($accountabilityFormIds),
                    'updated_at' => now(),
                ]);

            $clearanceRecord = DB::table('clearance_requests')->where('id', $clearanceRecord->id)->first();
        }

        return response()->json([
            'data' => [
                'assignments' => $activeAssignments,
                'clearance' => [
                    'id' => $clearanceRecord?->id,
                    'user_id' => $clearanceRecord?->user_id,
                    'status' => $clearanceRecord?->status ?? 'pending',
                    'decision' => $clearanceRecord?->decision ?? 'pending',
                    'finalized_at' => $clearanceRecord?->finalized_at,
                    'finalized_by' => $clearanceRecord?->finalized_by,
                    'created_at' => $clearanceRecord?->created_at,
                    'accountability_form_ids' => json_decode($clearanceRecord?->accountability_form_ids ?? '[]', true),
                ],
                'missing_items' => $missingItems,
                'verified_items' => [],
            ],
        ]);
    }

    public function finalizeClearance(Request $request, $userId): JsonResponse
    {
        $this->authorize('clearance', AssetAssignment::class);

        $validated = $request->validate([
            'decision' => ['required', 'in:cleared,hold,partial'],
            'notes' => ['nullable', 'string'],
        ]);

        $clearanceRecord = DB::table('clearance_requests')->where('user_id', $userId)->latest('created_at')->first();
        $activeAssignments = AssetAssignment::where('assigned_to', $userId)
            ->where('status', 'active')
            ->get(['id', 'asset_id']);
        if ($validated['decision'] === 'cleared' && $activeAssignments->isNotEmpty()) {
            return response()->json([
                'message' => 'Clearance cannot be finalized while active asset assignments remain.',
                'missing_items' => $activeAssignments->pluck('id')->values(),
            ], 422);
        }

        $accountabilityFormIds = DB::table('accountability_forms')
            ->whereIn('assignment_id', AssetAssignment::where('assigned_to', $userId)->pluck('id'))
            ->pluck('id')
            ->values()
            ->all();
        $status = $validated['decision'] === 'cleared' ? 'cleared' : ($validated['decision'] === 'hold' ? 'hold' : 'partial');

        if (! $clearanceRecord) {
            $clearanceId = DB::table('clearance_requests')->insertGetId([
                'user_id' => $userId,
                'status' => $status,
                'decision' => $validated['decision'],
                'missing_items' => json_encode([]),
                'verified_items' => json_encode([]),
                'accountability_form_ids' => json_encode($accountabilityFormIds),
                'notes' => $validated['notes'] ?? null,
                'finalized_by' => optional($request->user())->id,
                'finalized_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $clearanceRecord = DB::table('clearance_requests')->where('id', $clearanceId)->first();
        } else {
            DB::table('clearance_requests')->where('id', $clearanceRecord->id)->update([
                'status' => $status,
                'decision' => $validated['decision'],
                'notes' => $validated['notes'] ?? $clearanceRecord->notes,
                'accountability_form_ids' => json_encode($accountabilityFormIds),
                'finalized_by' => optional($request->user())->id ?? $clearanceRecord->finalized_by,
                'finalized_at' => now(),
                'updated_at' => now(),
            ]);

            $clearanceRecord = DB::table('clearance_requests')->where('id', $clearanceRecord->id)->first();
        }

        DB::table('activity_logs')->insert([
            'action' => 'clearance_decision_recorded',
            'payload' => json_encode([
                'action' => 'clearance_decision_recorded',
                'clearance_id' => $clearanceRecord->id,
                'user_id' => $userId,
                'decision' => $validated['decision'],
                'status' => $status,
                'accountability_form_ids' => $accountabilityFormIds,
                'performed_by' => optional($request->user())->id,
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'clearance' => [
                    'id' => $clearanceRecord->id,
                    'user_id' => $clearanceRecord->user_id,
                    'status' => $clearanceRecord->status,
                    'decision' => $clearanceRecord->decision,
                    'finalized_at' => $clearanceRecord->finalized_at,
                    'finalized_by' => $clearanceRecord->finalized_by,
                    'notes' => $clearanceRecord->notes,
                    'accountability_form_ids' => json_decode($clearanceRecord->accountability_form_ids ?? '[]', true),
                ],
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $query = AssetAssignment::with('asset', 'assignedTo')->orderByDesc('created_at');
        $filename = 'assignment-report-' . now()->format('YmdHis') . '.csv';

        return new StreamedResponse(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Property Number', 'Asset', 'Employee', 'Department', 'Type', 'Quantity', 'Assigned Date', 'Due Date', 'Returned Date', 'Status', 'Remarks']);

            $query->cursor()->each(function ($assignment) use ($handle) {
                fputcsv($handle, [
                    optional($assignment->asset)->property_number,
                    optional($assignment->asset)->name,
                    optional($assignment->assignedTo)->full_name ?? optional($assignment->assignedTo)->email,
                    optional($assignment->assignedTo)->department,
                    $assignment->assignment_type,
                    $assignment->quantity,
                    optional($assignment->assigned_at)->toDateString(),
                    optional($assignment->due_date)->toDateString(),
                    optional($assignment->returned_at)->toDateString(),
                    $assignment->status,
                    $assignment->notes,
                ]);
            });

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function qrDetails($id): JsonResponse
    {
        $assignment = AssetAssignment::with('asset', 'assignedTo')
            ->where('id', $id)
            ->orWhereHas('asset', fn ($asset) => $asset
                ->where('property_number', $id)
                ->orWhere('asset_id', $id))
            ->latest('assigned_at')
            ->first();

        if (! $assignment) {
            return response()->json(['message' => 'Assignment or asset QR record was not found.'], 404);
        }

        $asset = $assignment->asset;
        $employee = $assignment->assignedTo;

        return response()->json([
            'property_number' => optional($asset)->property_number,
            'assigned_employee' => optional($employee)->full_name ?? optional($employee)->email,
            'department' => optional($employee)->department,
            'assignment_date' => optional($assignment->assigned_at)->toDateString(),
            'current_status' => $assignment->status,
            'warranty' => optional(optional($asset)->warranty_until)->toDateString(),
            'location' => optional($asset)->location,
            'qr_code_path' => optional($asset)->qr_code_path,
        ]);
    }

    public function employeeProfile($userId): JsonResponse
    {
        $assignments = AssetAssignment::with('asset')
            ->where('assigned_to', $userId)
            ->orderByDesc('assigned_at')
            ->get();

        return response()->json([
            'assigned_assets' => $assignments->where('status', 'active')->values(),
            'returned_assets' => $assignments->where('status', 'returned')->values(),
            'pending_returns' => $assignments->whereIn('status', ['active', 'pending_acceptance'])->whereNotNull('due_date')->values(),
            'overdue_assets' => $assignments->filter(fn ($item) => $item->status === 'active' && $item->due_date && $item->due_date->lt(now()->startOfDay()))->values(),
            'asset_value' => $assignments->where('status', 'active')->sum(fn ($item) => (float) optional($item->asset)->purchase_cost * (int) ($item->quantity ?? 1)),
            'maintenance_history' => DB::table('maintenance_records')
                ->whereIn('asset_id', $assignments->pluck('asset_id')->filter()->unique())
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(),
            'assignment_timeline' => DB::table('assignment_history')
                ->where('employee_id', $userId)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(),
        ]);
    }

    public function recommendations(Request $request): JsonResponse
    {
        $asset = $request->filled('asset_id') ? Asset::with('category')->find($request->input('asset_id')) : null;
        $employee = $request->filled('assigned_to') ? User::find($request->input('assigned_to')) : null;
        $quantity = max(1, (int) $request->input('quantity', 1));
        $items = [];

        if ($asset) {
            $available = $this->availableQuantity($asset);
            if ($available <= 3) {
                $items[] = ['type' => 'low_inventory', 'severity' => 'high', 'message' => "Low inventory warning: {$available} unit(s) remain for {$asset->name}."];
            }
            if ($quantity > max(1, floor((int) ($asset->quantity ?? 1) / 2))) {
                $items[] = ['type' => 'unusual_quantity', 'severity' => 'medium', 'message' => 'Requested quantity is unusually high for current stock.'];
            }
            if (in_array($asset->condition, ['fair', 'needs_repair'], true)) {
                $items[] = ['type' => 'risky_condition', 'severity' => 'medium', 'message' => 'Asset condition should be reviewed before assignment.'];
            }
        }

        if ($asset && $employee) {
            $duplicate = AssetAssignment::where('asset_id', $asset->id)
                ->where('assigned_to', $employee->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->exists();

            if ($duplicate) {
                $items[] = ['type' => 'duplicate_assignment', 'severity' => 'high', 'message' => 'Selected employee already has this asset assigned or pending.'];
            }

            $similarEmployees = AssetAssignment::with('assignedTo')
                ->whereHas('asset', fn ($query) => $query->where('category_id', $asset->category_id))
                ->where('assigned_to', '!=', $employee->id)
                ->whereIn('status', ['active', 'pending_acceptance'])
                ->limit(5)
                ->get()
                ->map(fn ($item) => optional($item->assignedTo)->full_name ?? optional($item->assignedTo)->email)
                ->filter()
                ->unique()
                ->values();

            if ($similarEmployees->isNotEmpty()) {
                $items[] = ['type' => 'similar_assignments', 'severity' => 'info', 'message' => 'Similar assets are assigned to: ' . $similarEmployees->implode(', ') . '.'];
            }
        }

        if ($asset) {
            $alternatives = Asset::where('id', '!=', $asset->id)
                ->when($asset->category_id, fn ($query) => $query->where('category_id', $asset->category_id))
                ->whereIn('status', ['available', 'partially_assigned'])
                ->limit(3)
                ->get(['id', 'name', 'property_number', 'available_quantity', 'quantity']);

            if ($alternatives->isNotEmpty()) {
                $items[] = ['type' => 'alternatives', 'severity' => 'info', 'message' => 'Alternative available assets: ' . $alternatives->map(fn ($item) => $item->name . ' (' . ($item->property_number ?? $item->id) . ')')->implode(', ') . '.'];
            }
        }

        return response()->json(['data' => $items]);
    }

    protected function availableQuantity(Asset $asset): int
    {
        $assigned = AssetAssignment::where('asset_id', $asset->id)
            ->where('status', 'active')
            ->sum('quantity');

        return max(0, (int) ($asset->quantity ?? 1) - (int) $assigned);
    }

    protected function syncAssetInventory(?Asset $asset, ?AssetAssignment $currentAssignment = null): void
    {
        if (! $asset) {
            return;
        }

        DB::transaction(function () use ($asset, $currentAssignment) {
            $lockedAsset = Asset::whereKey($asset->id)->lockForUpdate()->first();
            if (! $lockedAsset) {
                return;
            }

            $activeAssignments = AssetAssignment::where('asset_id', $lockedAsset->id)
                ->where('status', 'active')
                ->select('id', 'assigned_to', 'assigned_by', 'quantity', 'assigned_at')
                ->orderByDesc('accepted_at')
                ->orderByDesc('assigned_at')
                ->get();

            $assignedQuantity = (int) $activeAssignments->sum('quantity');
            $available = max(0, (int) ($lockedAsset->quantity ?? 1) - $assignedQuantity);
            $latestAssignment = $activeAssignments->first();

            $updates = [
                'available_quantity' => $available,
                'current_holder_id' => optional($latestAssignment)->assigned_to,
                'custodian_id' => $latestAssignment?->assigned_by ?? $lockedAsset->custodian_id,
                'last_assigned_at' => optional($latestAssignment)->assigned_at,
            ];

            if (! in_array($lockedAsset->status, ['maintenance', 'damaged', 'disposed'], true)) {
                $updates['status'] = $available <= 0 ? 'assigned' : 'available';
            }

            if ($currentAssignment && $currentAssignment->status === 'active') {
                $updates['current_holder_id'] = $currentAssignment->assigned_to;
                $updates['custodian_id'] = $currentAssignment->assigned_by ?? $lockedAsset->custodian_id;
                $updates['last_assigned_at'] = $currentAssignment->assigned_at ?? $lockedAsset->last_assigned_at;
            }

            $lockedAsset->update($updates);
        });
    }

    public function generateParForAssignment(AssetAssignment $assignment, Asset $asset, User $employee): void
    {
        if (DB::table('accountability_forms')->where('assignment_id', $assignment->id)->exists()) {
            return;
        }

        $employeeName = $employee->full_name ?: trim(($employee->first_name ?? '') . ' ' . ($employee->last_name ?? '')) ?: 'Employee';
        $accountabilityStatement = sprintf(
            "I, %s, acknowledge receipt of %s with property number %s and serial number %s. I understand that I am accountable for its safekeeping, proper use, and return or clearance upon request.",
            $employeeName,
            $asset->name,
            $asset->property_number ?? 'N/A',
            $asset->serial_number ?? 'N/A'
        );

        DB::table('accountability_forms')->insert([
            'assignment_id' => $assignment->id,
            'form_number' => sprintf('PAR-%s-%06d', now()->format('Y'), $assignment->id),
            'payload' => json_encode([
                'par_number' => sprintf('PAR-%s-%06d', now()->format('Y'), $assignment->id),
                'employee' => [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id,
                    'name' => $employeeName,
                    'department' => $employee->department,
                    'role' => $employee->role,
                ],
                'asset' => [
                    'id' => $asset->id,
                    'property_number' => $asset->property_number,
                    'serial_number' => $asset->serial_number,
                    'name' => $asset->name,
                    'brand' => $asset->brand,
                    'model' => $asset->model,
                    'acquisition_cost' => (float) ($asset->purchase_cost ?? 0),
                    'qr_code_path' => $asset->qr_code_path,
                    'location' => $asset->location,
                    'warranty_until' => $asset->warranty_until,
                ],
                'assignment' => [
                    'type' => $assignment->assignment_type,
                    'quantity' => $assignment->quantity,
                    'assigned_at' => $assignment->assigned_at,
                    'due_date' => $assignment->due_date,
                    'purpose' => $assignment->purpose,
                ],
                'accountability_statement' => $accountabilityStatement,
                'custodian_accountability_statement' => "Custodian acknowledges the assignment and the employee's responsibility for the proper care and return of the asset.",
            ]),
            'generated_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function createAccountabilityForm(AssetAssignment $assignment, Asset $asset, User $employee): void
    {
        $this->generateParForAssignment($assignment, $asset, $employee);
    }

    protected function recordHistory(AssetAssignment $assignment, string $eventType, Request $request, array $payload = []): void
    {
        DB::table('assignment_history')->insert([
            'assignment_id' => $assignment->id,
            'asset_id' => $assignment->asset_id,
            'employee_id' => $assignment->assigned_to,
            'event_type' => $eventType,
            'payload' => json_encode($payload),
            'performed_by' => optional($request->user())->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function logActivity(string $action, AssetAssignment $assignment, Request $request): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'assignment_id' => $assignment->id,
                'asset_id' => $assignment->asset_id,
                'assigned_to' => $assignment->assigned_to,
                'quantity' => $assignment->quantity,
                'user' => optional($request->user())->email ?? 'system',
                'ip' => $request->ip(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function notifyAssignment(AssetAssignment $assignment, string $type, Request $request): void
    {
        if (! Schema::hasTable('assignment_notifications')) {
            return;
        }

        $assignment->loadMissing('asset', 'assignedTo');
        $assetName = optional($assignment->asset)->name ?? "Asset #{$assignment->asset_id}";
        $employeeName = optional($assignment->assignedTo)->full_name ?? optional($assignment->assignedTo)->email ?? 'employee';
        $titles = [
            'new_assignment' => 'New asset assignment',
            'assignment_approved' => 'Assignment approved',
            'assignment_returned' => 'Assignment returned',
            'assignment_cancelled' => 'Assignment cancelled',
        ];

        $rows = collect([
            ['recipient_id' => $assignment->assigned_to, 'recipient_role' => 'Employee'],
            ['recipient_id' => optional($request->user())->id, 'recipient_role' => 'Property Custodian'],
            ['recipient_id' => null, 'recipient_role' => 'Department Head'],
            ['recipient_id' => null, 'recipient_role' => 'System Administrator'],
        ])->unique(fn ($row) => ($row['recipient_id'] ?? '') . '|' . ($row['recipient_role'] ?? ''))
            ->map(fn ($row) => [
                'assignment_id' => $assignment->id,
                'asset_id' => $assignment->asset_id,
                'recipient_id' => $row['recipient_id'],
                'recipient_role' => $row['recipient_role'],
                'type' => $type,
                'title' => $titles[$type] ?? 'Assignment notification',
                'message' => "{$assetName} ({$assignment->quantity} unit(s)) for {$employeeName}.",
                'created_at' => now(),
                'updated_at' => now(),
            ])->values()->all();

        DB::table('assignment_notifications')->insert($rows);
    }

    protected function returnReminders()
    {
        return AssetAssignment::with('asset', 'assignedTo')
            ->where('status', 'active')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', now()->addDays(7)->toDateString())
            ->orderBy('due_date')
            ->limit(10)
            ->get()
            ->map(function ($assignment) {
                $days = now()->startOfDay()->diffInDays($assignment->due_date, false);

                return [
                    'assignment_id' => $assignment->id,
                    'asset' => optional($assignment->asset)->name,
                    'employee' => optional($assignment->assignedTo)->full_name ?? optional($assignment->assignedTo)->email,
                    'due_date' => optional($assignment->due_date)->toDateString(),
                    'days_remaining' => $days,
                    'type' => $days < 0 ? 'overdue' : "due_in_{$days}_days",
                ];
            });
    }
}

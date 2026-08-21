<?php

namespace App\Http\Controllers;

use App\Models\AssetAssignment;
use App\Models\AssetTransfer;
use App\Models\GatePass;
use App\Models\PurchaseRequest;
use App\Models\Supply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RequesterDashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        $purchaseRequests = PurchaseRequest::with('department')->where('requested_by', $userId)->latest()->get();
        $gatePasses = GatePass::with('asset.department', 'department')->where('requested_by', $userId)->latest()->get();
        $transfers = AssetTransfer::with('asset', 'fromDepartment', 'toDepartment')->where('requested_by', $userId)->latest()->get();
        $assignments = AssetAssignment::with('asset.category', 'asset.department')->where('assigned_to', $userId)->latest()->get();

        $requests = collect()
            ->merge($purchaseRequests->where('request_type', '!=', 'request')->map(fn ($item) => $this->historyRow($item, 'Purchase Order', $item->request_number, $item->department?->name)))
            ->merge($purchaseRequests->where('request_type', 'request')->map(fn ($item) => $this->historyRow($item, 'Request Form', $item->request_number, $item->department?->name)))
            ->merge($gatePasses->map(fn ($item) => $this->historyRow($item, 'Gate Pass', $item->gate_pass_number, $item->department?->name)))
            ->merge($transfers->map(fn ($item) => $this->historyRow($item, 'Transfer Request', $item->transfer_number, $item->fromDepartment?->name)))
            ->sortByDesc('submitted_date')
            ->values();

        $stats = [
            'pending_requests' => $requests->whereIn('status', ['pending', 'transfer_requested', 'department_approved', 'ready_for_transfer'])->count(),
            'approved' => $requests->whereIn('status', ['approved', 'ready_for_transfer'])->count(),
            'rejected' => $requests->where('status', 'rejected')->count(),
            'completed' => $requests->whereIn('status', ['completed', 'released', 'transfer_completed'])->count(),
            'returned' => $gatePasses->where('status', 'returned')->count(),
            'items_waiting_for_release' => $purchaseRequests->where('status', 'approved')->count() + $gatePasses->where('status', 'approved')->count(),
        ];

        return response()->json([
            'stats' => $stats,
            'history' => $requests,
            'assigned_assets' => $assignments->whereIn('status', ['active', 'pending_acceptance'])->map(fn ($assignment) => $this->requesterAssignmentRow($assignment))->values(),
            'receivable_items' => $gatePasses->where('status', 'approved')->map(fn ($gatePass) => $this->requesterGatePassRow($gatePass))->values(),
            'notifications' => $this->notificationsForRequester($userId),
            'recommendations' => $this->recommendations($purchaseRequests, $gatePasses, $assignments),
        ]);
    }

    public function recommendationsEndpoint(Request $request): JsonResponse
    {
        $lineItems = collect($request->input('line_items', []));
        $items = [];

        $lineItems->each(function ($line) use (&$items) {
            $qty = (int) ($line['qty'] ?? $line['quantity'] ?? 0);
            $name = trim((string) ($line['item'] ?? $line['particular'] ?? ''));
            if ($name === '') {
                return;
            }

            $supply = Supply::where('name', 'like', "%{$name}%")->orWhere('sku', 'like', "%{$name}%")->first();
            if ($supply && $qty > (int) $supply->stock) {
                $items[] = ['type' => 'inventory_limit', 'severity' => 'high', 'message' => "{$name} only has {$supply->stock} unit(s) available."];
            }
            if ($qty >= 20) {
                $items[] = ['type' => 'high_quantity', 'severity' => 'medium', 'message' => "{$name} quantity is unusually high. Confirm the purpose before submission."];
            }
        });

        return response()->json(['data' => $items]);
    }

    protected function historyRow($item, string $type, ?string $reference, ?string $department): array
    {
        return [
            'id' => $type . '-' . $item->id,
            'source_id' => $item->id,
            'document_type' => $type,
            'reference_no' => $reference,
            'department' => $department ?: $item->department_name,
            'submitted_date' => optional($item->created_at)->toDateTimeString(),
            'approved_date' => optional($item->released_at ?? $item->transfer_date ?? null)->toDateTimeString(),
            'status' => $item->status,
            'current_approver' => $this->currentApprover($item),
            'remarks' => $item->rejection_reason ?? $item->reason ?? $item->purpose ?? null,
        ];
    }

    protected function currentApprover($item): string
    {
        if (isset($item->current_stage)) {
            return match ($item->current_stage) {
                'department_head' => 'Department Head',
                'recommending_approver' => 'Recommending Approver',
                'property_custodian' => 'Property Custodian',
                'president' => 'President / CEO',
                'released' => 'Completed',
                default => ucfirst(str_replace('_', ' ', (string) $item->current_stage)),
            };
        }

        return match ($item->status) {
            'pending', 'transfer_requested' => 'Department Head',
            'department_approved' => 'Property Custodian',
            'ready_for_transfer' => 'OIC / Property Custodian',
            'approved' => 'Ready for Release',
            default => ucfirst(str_replace('_', ' ', (string) $item->status)),
        };
    }

    protected function notificationsForRequester(?string $userId)
    {
        $assignmentNotices = Schema::hasTable('assignment_notifications')
            ? DB::table('assignment_notifications')->where('recipient_id', $userId)->orderByDesc('created_at')->limit(10)->get()
            : collect();

        $transferNotices = Schema::hasTable('transfer_notifications')
            ? DB::table('transfer_notifications')->where('recipient_id', $userId)->orderByDesc('created_at')->limit(10)->get()
            : collect();

        return $assignmentNotices
            ->merge($transferNotices)
            ->sortByDesc('created_at')
            ->values();
    }

    protected function recommendations($purchaseRequests, $gatePasses, $assignments): array
    {
        $items = [];
        $recentPurposes = $purchaseRequests->pluck('purpose')->filter()->duplicates();

        if ($recentPurposes->isNotEmpty()) {
            $items[] = ['type' => 'duplicate_request', 'severity' => 'medium', 'message' => 'Similar request purposes were submitted before. Review history before duplicating.'];
        }

        if ($assignments->where('status', 'active')->count() > 0) {
            $items[] = ['type' => 'assigned_assets', 'severity' => 'info', 'message' => 'Check your assigned assets before requesting new equipment.'];
        }

        $pendingCount = $purchaseRequests->where('status', 'pending')->count() + $gatePasses->where('status', 'pending')->count();
        if ($pendingCount > 0) {
            $items[] = ['type' => 'approval_time', 'severity' => 'info', 'message' => 'Pending requests usually move next through Department Head review.'];
        }

        return $items;
    }

    protected function requesterAssignmentRow(AssetAssignment $assignment): array
    {
        $asset = $assignment->asset;

        return [
            'id' => $assignment->id,
            'asset_id' => $assignment->asset_id,
            'asset_ref' => $assignment->asset_id ? Crypt::encryptString("asset:{$assignment->asset_id}") : null,
            'asset' => $asset ? [
                'id' => $asset->id,
                'name' => $asset->name,
                'property_number' => $asset->property_number,
                'asset_id' => $asset->asset_id,
                'qr_code_path' => $asset->qr_code_path,
                'serial_number' => $asset->serial_number,
                'condition' => $asset->condition,
                'warranty_until' => optional($asset->warranty_until)->toDateString(),
                'department' => $asset->department,
            ] : null,
            'item_name' => $asset?->name ?: 'Assigned item',
            'category' => optional($asset?->category)->name ?: 'Asset',
            'unit' => 'unit',
            'short_description' => optional($assignment->asset)->description,
            'status' => $assignment->status,
            'assigned_at' => optional($assignment->assigned_at)->toDateTimeString(),
            'due_date' => optional($assignment->due_date)->toDateString(),
        ];
    }

    protected function requesterGatePassRow(GatePass $gatePass): array
    {
        return [
            'id' => $gatePass->id,
            'gate_pass_number' => $gatePass->gate_pass_number,
            'item_name' => optional($gatePass->asset)->name ?: 'Approved item',
            'purpose' => $gatePass->purpose,
            'destination' => $gatePass->destination,
            'status' => $gatePass->status,
            'valid_until' => optional($gatePass->valid_until)->toDateString(),
        ];
    }
}

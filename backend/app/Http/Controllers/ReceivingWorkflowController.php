<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\Supply;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ReceivingWorkflowController extends Controller
{
    /**
     * Log goods received for a PO
     * @param Request $request
     * @param PurchaseRequest $purchaseRequest
     * @return JsonResponse
     */
    public function logReceived(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('update', $purchaseRequest);

        if ($purchaseRequest->request_type !== 'purchase_order') {
            return response()->json(['message' => 'Only purchase orders can have goods received.'], 422);
        }

        $validated = $request->validate([
            'received_quantity' => 'required|array',
            'receiving_notes' => 'nullable|string|max:1000',
            'receiving_photo_path' => 'nullable|string',
            'received_at' => 'nullable|date_format:Y-m-d H:i:s',
        ]);

        return DB::transaction(function () use ($purchaseRequest, $validated, $request) {
            $purchaseRequest->update([
                'stock_received_date' => $validated['received_at'] ?? now(),
                'received_quantity' => $validated['received_quantity'],
                'receiving_notes' => $validated['receiving_notes'],
                'receiving_photo_path' => $validated['receiving_photo_path'],
                'procurement_status' => 'received',
                'qc_status' => 'pending',
                'procurement_timeline' => $this->addTimelineEvent(
                    $purchaseRequest->procurement_timeline ?? [],
                    'Stock Received',
                    [
                        'notes' => $validated['receiving_notes'] ?? '',
                        'received_by' => $request->user()?->id,
                    ]
                ),
            ]);

            $this->logActivity('po_stock_received', $purchaseRequest, $request, [
                'receiving_notes' => $validated['receiving_notes'] ?? '',
            ]);

            // Notify PPMO staff and dependent requesters
            $this->notifyQcRequired($purchaseRequest);

            return response()->json([
                'message' => 'Stock received logged successfully. Quality control required.',
                'purchase_request' => $purchaseRequest->fresh()->toArray(),
            ]);
        });
    }

    /**
     * Perform Quality Control check
     * @param Request $request
     * @param PurchaseRequest $purchaseRequest
     * @return JsonResponse
     */
    public function performQc(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('update', $purchaseRequest);

        if ($purchaseRequest->qc_status === 'passed' || $purchaseRequest->qc_status === 'failed') {
            return response()->json(['message' => 'QC has already been completed for this PO.'], 422);
        }

        $validated = $request->validate([
            'decision' => 'required|in:passed,failed,hold',
            'qc_notes' => 'required|string|max:1000',
        ]);

        $decision = $validated['decision'];
        $userRole = $request->user()?->role ?? '';

        return DB::transaction(function () use ($purchaseRequest, $decision, $validated, $userRole, $request) {
            $purchaseRequest->update([
                'qc_status' => $decision,
                'qc_notes' => $validated['qc_notes'],
                'qc_performed_by' => $request->user()?->id,
                'qc_performed_at' => now(),
                'procurement_status' => $decision === 'passed' ? 'ready_to_release' : ($decision === 'failed' ? 'qc_failed' : 'qc_on_hold'),
                'procurement_timeline' => $this->addTimelineEvent(
                    $purchaseRequest->procurement_timeline ?? [],
                    'Quality Control ' . ucfirst($decision),
                    [
                        'decision' => $decision,
                        'notes' => $validated['qc_notes'],
                        'performed_by' => $request->user()?->id,
                    ]
                ),
            ]);

            $this->logActivity('po_qc_completed', $purchaseRequest, $request, [
                'decision' => $decision,
                'qc_notes' => $validated['qc_notes'],
            ]);

            if ($decision === 'passed') {
                // Notify dependent requesters that stock is ready
                $this->notifyReadyToRelease($purchaseRequest);
            } elseif ($decision === 'failed') {
                // Notify that QC failed - may need to return to supplier
                $this->notifyQcFailed($purchaseRequest);
            }

            return response()->json([
                'message' => "Quality control marked as {$decision}.",
                'purchase_request' => $purchaseRequest->fresh()->toArray(),
                'next_action' => $decision === 'passed' 
                    ? 'Stock ready for release. Dependent requests can now be released.'
                    : ($decision === 'failed' 
                        ? 'QC failed. Supplier contact required for return/replacement.'
                        : 'QC on hold. Awaiting further inspection or supplier response.'),
            ]);
        });
    }

    /**
     * Update stock in inventory from received PO
     * @param Request $request
     * @param PurchaseRequest $purchaseRequest
     * @return JsonResponse
     */
    public function updateStockFromPo(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorize('update', $purchaseRequest);

        if ($purchaseRequest->request_type !== 'purchase_order') {
            return response()->json(['message' => 'Only purchase orders can update stock.'], 422);
        }

        if ($purchaseRequest->qc_status !== 'passed') {
            return response()->json(['message' => 'Stock must pass QC before updating inventory.'], 422);
        }

        return DB::transaction(function () use ($purchaseRequest, $request) {
            $updates = [];
            $lineItems = $purchaseRequest->line_items ?? [];

            foreach ($lineItems as $lineItem) {
                $supplyId = $lineItem['source_id'] ?? null;
                if (!$supplyId) continue;

                $supply = Supply::find($supplyId);
                if (!$supply) continue;

                $receivedQty = (int) ($purchaseRequest->received_quantity[$supplyId] ?? ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0));
                $newStock = ((int) $supply->stock) + $receivedQty;

                $supply->update(['stock' => $newStock]);

                $updates[] = [
                    'supply_id' => $supplyId,
                    'supply_name' => $lineItem['item'] ?? $supply->name,
                    'previous_stock' => $supply->getOriginal('stock'),
                    'received_quantity' => $receivedQty,
                    'new_stock' => $newStock,
                ];
            }

            $purchaseRequest->update([
                'procurement_status' => 'completed',
                'procurement_timeline' => $this->addTimelineEvent(
                    $purchaseRequest->procurement_timeline ?? [],
                    'Stock Updated in Inventory',
                    [
                        'supplies_updated' => count($updates),
                        'performed_by' => $request->user()?->id,
                    ]
                ),
            ]);

            $this->logActivity('po_stock_updated', $purchaseRequest, $request, [
                'stock_updates' => $updates,
            ]);

            // Check if dependent PRs can now be released
            $this->checkDependentRequests($purchaseRequest);

            return response()->json([
                'message' => 'Stock updated successfully in inventory.',
                'updates' => $updates,
                'purchase_request' => $purchaseRequest->fresh()->toArray(),
            ]);
        });
    }

    /**
     * Get procurement status for a PO
     * @param PurchaseRequest $purchaseRequest
     * @return JsonResponse
     */
    public function getProcurementStatus(PurchaseRequest $purchaseRequest): JsonResponse
    {
        if ($purchaseRequest->request_type !== 'purchase_order') {
            return response()->json(['message' => 'Not a purchase order.'], 422);
        }

        // Get linked requests waiting for this PO
        $linkedRequests = PurchaseRequest::where('procurement_for_request_id', $purchaseRequest->id)
            ->select('id', 'request_number', 'status', 'current_stage', 'department_id')
            ->get();

        return response()->json([
            'procurement_request' => $purchaseRequest->only([
                'id', 'request_number', 'status', 'current_stage',
                'expected_delivery_date', 'stock_received_date',
                'qc_status', 'qc_notes', 'procurement_status',
                'line_items', 'receiving_notes', 'received_quantity',
            ]),
            'procurement_timeline' => $purchaseRequest->procurement_timeline,
            'linked_requests' => $linkedRequests,
            'summary' => [
                'status' => $purchaseRequest->procurement_status,
                'qc_status' => $purchaseRequest->qc_status,
                'dependent_requests_count' => $linkedRequests->count(),
                'days_waiting' => $purchaseRequest->created_at ? now()->diffInDays($purchaseRequest->created_at) : 0,
            ],
        ]);
    }

    /**
     * Add event to procurement timeline
     * @param array $timeline
     * @param string $stage
     * @param array $data
     * @return array
     */
    protected function addTimelineEvent(array $timeline, string $stage, array $data): array
    {
        $timeline[] = [
            'stage' => $stage,
            'timestamp' => now()->toIso8601String(),
            'data' => $data,
        ];
        return $timeline;
    }

    /**
     * Notify about QC requirement
     * @param PurchaseRequest $purchaseRequest
     * @return void
     */
    protected function notifyQcRequired(PurchaseRequest $purchaseRequest): void
    {
        if (!Schema::hasTable('transfer_notifications')) {
            return;
        }

        $ppmoStaff = User::query()
            ->where('role', 'PPMO Staff')
            ->where('status', 'active')
            ->get(['id']);

        foreach ($ppmoStaff as $staff) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $staff->id,
                'recipient_role' => 'PPMO Staff',
                'type' => 'qc_required',
                'title' => 'Quality Control Required',
                'message' => "Stock received for PO {$purchaseRequest->request_number}. Quality control check required before releasing dependent requests.",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Notify about ready to release
     * @param PurchaseRequest $purchaseRequest
     * @return void
     */
    protected function notifyReadyToRelease(PurchaseRequest $purchaseRequest): void
    {
        if (!Schema::hasTable('transfer_notifications')) {
            return;
        }

        // Notify PPMO staff
        $ppmoStaff = User::query()
            ->where('role', 'PPMO Staff')
            ->where('status', 'active')
            ->get(['id']);

        foreach ($ppmoStaff as $staff) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $staff->id,
                'recipient_role' => 'PPMO Staff',
                'type' => 'stock_ready_to_release',
                'title' => 'Stock Ready for Release',
                'message' => "PO {$purchaseRequest->request_number} passed QC. " . PurchaseRequest::where('procurement_for_request_id', $purchaseRequest->id)->count() . " request(s) are waiting for this stock.",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Notify if QC failed
     * @param PurchaseRequest $purchaseRequest
     * @return void
     */
    protected function notifyQcFailed(PurchaseRequest $purchaseRequest): void
    {
        if (!Schema::hasTable('transfer_notifications')) {
            return;
        }

        $ppmoStaff = User::query()
            ->where('role', 'PPMO Staff')
            ->where('status', 'active')
            ->get(['id']);

        foreach ($ppmoStaff as $staff) {
            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'recipient_id' => $staff->id,
                'recipient_role' => 'PPMO Staff',
                'type' => 'qc_failed',
                'title' => 'Quality Control Failed',
                'message' => "PO {$purchaseRequest->request_number} failed QC. Supplier contact required for return or replacement.",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Check if dependent requests can be released
     * @param PurchaseRequest $procurementPr
     * @return void
     */
    protected function checkDependentRequests(PurchaseRequest $procurementPr): void
    {
        $dependentRequests = PurchaseRequest::where('procurement_for_request_id', $procurementPr->id)
            ->where('current_stage', 'ppmo_staff')
            ->where('status', 'approved')
            ->get();

        foreach ($dependentRequests as $request) {
            // Check if stock is now sufficient
            $supplyLines = collect($request->line_items ?? [])
                ->filter(fn ($lineItem) => ($lineItem['source_type'] ?? $lineItem['type'] ?? null) === 'supply');

            $canRelease = $supplyLines->isNotEmpty()
                && $supplyLines->every(function ($lineItem) {
                    $supply = Supply::find($lineItem['source_id'] ?? null);
                    $quantity = (int) ($lineItem['qty'] ?? $lineItem['quantity'] ?? 0);
                    return $supply && (int) $supply->stock >= $quantity;
                });

            if ($canRelease && !Schema::hasTable('transfer_notifications')) {
                return;
            }

            if ($canRelease) {
                // Notify PPMO staff that this request is now releasable
                $ppmoStaff = User::query()
                    ->where('role', 'PPMO Staff')
                    ->where('status', 'active')
                    ->get(['id']);

                foreach ($ppmoStaff as $staff) {
                    DB::table('transfer_notifications')->insert([
                        'transfer_id' => null,
                        'recipient_id' => $staff->id,
                        'recipient_role' => 'PPMO Staff',
                        'type' => 'request_ready_to_release',
                        'title' => 'Request Ready for Release',
                        'message' => "Request {$request->request_number} is now ready to release. Stock is in inventory from PO {$procurementPr->request_number}.",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
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

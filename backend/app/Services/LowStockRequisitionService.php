<?php

namespace App\Services;

use App\Http\Controllers\SystemSettingController;
use App\Models\Department;
use App\Models\PurchaseRequest;
use App\Models\Supply;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LowStockRequisitionService
{
    /**
     * Creates one procurement request per low-stock incident. The request uses
     * the normal P8 approval workflow, so it is visible to the same approvers
     * and no stock is changed until procurement is fulfilled.
     */
    public function sync(Supply $supply): ?PurchaseRequest
    {
        $this->syncLowStockAlert($supply);

        if (! SystemSettingController::bool('low_stock_auto_requisition_enabled', true)) {
            return null;
        }

        if (! $supply->department_id || ! Schema::hasColumn('purchase_requests', 'replenishment_supply_id')) {
            return null;
        }

        if ((int) $supply->stock > (int) $supply->minimum_stock) {
            $this->cancelUnneededRequests($supply);

            return null;
        }

        $activeRequest = PurchaseRequest::query()
            ->where('replenishment_supply_id', $supply->id)
            ->whereIn('status', ['pending', 'revision_requested', 'approved'])
            ->lockForUpdate()
            ->first();

        if ($activeRequest) {
            return $activeRequest;
        }

        $department = Department::find($supply->department_id);
        if (! $department) {
            return null;
        }

        // The minimum level is the only replenishment rule currently stored.
        // Ordering the shortage plus one unit makes the item healthy again.
        $quantity = max(1, ((int) $supply->minimum_stock + 1) - (int) $supply->stock);
        $amount = round($quantity * (float) $supply->unit_price, 2);

        $purchaseRequest = PurchaseRequest::create([
            'request_number' => $this->generateRequestNumber(),
            'requested_by' => null,
            'department_id' => $department->id,
            'replenishment_supply_id' => $supply->id,
            'auto_generated' => true,
            'current_stage' => 'department_head',
            'status' => 'pending',
            'request_type' => 'purchase_order',
            'workflow_destination' => 'purchase_workflow',
            'department_name' => $department->name,
            'unit' => $supply->unit,
            'priority' => 'urgent',
            'purpose' => "Automatic replenishment: {$supply->name} reached its minimum stock level.",
            'requested_by_name' => 'PCMS Low-Stock Monitor',
            'line_items' => [[
                'type' => 'supply',
                'source_type' => 'supply',
                'source_id' => $supply->id,
                'source_ref' => $supply->sku,
                'item' => $supply->name,
                'particular' => $supply->name,
                'qty' => $quantity,
                'quantity' => $quantity,
                'unit' => $supply->unit,
                'unit_price' => (float) $supply->unit_price,
                'amount' => $amount,
                'remarks' => "Auto-generated at {$supply->stock} {$supply->unit}; minimum stock is {$supply->minimum_stock}.",
            ]],
            'timeline' => [[
                'stage' => 'Submitted',
                'status' => 'submitted',
                'performed_by' => null,
                'timestamp' => now()->toIso8601String(),
                'note' => 'Automatically generated from a low-stock alert.',
            ], [
                'stage' => 'Department Head',
                'status' => 'pending',
                'timestamp' => null,
            ], [
                'stage' => 'Recommending Approver',
                'status' => 'pending',
                'timestamp' => null,
            ], [
                'stage' => 'President/CEO',
                'status' => 'pending',
                'timestamp' => null,
            ], [
                'stage' => 'Property Custodian',
                'status' => 'pending',
                'timestamp' => null,
            ]],
            'total_amount' => $amount,
        ]);

        $this->log('low_stock_requisition_created', $supply, $purchaseRequest);
        $this->notifyDepartmentHead($department, $purchaseRequest, $supply);

        return $purchaseRequest;
    }

    private function cancelUnneededRequests(Supply $supply): void
    {
        $requests = PurchaseRequest::query()
            ->where('replenishment_supply_id', $supply->id)
            ->where('auto_generated', true)
            ->whereIn('status', ['pending', 'revision_requested'])
            ->lockForUpdate()
            ->get();

        foreach ($requests as $request) {
            $request->update([
                'status' => 'cancelled',
                'current_stage' => 'cancelled',
                'rejection_reason' => 'Automatically cancelled because the supply was restocked above its minimum level.',
            ]);
            $this->log('low_stock_requisition_cancelled', $supply, $request);
        }
    }

    private function syncLowStockAlert(Supply $supply): void
    {
        if ((int) $supply->stock <= (int) $supply->minimum_stock) {
            $exists = DB::table('anomaly_alerts')
                ->where('source_type', 'low_stock')
                ->where('source_id', (string) $supply->id)
                ->where('status', 'open')
                ->exists();

            if (! $exists) {
                DB::table('anomaly_alerts')->insert([
                    'source_type' => 'low_stock',
                    'source_id' => (string) $supply->id,
                    'risk_score' => 8.5,
                    'priority' => 'high',
                    'reason' => "{$supply->name} is below minimum stock ({$supply->stock}/{$supply->minimum_stock})",
                    'recommended_action' => 'Reorder supply immediately',
                    'status' => 'open',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return;
        }

        DB::table('anomaly_alerts')
            ->where('source_type', 'low_stock')
            ->where('source_id', (string) $supply->id)
            ->where('status', 'open')
            ->update([
                'status' => 'resolved',
                'recommended_action' => 'Stock level is back above the configured minimum.',
                'updated_at' => now(),
            ]);
    }

    private function generateRequestNumber(): string
    {
        do {
            $number = sprintf('PR-%s-LS-%06d', now()->format('Y'), (PurchaseRequest::max('id') ?? 0) + 1);
        } while (PurchaseRequest::where('request_number', $number)->exists());

        return $number;
    }

    private function notifyDepartmentHead(Department $department, PurchaseRequest $request, Supply $supply): void
    {
        if (! $department->head_user_id || ! Schema::hasTable('transfer_notifications')) {
            return;
        }

        DB::table('transfer_notifications')->insert([
            'transfer_id' => null,
            'recipient_id' => $department->head_user_id,
            'recipient_role' => 'Department Head',
            'type' => 'low_stock_requisition',
            'title' => 'Low-Stock Requisition Awaiting Review',
            'message' => "{$supply->name} is at {$supply->stock} {$supply->unit}. Auto-generated request {$request->request_number} is awaiting review.",
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function log(string $action, Supply $supply, PurchaseRequest $request): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'supply_id' => $supply->id,
                'purchase_request_id' => $request->id,
                'request_number' => $request->request_number,
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

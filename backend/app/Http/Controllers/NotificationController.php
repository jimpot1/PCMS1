<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRecord;
use App\Models\PhysicalAudit;
use App\Models\Supply;
use App\Services\RepairFrequencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class NotificationController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $this->recipientNotifications($user)
            ->sortByDesc(fn ($n) => strtotime((string) $n['time']))
            ->values();
        $unreadCount = $notifications->where('read', false)->count();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        if (Schema::hasTable('assignment_notifications')) {
            DB::table('assignment_notifications')
                ->where(function ($query) use ($user) {
                    $this->notificationRecipientQuery($query, $user);
                })
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        if (Schema::hasTable('transfer_notifications')) {
            DB::table('transfer_notifications')
                ->where(function ($query) use ($user) {
                    $this->notificationRecipientQuery($query, $user);
                })
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function markAsRead(Request $request, string $source, int $id): JsonResponse
    {
        $user = $request->user();

        $table = $source === 'assignment' ? 'assignment_notifications' : 'transfer_notifications';

        if (! Schema::hasTable($table)) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $updated = DB::table($table)
            ->where('id', $id)
            ->where(function ($query) use ($user) {
                $this->notificationRecipientQuery($query, $user);
            })
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if (! $updated) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        return response()->json(['message' => 'Notification marked as read.']);
    }

    protected function recipientNotifications($user)
    {
        $notifications = collect();

        if (Schema::hasTable('assignment_notifications')) {
            $notifications = $notifications->merge($this->assignmentNotifications($user));
        }

        if (Schema::hasTable('transfer_notifications')) {
            $notifications = $notifications->merge($this->transferNotifications($user));
        }

        // Operational alerts (anomalies, low stock, maintenance, audits) are
        // not part of the approval chain's per-recipient tables above, so
        // they're filtered by role here instead of by recipient_id.
        try {
            $notifications = $notifications->merge($this->globalNotifications($user));
        } catch (\Throwable $exception) {
            Log::error('Optional notification sources failed', [
                'user_id' => $user?->id,
                'role' => $user?->role,
                'error' => $exception->getMessage(),
            ]);
        }

        return $notifications->sortByDesc(fn ($n) => strtotime((string) $n['time']))->values();
    }

    /**
     * Roles responsible for day-to-day inventory operations (stock levels,
     * asset condition, physical audits). Approval-chain roles (Department
     * Head, Recommending Approver, President) and the Requester only see
     * notifications tied to their own step in the approval workflow, which
     * are already delivered via assignment_notifications / transfer_notifications
     * with an explicit recipient_id — so they're deliberately excluded here.
     */
    /**
     * Inventory operations roles see operational alerts (anomalies, low
     * stock, maintenance, audits) in the bell. Approval-chain roles and the
     * Requester only see notifications tied to their workflow step.
     */
    protected function inventoryOperationsRoles(): array
    {
        return ['System Administrator', 'PPMO Staff', 'OIC'];
    }

    protected function notificationRecipientQuery($query, $user)
    {
        if ($user?->role === 'System Administrator') {
            return $query->where('recipient_id', $user->id)
                ->orWhere('recipient_role', 'System Administrator');
        }

        return $query->where('recipient_id', $user?->id);
    }

    protected function addRecipientFilter($query, $user)
    {
        return $this->notificationRecipientQuery($query, $user);
    }

    protected function assignmentNotifications($user)
    {
        $query = DB::table('assignment_notifications');
        $this->notificationRecipientQuery($query, $user);

        return $query
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($notice) use ($user) {
                return [
                    'id' => $notice->id,
                    'source' => 'assignment',
                    'type' => $notice->type,
                    'title' => $notice->title,
                    'message' => $notice->message,
                    'time' => $this->formatTime($notice->created_at),
                    'created_at' => $this->formatTime($notice->created_at),
                    'urgent' => in_array($notice->type, ['new_assignment', 'due_date_reminder', 'overdue_reminder'], true),
                    'read' => ! is_null($notice->read_at),
                ];
            });
    }

    protected function transferNotifications($user)
    {
        $query = DB::table('transfer_notifications');
        $this->notificationRecipientQuery($query, $user);

        return $query
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($notice) use ($user) {
                return [
                    'id' => $notice->id,
                    'source' => 'transfer',
                    'type' => $notice->type,
                    'title' => $notice->title,
                    'message' => $notice->message,
                    'anomaly_id' => $notice->anomaly_alert_id ?? null,
                    'url' => $this->notificationUrl($notice, $user),
                    'time' => $this->formatTime($notice->created_at),
                    'created_at' => $this->formatTime($notice->created_at),
                    'urgent' => in_array($notice->type, ['pending_approval', 'temporary_transfer_due', 'maintenance_overdue', 'maintenance_due_today'], true),
                    'read' => ! is_null($notice->read_at),
                ];
            });
    }

    protected function globalNotifications($user)
    {
        $notifications = collect();

        // Purchase-request "waiting for review" alerts are intentionally NOT
        // duplicated here: PurchaseRequestController already notifies the
        // exact next approver (Department Head -> Recommending Approver ->
        // President -> Property Custodian) via transfer_notifications with a
        // specific recipient_id per stage. Broadcasting a second, unscoped
        // copy here would leak pending approvals to roles that aren't part
        // of that step.

        if (! in_array($user?->role, $this->inventoryOperationsRoles(), true)) {
            return $notifications;
        }

        DB::table('anomaly_alerts')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->each(function ($anomaly) use (&$notifications, $user) {
                $alreadyNotified = Schema::hasColumn('transfer_notifications', 'anomaly_alert_id')
                    && DB::table('transfer_notifications')
                        ->where('anomaly_alert_id', $anomaly->id)
                        ->where('recipient_id', $user?->id)
                        ->exists();

                if ($alreadyNotified) {
                    return;
                }

                $title = match ($anomaly->source_type) {
                    'low_stock' => 'Low Stock Anomaly',
                    'requester_frequency_anomaly' => 'Requester Frequency Alert',
                    'quantity_anomaly' => 'AI Anomaly Alert',
                    'untracked_transfer' => 'Untracked Transfer Alert',
                    'repeat_repair' => 'Repeat Repair Alert',
                    default => 'Inventory Anomaly Alert',
                };
                $monitoringUrl = $user?->role === 'System Administrator'
                    ? '/?anomaly=' . $anomaly->id
                    : '/ppmo/monitoring?anomaly=' . $anomaly->id;

                $notifications->push([
                    'id' => "global-anomaly-{$anomaly->id}",
                    'source' => 'global',
                    'type' => 'anomaly',
                    'title' => $title,
                    'message' => $anomaly->reason ?: ($anomaly->recommended_action ?: 'An inventory anomaly requires review.'),
                    'anomaly_id' => $anomaly->id,
                    'url' => $monitoringUrl,
                    'time' => $this->formatTime($anomaly->created_at),
                    'created_at' => $this->formatTime($anomaly->created_at),
                    'urgent' => in_array($anomaly->priority, ['high', 'critical'], true),
                    'read' => true,
                ]);
            });

        MaintenanceRecord::where('status', 'scheduled')
            ->whereBetween('scheduled_at', [now(), now()->addDays(7)])
            ->with('asset')
            ->limit(5)
            ->get()
            ->each(function ($record) use (&$notifications) {
                $assetName = optional($record->asset)->name ?? "Asset #{$record->asset_id}";
                $notifications->push([
                    'id' => "global-maintenance-{$record->id}",
                    'source' => 'global',
                    'type' => 'maintenance',
                    'title' => 'Maintenance reminder',
                    'message' => "{$assetName} is scheduled for {$record->type} on " . optional($record->scheduled_at)->format('M j') . '.',
                    'time' => $this->formatTime($record->scheduled_at),
                    'created_at' => $this->formatTime($record->scheduled_at),
                    'urgent' => false,
                    'read' => true,
                ]);
            });

        collect(RepairFrequencyService::dueSoon(7))
            ->each(function ($prediction) use (&$notifications) {
                $notifications->push([
                    'id' => "global-predicted-maintenance-{$prediction['asset']->id}-{$prediction['predicted_date']->format('Ymd')}",
                    'source' => 'global',
                    'type' => 'predicted_maintenance',
                    'title' => $prediction['is_overdue'] ? 'Maintenance overdue' : 'Maintenance likely due soon',
                    'message' => "{$prediction['asset']->name} is " . ($prediction['is_overdue'] ? 'overdue for' : 'projected to need') . ' maintenance around ' . $prediction['predicted_date']->format('M j') . " (based on a {$prediction['avg_interval_days']}-day repair pattern).",
                    'time' => $this->formatTime($prediction['last_completed_at']),
                    'created_at' => $this->formatTime($prediction['last_completed_at']),
                    'urgent' => $prediction['is_overdue'],
                    'read' => true,
                ]);
            });

        Supply::whereColumn('stock', '<=', 'minimum_stock')
            ->limit(5)
            ->get()
            ->each(function ($supply) use (&$notifications) {
                $notifications->push([
                    'id' => "global-low-stock-{$supply->id}",
                    'source' => 'global',
                    'type' => 'low_stock',
                    'title' => 'Low stock warning',
                    'message' => "{$supply->name} is below minimum stock ({$supply->stock}/{$supply->minimum_stock}).",
                    'time' => $this->formatTime($supply->updated_at),
                    'created_at' => $this->formatTime($supply->updated_at),
                    'urgent' => true,
                    'read' => true,
                ]);
            });

        PhysicalAudit::where('status', 'completed')
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->each(function ($audit) use (&$notifications) {
                $notifications->push([
                    'id' => "global-audit-{$audit->id}",
                    'source' => 'global',
                    'type' => 'audit',
                    'title' => 'Audit completed',
                    'message' => "{$audit->area} audit generated a report.",
                    'time' => $this->formatTime($audit->updated_at),
                    'created_at' => $this->formatTime($audit->updated_at),
                    'urgent' => false,
                    'read' => true,
                ]);
            });

        DB::table('ocr_scans')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get()
            ->each(function ($scan) use (&$notifications) {
                $notifications->push([
                    'id' => "global-ocr-{$scan->id}",
                    'source' => 'global',
                    'type' => 'ocr',
                    'title' => 'OCR scan received',
                    'message' => 'Asset label image processed with ' . round($scan->confidence_score) . '% confidence.',
                    'time' => $this->formatTime($scan->created_at),
                    'created_at' => $this->formatTime($scan->created_at),
                    'urgent' => false,
                    'read' => true,
                ]);
            });

        return $notifications
            ->map(function (array $notification) use ($user) {
                if (empty($notification['url'])) {
                    $notification['url'] = $this->notificationUrl((object) $notification, $user);
                }

                return $notification;
            })
            ->values();
    }

    protected function formatTime($value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (! $value) {
            return null;
        }

        $timestamp = strtotime((string) $value);

        return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
    }

    protected function notificationUrl($notice, $user = null): ?string
    {
        $type = $notice->type ?? null;
        $anomalyId = $notice->anomaly_alert_id ?? $notice->anomaly_id ?? null;

        if ($type === 'anomaly' && ! empty($anomalyId)) {
            return $user?->role === 'System Administrator'
                ? '/?anomaly=' . $anomalyId
                : ($user?->role === 'PPMO Staff'
                    ? '/ppmo/monitoring?anomaly=' . $anomalyId
                    : '/oic/monitoring?anomaly=' . $anomalyId);
        }

        if (! empty($notice->navigation_target) && ! str_starts_with((string) $notice->navigation_target, 'inventory-monitoring:')) {
            return $notice->navigation_target;
        }

        if ($user?->role === 'System Administrator') {
            $adminPage = match ($type) {
                'low_stock', 'supply_released' => 'supplies',
                'request_submitted', 'pending_approval' => 'purchases',
                'maintenance', 'maintenance_due_today', 'maintenance_overdue', 'predicted_maintenance' => 'maintenance',
                'audit' => 'audit',
                'ocr' => 'ocr',
                default => 'notifications',
            };

            return '/?page=' . $adminPage;
        }

        return match ($type) {
            'low_stock', 'supply_released' => $user?->role === 'PPMO Staff' ? '/ppmo/supplies' : '/oic/monitoring',
            'request_submitted', 'pending_approval' => match ($user?->role) {
                'Department Head' => '/department-head/pending-approvals',
                'Recommending Approver' => '/recommending-approver/review-queue',
                'President', 'CEO' => '/president/approvals',
                'Property Custodian', 'OIC' => '/oic/approvals',
                'PPMO Staff' => '/ppmo/approved-release-queue',
                default => '/requester',
            },
            'procurement_required', 'low_stock_requisition' => '/ppmo/purchases',
            'request_released', 'request_status_update', 'request_rejected' => '/requester',
            'maintenance', 'maintenance_due_today', 'maintenance_overdue', 'predicted_maintenance' => $user?->role === 'PPMO Staff' ? '/ppmo/maintenance' : '/oic/monitoring',
            'audit' => $user?->role === 'PPMO Staff' ? '/ppmo/audit' : '/oic/audit',
            'ocr' => '/ppmo/ocr',
            default => '/notifications',
        };
    }
}

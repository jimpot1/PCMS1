<?php

namespace App\Console\Commands;

use App\Models\MaintenanceRecord;
use App\Models\User;
use App\Http\Controllers\SystemSettingController;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SendMaintenanceReminders extends Command
{
    protected $signature = 'maintenance:send-reminders';

    protected $description = 'Send one actionable notification for maintenance due soon or overdue';

    public function handle(): int
    {
        if (! Schema::hasTable('transfer_notifications')) {
            $this->warn('Notification table is unavailable.');

            return self::SUCCESS;
        }

        $recipients = User::query()
            ->where('status', 'active')
            ->whereIn('role', ['System Administrator', 'PPMO Staff', 'Property Custodian', 'OIC'])
            ->get(['id', 'role']);

        if ($recipients->isEmpty()) {
            return self::SUCCESS;
        }

        $created = 0;
        MaintenanceRecord::query()
            ->with('asset:id,name,property_number')
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now()->addDays(SystemSettingController::integer('maintenance_reminder_days', 7))->endOfDay())
            ->orderBy('scheduled_at')
            ->each(function (MaintenanceRecord $record) use ($recipients, &$created) {
                $reminder = $this->reminderFor($record);
                if (! $reminder) {
                    return;
                }

                $assetName = $record->asset?->name ?? "Asset #{$record->asset_id}";
                $propertyNumber = $record->asset?->property_number;
                $assetLabel = $propertyNumber ? "{$assetName} ({$propertyNumber})" : $assetName;
                $target = "/ppmo/maintenance?record={$record->id}&reminder={$reminder['type']}";

                foreach ($recipients as $recipient) {
                    $exists = DB::table('transfer_notifications')
                        ->where('recipient_id', $recipient->id)
                        ->where('type', $reminder['type'])
                        ->when(
                            Schema::hasColumn('transfer_notifications', 'navigation_target'),
                            fn ($query) => $query->where('navigation_target', $target),
                            fn ($query) => $query->where('message', 'like', "%[Maintenance #{$record->id}]%"),
                        )
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    $notification = [
                        'transfer_id' => null,
                        'recipient_id' => $recipient->id,
                        'recipient_role' => $recipient->role,
                        'type' => $reminder['type'],
                        'title' => $reminder['title'],
                        'message' => "{$assetLabel} {$reminder['message']} [Maintenance #{$record->id}]",
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    if (Schema::hasColumn('transfer_notifications', 'navigation_target')) {
                        $notification['navigation_target'] = $target;
                    }

                    DB::table('transfer_notifications')->insert($notification);
                    $created++;
                }
            });

        DB::table('activity_logs')->insert([
            'action' => 'maintenance_reminders_sent',
            'payload' => json_encode([
                'action' => 'maintenance_reminders_sent',
                'notifications_created' => $created,
                'user' => 'system (scheduled)',
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->info("Maintenance notifications created: {$created}.");

        return self::SUCCESS;
    }

    private function reminderFor(MaintenanceRecord $record): ?array
    {
        $scheduledAt = Carbon::parse($record->scheduled_at)->startOfDay();
        $daysUntilDue = now()->startOfDay()->diffInDays($scheduledAt, false);

        if ($daysUntilDue < 0) {
            return [
                'type' => 'maintenance_overdue',
                'title' => 'Maintenance overdue',
                'message' => "is overdue for {$record->type} maintenance (scheduled {$scheduledAt->format('M j, Y')}).",
            ];
        }

        if ($daysUntilDue === 0) {
            return [
                'type' => 'maintenance_due_today',
                'title' => 'Maintenance due today',
                'message' => "is due today for {$record->type} maintenance.",
            ];
        }

        if (in_array($daysUntilDue, [1, 3, 7], true)) {
            return [
                'type' => "maintenance_due_in_{$daysUntilDue}_days",
                'title' => 'Maintenance reminder',
                'message' => "is scheduled for {$record->type} maintenance in {$daysUntilDue} day(s) ({$scheduledAt->format('M j, Y')}).",
            ];
        }

        return null;
    }
}

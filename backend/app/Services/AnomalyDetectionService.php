<?php

namespace App\Services;

use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AnomalyDetectionService
{
    private const QUANTITY_ANOMALY_THRESHOLD = 2;
    private const REQUESTER_FREQUENCY_THRESHOLD = 2; // Z-score threshold for frequency anomalies

    /**
     * Detect when a requester has an unusually high number of requests
     */
    public static function detectRequesterFrequencyAnomaly($requesterId, $supplyId, $departmentId): ?int
    {
        // Get last 30 days of requests for this requester
        $recentRequests = DB::table('purchase_requests')
            ->where('requested_by', $requesterId)
            ->where('supply_id', $supplyId)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        // Get historical requests over the past 6 months (excluding the last 30 days)
        $historicalRequests = DB::table('purchase_requests')
            ->where('requested_by', $requesterId)
            ->where('supply_id', $supplyId)
            ->where('created_at', '>=', now()->subDays(210))
            ->where('created_at', '<', now()->subDays(30))
            ->count();

        $requester = DB::table('users')->find($requesterId);
        $supply = DB::table('supplies')->find($supplyId);

        // Need at least some historical data to detect anomaly
        if ($historicalRequests < 2) {
            return null;
        }

        // Calculate average requests per month
        $monthsOfHistory = 6;
        $avgMonthlyRequests = $historicalRequests / $monthsOfHistory;

        // Current 30 days is roughly 1 month
        $currentMonthlyEquivalent = $recentRequests;

        // Simple z-score calculation (simplified for frequency)
        $stddev = max(1, sqrt($avgMonthlyRequests)); // At least 1 to avoid division issues
        $zScore = abs(($currentMonthlyEquivalent - $avgMonthlyRequests) / $stddev);

        // Flag if z-score > 2 (unusual frequency)
        if ($zScore > self::REQUESTER_FREQUENCY_THRESHOLD && $currentMonthlyEquivalent > $avgMonthlyRequests) {
            $context = [
                'requester_id' => $requesterId,
                'requester_name' => $requester->name ?? "User {$requesterId}",
                'supply_id' => $supplyId,
                'supply_name' => $supply->name ?? "Supply {$supplyId}",
                'department_id' => $departmentId,
                'recent_requests_30days' => $recentRequests,
                'average_monthly_requests' => round($avgMonthlyRequests, 2),
                'request_frequency_z_score' => round($zScore, 2),
                'months_of_history' => $monthsOfHistory,
            ];

            $reason = sprintf(
                'Requester %s (%s) requested %s %d times in 30 days (historical average: %.1f/month)',
                $requester->name ?? $requesterId,
                $requesterId,
                $supply->name ?? $supplyId,
                $recentRequests,
                $avgMonthlyRequests
            );

            $existingId = self::findOpenRequesterFrequencyAnomalyId($requesterId, $supplyId);

            if ($existingId) {
                DB::table('anomaly_alerts')
                    ->where('id', $existingId)
                    ->update([
                        'risk_score' => 5.0,
                        'priority' => 'medium',
                        'reason' => $reason,
                        'recommended_action' => 'Review requester behavior and usage patterns',
                        'request_count' => $recentRequests,
                        'request_frequency_context' => json_encode($context),
                        'ai_explanation_status' => DB::raw("case when ai_explanation is null then 'pending' else ai_explanation_status end"),
                        'updated_at' => now(),
                    ]);

                return $existingId;
            }

            $anomalyId = DB::table('anomaly_alerts')->insertGetId([
                'source_type' => 'requester_frequency_anomaly',
                'source_id' => (string)$requesterId,
                'requester_id' => $requesterId,
                'supply_id' => $supplyId,
                'department_id' => $departmentId,
                'risk_score' => 5.0,
                'priority' => 'medium',
                'reason' => $reason,
                'recommended_action' => 'Review requester behavior and usage patterns',
                'request_count' => $recentRequests,
                'request_frequency_context' => json_encode($context),
                'ai_explanation_status' => 'pending',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            self::notifyFrequencyAnomaly($anomalyId, $context);

            return $anomalyId;
        }

        return null;
    }

    /**
     * Detect when an asset is physically found in a different department than recorded
     */
    public static function detectUntrackedTransfer($assetId, $physicallyFoundDepartmentId): void
    {
        $asset = DB::table('assets')->find($assetId);
        
        if (!$asset || $asset->department_id == $physicallyFoundDepartmentId) {
            return;
        }

        // Insert anomaly alert for untracked transfer
        DB::table('anomaly_alerts')->insert([
            'source_type' => 'untracked_transfer',
            'source_id' => (string)$assetId,
            'found_department_id' => $physicallyFoundDepartmentId,
            'risk_score' => 7.5,
            'priority' => 'high',
            'reason' => "Asset #{$assetId} found in department {$physicallyFoundDepartmentId} but recorded in department {$asset->department_id}",
            'recommended_action' => 'Review asset location and update department record if transfer is authorized',
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Detect if current stock movement quantity is anomalous for a department
     */
   public static function detectQuantityAnomaly($departmentId, $supplyId, $currentQuantity, $excludeMovementId = null): ?int
{
    $movements = StockMovement::where('department_id', $departmentId)
        ->where('supply_id', $supplyId)          // ADD THIS LINE
        ->where('movement_type', 'out')
        ->when($excludeMovementId, fn ($query, $value) => $query->where('id', '!=', $value))
        ->pluck('quantity')
        ->toArray();
   

    if (count($movements) < 3) {
        return null; // Need at least 3 data points for meaningful z-score
    }

    // Calculate mean and standard deviation
    $mean = array_sum($movements) / count($movements);
    $variance = 0;

    foreach ($movements as $value) {
        $variance += pow($value - $mean, 2);
    }

    $stddev = sqrt($variance / count($movements));

    // If standard deviation is 0, can't compute z-score
    if ($stddev == 0) {
        return null;
    }

    // Calculate z-score for current quantity
    $zScore = abs(($currentQuantity - $mean) / $stddev);

    // Flag if z-score > 2 (approximately 95th percentile)
    if ($zScore > self::QUANTITY_ANOMALY_THRESHOLD) {
        $department = DB::table('departments')->find($departmentId);
        $supply = DB::table('supplies')->find($supplyId);
        $spikeThreshold = (int) ceil($mean + (self::QUANTITY_ANOMALY_THRESHOLD * $stddev));
        $similarRecentSpikes = StockMovement::where('department_id', $departmentId)
            ->where('supply_id', $supplyId)
            ->where('movement_type', 'out')
            ->when($excludeMovementId, fn ($query, $value) => $query->where('id', '!=', $value))
            ->where('quantity', '>=', $spikeThreshold)
            ->where('created_at', '>=', now()->subDays(90))
            ->count();
        $context = [
            'department_id' => $departmentId,
            'department_name' => $department->name ?? "Department {$departmentId}",
            'supply_id' => $supplyId,
            'supply_name' => $supply->name ?? "Supply {$supplyId}",
            'current_quantity' => (int) $currentQuantity,
            'historical_average' => round($mean, 2),
            'historical_stddev' => round($stddev, 2),
            'historical_quantities' => array_map('intval', $movements),
            'z_score' => round($zScore, 2),
            'historical_sample_size' => count($movements),
            'similar_recent_spikes' => $similarRecentSpikes,
            'threshold' => self::QUANTITY_ANOMALY_THRESHOLD,
        ];
        $reason = sprintf(
            'Department %s requested %d units (z-score: %.2f, average: %.2f)',
            $departmentId, $currentQuantity, $zScore, $mean
        );
        $existingId = self::findOpenQuantityAnomalyId($departmentId, $supplyId);

        if ($existingId) {
            DB::table('anomaly_alerts')
                ->where('id', $existingId)
                ->update([
                    'risk_score' => 6.0,
                    'priority' => 'medium',
                    'reason' => $reason,
                    'recommended_action' => 'Review if this is an unusual request pattern',
                    'analysis_context' => json_encode($context),
                    'ai_explanation_status' => DB::raw("case when ai_explanation is null then 'pending' else ai_explanation_status end"),
                    'updated_at' => now(),
                ]);

            return $existingId;
        }

        $anomalyId = DB::table('anomaly_alerts')->insertGetId([
            'source_type' => 'quantity_anomaly',
            'source_id' => (string)$departmentId,
            'risk_score' => 6.0,
            'priority' => 'medium',
            'reason' => $reason,
            'recommended_action' => 'Review if this is an unusual request pattern',
            'analysis_context' => json_encode($context),
            'ai_explanation_status' => 'pending',
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        self::notifyQuantityAnomaly($anomalyId, $context);

        return $anomalyId;
    }

    return null;
}

    protected static function findOpenQuantityAnomalyId($departmentId, $supplyId): ?int
    {
        $openAlerts = DB::table('anomaly_alerts')
            ->where('source_type', 'quantity_anomaly')
            ->where('source_id', (string) $departmentId)
            ->where('status', 'open')
            ->orderByDesc('id')
            ->limit(25)
            ->get(['id', 'analysis_context']);

        foreach ($openAlerts as $alert) {
            $context = json_decode($alert->analysis_context ?? '', true);

            if (is_array($context) && (string) ($context['supply_id'] ?? '') === (string) $supplyId) {
                return (int) $alert->id;
            }
        }

        return null;
    }

    protected static function findOpenRequesterFrequencyAnomalyId($requesterId, $supplyId): ?int
    {
        return DB::table('anomaly_alerts')
            ->where('source_type', 'requester_frequency_anomaly')
            ->where('source_id', (string) $requesterId)
            ->where('supply_id', $supplyId)
            ->where('status', 'open')
            ->orderByDesc('id')
            ->value('id');
    }

    protected static function notifyQuantityAnomaly(int $anomalyId, array $context): void
    {
        if (! Schema::hasTable('transfer_notifications') || ! Schema::hasColumn('transfer_notifications', 'anomaly_alert_id')) {
            return;
        }

        $recipients = User::query()
            ->whereIn('role', ['OIC', 'System Administrator'])
            ->where(function ($query) {
                $query->whereNull('status')->orWhere('status', 'active');
            })
            ->get(['id', 'role']);

        foreach ($recipients as $recipient) {
            $exists = DB::table('transfer_notifications')
                ->where('anomaly_alert_id', $anomalyId)
                ->where('recipient_id', $recipient->id)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'anomaly_alert_id' => $anomalyId,
                'recipient_id' => $recipient->id,
                'recipient_role' => $recipient->role,
                'type' => 'anomaly',
                'title' => 'AI Anomaly Alert',
                'message' => sprintf(
                    'Unusual supply usage detected for %s in %s.',
                    $context['supply_name'] ?? 'a supply',
                    $context['department_name'] ?? 'a department'
                ),
                'navigation_target' => "inventory-monitoring:{$anomalyId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    protected static function notifyFrequencyAnomaly(int $anomalyId, array $context): void
    {
        if (! Schema::hasTable('transfer_notifications') || ! Schema::hasColumn('transfer_notifications', 'anomaly_alert_id')) {
            return;
        }

        $recipients = User::query()
            ->whereIn('role', ['Property Custodian', 'PPMO Staff', 'System Administrator'])
            ->where(function ($query) {
                $query->whereNull('status')->orWhere('status', 'active');
            })
            ->get(['id', 'role']);

        foreach ($recipients as $recipient) {
            $exists = DB::table('transfer_notifications')
                ->where('anomaly_alert_id', $anomalyId)
                ->where('recipient_id', $recipient->id)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('transfer_notifications')->insert([
                'transfer_id' => null,
                'anomaly_alert_id' => $anomalyId,
                'recipient_id' => $recipient->id,
                'recipient_role' => $recipient->role,
                'type' => 'anomaly',
                'title' => 'Requester Frequency Alert',
                'message' => sprintf(
                    'Unusual request frequency detected: %s requested %s %d times recently.',
                    $context['requester_name'] ?? 'A requester',
                    $context['supply_name'] ?? 'a supply',
                    $context['recent_requests_30days'] ?? 'multiple'
                ),
                'navigation_target' => "inventory-monitoring:{$anomalyId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

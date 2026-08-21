<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\MaintenanceRecord;
use Illuminate\Support\Facades\DB;

class RepairFrequencyService
{
    private const REPEAT_REPAIR_THRESHOLD = 3; // Configurable - number of repairs in 12 months
    private const MIN_RECORDS_FOR_PREDICTION = 2; // Need at least 2 completed repairs to derive an interval

    /**
     * Check if an asset exceeds repeat repair threshold
     */
    public static function checkThreshold($assetId, $threshold = self::REPEAT_REPAIR_THRESHOLD): void
    {
        // Count maintenance records for the asset in the trailing 12 months
        $repairCount = MaintenanceRecord::where('asset_id', $assetId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', now()->subYear())
            ->count();

        if ($repairCount >= $threshold) {
            // Check if we already have an open repeat_repair anomaly for this asset
            $existingAnomaly = DB::table('anomaly_alerts')
                ->where('source_type', 'repeat_repair')
                ->where('source_id', (string)$assetId)
                ->where('status', 'open')
                ->first();

            if ($existingAnomaly) {
                return; // Don't create duplicate
            }

            DB::table('anomaly_alerts')->insert([
                'source_type' => 'repeat_repair',
                'source_id' => (string)$assetId,
                'risk_score' => 7.0,
                'priority' => 'high',
                'reason' => "Asset #{$assetId} has been repaired {$repairCount} times in the last 12 months (threshold: {$threshold})",
                'recommended_action' => 'Review asset condition and consider replacement',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Project when an asset's next maintenance is likely due, based on the
     * average interval between its own past completed repairs. Returns null
     * if there isn't enough history (fewer than 2 completed records) to
     * derive a meaningful interval.
     */
    public static function predictNextMaintenance(int $assetId): ?array
    {
        $completedDates = MaintenanceRecord::where('asset_id', $assetId)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->orderBy('completed_at')
            ->pluck('completed_at');

        if ($completedDates->count() < self::MIN_RECORDS_FOR_PREDICTION) {
            return null;
        }

        $intervals = [];
        for ($i = 1; $i < $completedDates->count(); $i++) {
            $intervals[] = abs($completedDates[$i]->diffInDays($completedDates[$i - 1]));
        }

        $avgIntervalDays = (int) round(array_sum($intervals) / count($intervals));
        $lastCompletedAt = $completedDates->last();
        $predictedDate = $lastCompletedAt->copy()->addDays($avgIntervalDays);

        return [
            'asset_id' => $assetId,
            'avg_interval_days' => $avgIntervalDays,
            'last_completed_at' => $lastCompletedAt,
            'predicted_date' => $predictedDate,
            'is_overdue' => $predictedDate->isPast(),
            'days_until_due' => (int) round(now()->diffInDays($predictedDate, false)),
            'sample_size' => $completedDates->count(),
        ];
    }

    /**
     * Predicted maintenance across all assets that have enough repair
     * history, filtered to those due (or overdue) within $daysAhead days.
     */
    public static function dueSoon(int $daysAhead = 14): array
    {
        $assetIds = MaintenanceRecord::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->groupBy('asset_id')
            ->havingRaw('COUNT(*) >= ?', [self::MIN_RECORDS_FOR_PREDICTION])
            ->pluck('asset_id');

        $predictions = [];
        foreach ($assetIds as $assetId) {
            $prediction = self::predictNextMaintenance($assetId);
            if (! $prediction) {
                continue;
            }
            if ($prediction['is_overdue'] || $prediction['days_until_due'] <= $daysAhead) {
                $asset = Asset::find($assetId);
                if ($asset) {
                    $prediction['asset'] = $asset;
                    $predictions[] = $prediction;
                }
            }
        }

        usort($predictions, fn ($a, $b) => $a['predicted_date'] <=> $b['predicted_date']);

        return $predictions;
    }
}

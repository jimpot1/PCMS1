<?php

namespace App\Console\Commands;

use App\Http\Controllers\AnomalyController;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RunAnomalyAnalysis extends Command
{
    /**
     * php artisan anomalies:analyze
     */
    protected $signature = 'anomalies:analyze';

    protected $description = 'Sweep stock movements and assets for quantity, repeat-repair, and other anomalies';

    public function handle(): int
    {
        $result = AnomalyController::runAnalysis();

        $this->info("Checked {$result['pairs_checked']} department/supply pairs.");
        $this->info("New anomalies flagged: {$result['new_alerts']}.");

        // Record the run so it's visible in the app (Activity Log / Inventory
        // Monitoring page), not just in the server's cron/scheduler output.
        DB::table('activity_logs')->insert([
            'action' => 'anomaly_analysis_run',
            'payload' => json_encode([
                'action' => 'anomaly_analysis_run',
                'pairs_checked' => $result['pairs_checked'],
                'new_alerts' => $result['new_alerts'],
                'user' => 'system (scheduled)',
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return self::SUCCESS;
    }
}
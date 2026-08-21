<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateFromSupabase extends Command
{
    protected $signature = 'app:migrate-from-supabase';
    protected $description = 'Migrate all data from Supabase PostgreSQL to local MySQL';

    private array $supabaseTables = [
        'departments',
        'asset_categories',
        'suppliers',
        'assets',
        'maintenance_records',
        'asset_assignments',
        'asset_transfers',
        'damage_reports',
        'supplies',
        'stock_movements',
        'purchase_requests',
        'gate_passes',
        'physical_audits',
        'ocr_scans',
        'anomaly_alerts',
        'activity_logs',
        'sessions',
        'users',
        'audit_scans',
        'transfer_notifications',
    ];

    public function handle(): int
    {
        $this->info('Starting migration from Supabase to MySQL...');

        try {
            DB::connection('pgsql')->getPdo();
        } catch (\Throwable $e) {
            $this->error('Cannot connect to Supabase PostgreSQL: '.$e->getMessage());
            return Command::FAILURE;
        }

        $this->warn('This will DELETE all local MySQL data before importing.');
        if (! $this->confirm('Do you want to continue?', true)) {
            $this->info('Migration cancelled.');
            return Command::SUCCESS;
        }

        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS = 0');

        foreach ($this->supabaseTables as $table) {
            $this->line("Migrating table: <fg=cyan>{$table}</>");

            if (! Schema::connection('pgsql')->hasTable($table)) {
                $this->warn("Table {$table} does not exist in Supabase. Skipping.");
                continue;
            }

            if (! Schema::connection('mysql')->hasTable($table)) {
                $this->warn("Table {$table} does not exist in MySQL. Skipping.");
                continue;
            }

            DB::connection('mysql')->table($table)->truncate();

            $columns = DB::connection('pgsql')->select('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position', [$table]);
            $supabaseColumnNames = array_map(fn ($col) => $col->column_name, $columns);
            $mysqlColumnNames = Schema::connection('mysql')->getColumnListing($table);
            $commonColumns = array_intersect($supabaseColumnNames, $mysqlColumnNames);

            if (empty($commonColumns)) {
                $this->warn("  No common columns found. Skipping.");
                continue;
            }

            $rows = DB::connection('pgsql')->table($table)->get();

            if ($rows->isEmpty()) {
                $this->line("  No rows to migrate.");
                continue;
            }

            $chunks = $rows->chunk(500);
            $migrated = 0;

            foreach ($chunks as $chunk) {
                $insertData = [];

                foreach ($chunk as $row) {
                    $row = (array) $row;
                    $row = $this->formatRowForMySql($row, $columns);
                    $row = array_intersect_key($row, array_flip($commonColumns));
                    if (array_key_exists('payload', $row) && ($row['payload'] === null || $row['payload'] === '')) {
                        $row['payload'] = '{}';
                    }
                    $insertData[] = $row;
                }

                if (! empty($insertData)) {
                    DB::connection('mysql')->table($table)->insert($insertData);
                    $migrated += count($insertData);
                }
            }

            $this->info("  Migrated <fg=green>{$migrated}</> rows.");
        }

        DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS = 1');

        $this->newLine();
        $this->info('Migration completed successfully!');

        return Command::SUCCESS;
    }

    private function formatRowForMySql(array $row, array $columns): array
    {
        $formatted = [];

        foreach ($row as $key => $value) {
            if ($value === null) {
                $formatted[$key] = null;
                continue;
            }

            $dataType = collect($columns)->firstWhere('column_name', $key)?->data_type ?? 'text';

            if (in_array($dataType, ['uuid', 'character varying', 'text'], true)) {
                $formatted[$key] = (string) $value;
            } elseif ($dataType === 'json' || $dataType === 'jsonb') {
                $formatted[$key] = is_string($value) ? $value : json_encode($value);
            } elseif ($dataType === 'boolean') {
                $formatted[$key] = (bool) $value;
            } elseif ($dataType === 'timestamp without time zone' || $dataType === 'timestamp with time zone') {
                $formatted[$key] = preg_replace('/[+-]\d{2}$/', '', (string) $value);
            } elseif ($dataType === 'date') {
                $formatted[$key] = (string) $value;
            } elseif ($dataType === 'numeric' || $dataType === 'integer' || $dataType === 'bigint' || $dataType === 'smallint') {
                $formatted[$key] = is_numeric($value) ? $value + 0 : $value;
            } else {
                $formatted[$key] = (string) $value;
            }
        }

        return $formatted;
    }
}

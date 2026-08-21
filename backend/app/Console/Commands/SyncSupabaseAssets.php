<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Models\Asset;

class SyncSupabaseAssets extends Command
{
    protected $signature = 'supabase:sync-assets {--dry-run}';

    protected $description = 'Sync local assets to Supabase REST table (upsert).';

    public function handle(): int
    {
        $dry = $this->option('dry-run');

        $supabaseUrl = env('SUPABASE_URL');
        $serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');

        if (! $supabaseUrl || ! $serviceRoleKey) {
            $this->error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.');
            $this->line('Use your Supabase project service role key, not the anon/public key.');
            return 1;
        }

        $endpoint = rtrim($supabaseUrl, '/') . '/rest/v1/assets';
        $categoriesEndpoint = rtrim($supabaseUrl, '/') . '/rest/v1/asset_categories';
        $departmentsEndpoint = rtrim($supabaseUrl, '/') . '/rest/v1/departments';
        $suppliersEndpoint = rtrim($supabaseUrl, '/') . '/rest/v1/suppliers';

        $assets = Asset::withTrashed()->get();
        $this->info('Found ' . $assets->count() . ' assets locally.');

        $this->syncReferenceTable('asset_categories', DB::table('asset_categories')->get()->toArray(), $categoriesEndpoint, $serviceRoleKey, $dry);
        $this->syncReferenceTable('departments', DB::table('departments')->get()->toArray(), $departmentsEndpoint, $serviceRoleKey, $dry);
        $this->syncReferenceTable('suppliers', DB::table('suppliers')->get()->toArray(), $suppliersEndpoint, $serviceRoleKey, $dry);

        foreach ($assets as $asset) {
            $payload = [
                'asset_id' => $asset->asset_id,
                'property_number' => $asset->property_number,
                'serial_number' => $asset->serial_number,
                'name' => $asset->name,
                'brand' => $asset->brand,
                'model' => $asset->model,
                'description' => $asset->description,
                'category_id' => $asset->category_id,
                'department_id' => $asset->department_id,
                'custodian_id' => $asset->custodian_id,
                'location' => $asset->location,
                'condition' => $asset->condition,
                'status' => $asset->status,
                'purchase_date' => $asset->purchase_date ? $asset->purchase_date->format('Y-m-d') : null,
                'purchase_cost' => $asset->purchase_cost !== null ? (string)$asset->purchase_cost : null,
                'quantity' => $asset->quantity ?? 1,
                'supplier_id' => $asset->supplier_id,
                'warranty_until' => $asset->warranty_until ? $asset->warranty_until->format('Y-m-d') : null,
                'depreciation_rate' => $asset->depreciation_rate,
                'qr_code_path' => $asset->qr_code_path,
                'image_path' => $asset->image_path,
                'remarks' => $asset->remarks,
                'created_at' => $asset->created_at ? $asset->created_at->toDateTimeString() : null,
                'updated_at' => $asset->updated_at ? $asset->updated_at->toDateTimeString() : null,
            ];

            if ($dry) {
                $this->line('DRY: ' . json_encode($payload));
                continue;
            }

            $response = Http::withHeaders([
                'apikey' => $serviceRoleKey,
                'Authorization' => "Bearer {$serviceRoleKey}",
                'Content-Type' => 'application/json',
                // Ask Supabase/PostgREST to merge duplicates on conflict
                'Prefer' => 'resolution=merge-duplicates,return=representation'
            ])->post($endpoint . '?on_conflict=asset_id', [$payload]);

            if (! $response->successful()) {
                $this->error('Failed to sync asset ' . $asset->id . ': ' . $response->status() . ' ' . $response->body());
            } else {
                $this->info('Synced asset ' . $asset->id . ' -> ' . ($response->json()[0]['id'] ?? 'inserted'));
            }
        }

        $this->info('Sync complete.');
        return 0;
    }

    protected function syncReferenceTable(string $name, array $rows, string $endpoint, string $serviceRoleKey, bool $dry): void
    {
        $this->info('Syncing reference table ' . $name . ' (' . count($rows) . ' rows)');

        foreach ($rows as $row) {
            $payload = (array) $row;

            if ($dry) {
                $this->line('DRY [' . $name . ']: ' . json_encode($payload));
                continue;
            }

            $response = Http::withHeaders([
                'apikey' => $serviceRoleKey,
                'Authorization' => "Bearer {$serviceRoleKey}",
                'Content-Type' => 'application/json',
                'Prefer' => 'resolution=merge-duplicates,return=representation'
            ])->post($endpoint . '?on_conflict=id', [$payload]);

            if (! $response->successful()) {
                $this->error('Failed to sync ' . $name . ' id=' . ($payload['id'] ?? 'unknown') . ': ' . $response->status() . ' ' . $response->body());
            } else {
                $this->info('Synced ' . $name . ' id=' . ($payload['id'] ?? 'unknown'));
            }
        }
    }
}

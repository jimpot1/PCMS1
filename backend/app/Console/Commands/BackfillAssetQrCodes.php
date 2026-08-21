<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Services\AssetQrCodeService;
use Illuminate\Console\Command;

class BackfillAssetQrCodes extends Command
{
    protected $signature = 'assets:backfill-qr-codes';

    protected $description = 'Generate QR codes for existing assets that do not have one yet';

    public function handle(): int
    {
        $assets = Asset::withTrashed()->whereNull('qr_code_path')->get();

        $this->info("Found {$assets->count()} assets without a QR code.");

        foreach ($assets as $asset) {
            $asset->update(['qr_code_path' => AssetQrCodeService::generate($asset)]);
            $this->line("Generated QR code for {$asset->property_number}");
        }

        $this->info('Done.');

        return self::SUCCESS;
    }
}

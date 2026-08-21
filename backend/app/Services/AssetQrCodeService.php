<?php

namespace App\Services;

use App\Models\Asset;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Storage;

class AssetQrCodeService
{
    public static function generate(Asset $asset): string
    {
        $qrCode = new QrCode(
            data: $asset->property_number,
            size: 300,
            margin: 10,
        );

        $result = (new PngWriter())->write($qrCode);

        $filename = "assets/qr-{$asset->id}.png";
        Storage::disk('public')->put($filename, $result->getString());

        return $filename;
    }
}

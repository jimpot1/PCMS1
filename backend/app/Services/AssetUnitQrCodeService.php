<?php

namespace App\Services;

use App\Models\AssetUnit;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Storage;

class AssetUnitQrCodeService
{
    public static function generate(AssetUnit $unit): string
    {
        $qrCode = new QrCode(
            data: 'PCMS-ASSET-UNIT:' . $unit->id,
            size: 300,
            margin: 10,
        );

        $result = (new PngWriter())->write($qrCode);
        $filename = "asset-units/qr-{$unit->id}.png";
        Storage::disk('public')->put($filename, $result->getString());

        return $filename;
    }
}

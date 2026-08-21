<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';
$app = app();
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$app->boot();
use Illuminate\Support\Facades\Schema;
use App\Models\Supply;

echo "COLUMNS:" . json_encode(Schema::getColumnListing('supplies')) . "\n";
$row = Supply::where('name', 'Ballpen')->orWhere('sku', 'SSP-10024396')->first();
if ($row) {
    echo "ROW:" . json_encode($row->toArray()) . "\n";
} else {
    echo "ROW: null\n";
}

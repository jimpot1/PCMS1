<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Recently added supplies:\n";
$supplies = DB::table('supplies')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get(['id', 'sku', 'name', 'department_id', 'stock', 'created_at']);
foreach ($supplies as $s) {
    echo "ID: {$s->id}, SKU: {$s->sku}, Name: {$s->name}, DeptID: {$s->department_id}, Stock: {$s->stock}, Created: {$s->created_at}\n";
}

echo "\nSupplies with empty department_id:\n";
$empty = DB::table('supplies')->whereNull('department_id')->orWhere('department_id', '')->get(['id', 'sku', 'name', 'department_id']);
foreach ($empty as $s) {
    echo "ID: {$s->id}, SKU: {$s->sku}, Name: {$s->name}, DeptID: '{$s->department_id}'\n";
}

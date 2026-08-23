<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cols = DB::getSchemaBuilder()->getColumnListing('supplies');
echo "Supplies columns:\n";
print_r($cols);

echo "\nSample supplies:\n";
$supplies = DB::table('supplies')->limit(5)->get(['id', 'sku', 'name', 'department_id', 'stock']);
foreach ($supplies as $s) {
    echo "ID: {$s->id}, SKU: {$s->sku}, Name: {$s->name}, DeptID: {$s->department_id}, Stock: {$s->stock}\n";
}

echo "\nDepartments:\n";
$depts = DB::table('departments')->get(['id', 'name']);
foreach ($depts as $d) {
    echo "ID: {$d->id}, Name: {$d->name}\n";
}

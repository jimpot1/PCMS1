<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate creating a supply with department_id = 3 (Clinic)
$data = [
    'name' => 'Test Supply ' . date('His'),
    'sku' => null,
    'unit' => 'packs',
    'category' => 'Test',
    'description' => 'Test description',
    'stock' => 10,
    'minimum_stock' => 5,
    'unit_price' => 100.00,
    'expiration_date' => null,
    'supplier_id' => null,
    'department_id' => 3,
];

// Use the Supply model directly
$supply = App\Models\Supply::create($data);
echo "Created supply:\n";
echo "ID: {$supply->id}\n";
echo "Name: {$supply->name}\n";
echo "SKU: {$supply->sku}\n";
echo "DepartmentID: {$supply->department_id}\n";
echo "Stock: {$supply->stock}\n";

// Now query with department filter
echo "\nQuerying supplies with department_id = 3:\n";
$filtered = App\Models\Supply::where('department_id', 3)->get(['id', 'name', 'department_id']);
foreach ($filtered as $s) {
    echo "ID: {$s->id}, Name: {$s->name}, DeptID: {$s->department_id}\n";
}

// Clean up - delete test supply
$supply->delete();
echo "\nTest supply deleted.\n";

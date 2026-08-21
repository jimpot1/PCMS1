<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$admin = User::updateOrCreate(
    ['email' => 'admin@pcms.com'],
    [
        'employee_id' => 'ADMIN',
        'first_name' => 'System',
        'middle_name' => null,
        'last_name' => 'Administrator',
        'password' => Hash::make('Admin123!'),
        'role' => 'System Administrator',
        'status' => 'active'
    ]
);

if ($admin) {
    $token = $admin->createToken('cli-token')->plainTextToken;
    echo "Admin created: " . $admin->email . PHP_EOL;
    echo "Token: " . $token . PHP_EOL;
} else {
    echo "Admin creation failed" . PHP_EOL;
}


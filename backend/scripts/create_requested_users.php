<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$users = [
    [
        'email' => 'Logistichead@gmail.com',
        'first_name' => 'Logistic',
        'last_name' => 'Head',
        'role' => 'Department Head',
        'department' => 'Logistic',
    ],
    [
        'email' => 'Logistic@gmail.com',
        'first_name' => 'Logistic',
        'last_name' => 'User',
        'role' => 'Requester',
        'department' => 'Logistic',
    ],
    [
        'email' => 'Clinic@gmail.com',
        'first_name' => 'Clinic',
        'last_name' => 'User',
        'role' => 'Requester',
        'department' => 'Clinic',
    ],
    [
        'email' => 'Clinichead@gmail.com',
        'first_name' => 'Clinic',
        'last_name' => 'Head',
        'role' => 'Department Head',
        'department' => 'Clinic',
    ],
];

foreach ($users as $data) {
    $user = User::firstOrNew(['email' => $data['email']]);
    $user->first_name = $data['first_name'];
    $user->last_name = $data['last_name'];
    $user->full_name = trim($data['first_name'] . ' ' . $data['last_name']);
    $user->role = $data['role'];
    $user->department = $data['department'];
    $user->password_hash = Hash::make('Password123!');
    $user->status = 'active';
    $user->save();

    echo $data['email'] . ' -> ' . $data['role'] . PHP_EOL;
}

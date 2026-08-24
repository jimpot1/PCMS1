<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = DB::table('users')->where('email', 'admin@pcms.com')->first();
echo "Email: " . $user->email . "\n";
echo "Password hash: " . $user->password_hash . "\n";
echo "Role: " . $user->role . "\n";

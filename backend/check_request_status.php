<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$req = \App\Models\PurchaseRequest::where('request_number', 'REQ-2026-000001')->first();

if ($req) {
    echo "Request ID: " . $req->id . "\n";
    echo "Current Stage: " . $req->current_stage . "\n";
    echo "Status: " . $req->status . "\n";
    echo "Is Walk-In: " . ($req->is_walk_in ? 'Yes' : 'No') . "\n";
    echo "Approval Status: " . ($req->approval_status ?? 'N/A') . "\n";
    echo "Released At: " . ($req->released_at ?? 'Not released') . "\n";
    echo "\n--- Full Request Data ---\n";
    print_r($req->toArray());
} else {
    echo "Request not found\n";
}

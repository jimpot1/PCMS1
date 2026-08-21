<?php
use App\Models\AssetAssignment;
use Illuminate\Support\Facades\DB;

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$assignments = DB::table('asset_assignments as aa')
  ->join('assets as a', 'aa.asset_id', '=', 'a.id')
  ->join('users as u', 'aa.assigned_to', '=', 'u.id')
  ->where('a.name', 'like', '%Dell OptiPlex%')
  ->select('aa.id', 'aa.asset_id', 'aa.assigned_to', 'aa.quantity', 'aa.status', 'aa.accepted_at', 'aa.assigned_at', 'aa.created_at', 'aa.updated_at', 'a.name', 'a.property_number', 'u.full_name')
  ->orderByDesc('aa.created_at')
  ->get();

echo "Found " . count($assignments) . " assignments:\n\n";

foreach ($assignments as $a) {
  echo "=== Assignment ===\n";
  echo "ID: " . $a->id . "\n";
  echo "Asset: " . $a->name . "\n";
  echo "Property: " . $a->property_number . "\n";
  echo "Employee: " . $a->full_name . "\n";
  echo "Quantity: " . $a->quantity . "\n";
  echo "Status: " . $a->status . "\n";
  echo "Accepted At: " . $a->accepted_at . "\n";
  echo "Assigned At: " . $a->assigned_at . "\n";
  echo "Created: " . $a->created_at . "\n";
  echo "Updated: " . $a->updated_at . "\n\n";
}
?>

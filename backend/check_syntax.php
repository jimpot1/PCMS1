<?php
$file = 'app/Http/Controllers/PurchaseRequestController.php';
$output = [];
$returnCode = 0;
exec("php -l " . escapeshellarg($file), $output, $returnCode);
foreach ($output as $line) {
    echo $line . "\n";
}
exit($returnCode);

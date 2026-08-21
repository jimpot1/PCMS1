<?php
$token = '4|tVd3lLLjXEfP2m5nGH2oRMOIBOIQ2ZwCpenvz7aE8c4950f2';
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $token\r\n",
        'ignore_errors' => true,
        'timeout' => 5,
    ],
];
$context = stream_context_create($opts);
$resp = @file_get_contents('http://127.0.0.1:8000/api/auth/me', false, $context);
$status = 'unknown';
if (isset($http_response_header) && preg_match('#HTTP/\d+\.\d+\s+(\d+)#', $http_response_header[0], $m)) {
    $status = (int)$m[1];
}
$length = $resp === false ? 0 : strlen($resp);
echo "HTTP status: $status\nResponse length: $length\n";
if ($length > 0) echo substr($resp,0,1000) . "\n";

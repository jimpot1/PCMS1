<?php
$token = '4|tVd3lLLjXEfP2m5nGH2oRMOIBOIQ2ZwCpenvz7aE8c4950f2';
$opts = [
    'http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer $token\r\n",
        'ignore_errors' => true,
    ],
];
$context = stream_context_create($opts);
$response = file_get_contents('http://127.0.0.1:8000/api/auth/me', false, $context);
$status = null;
if (isset($http_response_header) && preg_match('#HTTP/\d+\.\d+\s+(\d+)#', $http_response_header[0], $m)) {
    $status = (int)$m[1];
}
echo "HTTP status: ".($status??'unknown')."\n";
echo $response;

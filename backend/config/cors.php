<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Add your Hostinger domain here - example:
        // 'https://yourdomain.com',
        // 'https://www.yourdomain.com',
        // For now, allow all origins in production (not recommended for security)
        env('APP_ENV') === 'production' ? env('APP_URL') : null,
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.hostinger\.com$#',
        '#^https://.*\.hostingersite\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];

<?php

return [
    'supabase' => [
        'url' => env('SUPABASE_URL', 'https://wuuzjzhnotwwjiivazuw.supabase.co'),
        'key' => env('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1dXpqemhub3R3d2ppaXZhenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTczMzksImV4cCI6MjA5OTUzMzMzOX0.upZizlwewWQla8jY9NJ1LDmNBVDgn2mI2GcivhNayr0'),
    ],

    'google_vision' => [
        'credentials_path' => env('GOOGLE_VISION_CREDENTIALS_PATH', storage_path('app/private/google/vision-credentials.json')),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-5.6'),
        'timeout' => (int) env('OPENAI_TIMEOUT', 20),
    ],
];

<?php

use App\Providers\AppServiceProvider;
use App\Providers\AuthServiceProvider;
use Laravel\Sanctum\SanctumServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    SanctumServiceProvider::class,
];

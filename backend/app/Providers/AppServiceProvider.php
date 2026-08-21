<?php

namespace App\Providers;

use App\Models\AssetAssignment;
use App\Observers\AssetAssignmentObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        AssetAssignment::observe(AssetAssignmentObserver::class);
    }
}

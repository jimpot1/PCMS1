<?php

namespace App\Providers;

use App\Models\AssetAssignment;
use App\Observers\AssetAssignmentObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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

        RateLimiter::for('login', function (Request $request) {
            $email = strtolower((string) $request->input('email'));

            return [
                Limit::perMinute(30)->by($request->ip()),
                Limit::perMinute(5)->by($request->ip().'|'.$email),
            ];
        });

        RateLimiter::for('otp-verify', function (Request $request) {
            $userId = (string) $request->input('user_id', 'unknown');

            return [
                Limit::perMinute(20)->by($request->ip()),
                Limit::perMinute(10)->by($request->ip().'|'.$userId),
            ];
        });

        RateLimiter::for('otp-resend', function (Request $request) {
            $userId = (string) $request->input('user_id', 'unknown');

            return [
                Limit::perMinute(10)->by($request->ip()),
                Limit::perMinute(3)->by($request->ip().'|'.$userId),
            ];
        });
    }
}

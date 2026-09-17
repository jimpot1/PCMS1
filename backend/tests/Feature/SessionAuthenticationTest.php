<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class SessionAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_session_cookie_authenticates_subsequent_spa_requests(): void
    {
        config(['sanctum.stateful' => ['localhost:5173']]);
        $this->withHeaders(['Referer' => 'http://localhost:5173/']);

        $user = User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'SESSION-TEST',
            'full_name' => 'Session Admin',
            'email' => 'session@example.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'System Administrator',
            'status' => 'active',
        ]);
        $user->otpVerifications()->create([
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'is_used' => false,
            'last_sent_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'user_id' => $user->id,
            'otp' => '123456',
        ])->assertOk();

        $cookieName = config('session.cookie');
        $cookie = $response->getCookie($cookieName, false);
        $this->assertNotNull($cookie);

        foreach (['/api/auth/me', '/api/dashboard', '/api/notifications'] as $path) {
            // Do not let Laravel's in-memory guard hide a broken session cookie.
            Auth::forgetGuards();
            $this->app['session']->forgetDrivers();
            $this->withUnencryptedCookie($cookieName, $cookie->getValue())
                ->getJson($path)->assertOk();
        }
    }

    public function test_auth_me_returns_null_for_missing_session_without_failing(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJson([
                'authenticated' => false,
                'user' => null,
            ]);
    }

    public function test_protected_routes_reject_missing_sessions(): void
    {
        foreach (['/api/dashboard', '/api/notifications'] as $path) {
            $this->getJson($path)->assertUnauthorized();
        }
    }
}

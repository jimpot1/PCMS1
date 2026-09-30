<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        $this->assertDatabaseHas('activity_logs', ['action' => 'user_logged_in']);
        $this->assertDatabaseCount('activity_logs', 1);

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

        $activityResponse = $this->getJson('/api/activity-logs')
            ->assertOk()
            ->assertJsonFragment([
                'text' => 'User logged in',
                'user_name' => 'Session Admin',
                'role' => 'System Administrator',
                'email' => 'session@example.com',
            ]);
        $loginActivity = collect($activityResponse->json('data'))
            ->firstWhere('email', 'session@example.com');
        $this->assertNotEmpty($loginActivity['time'] ?? null);
        $this->assertNotEmpty($loginActivity['ip'] ?? null);
    }

    public function test_successful_logins_are_recorded_for_every_role_without_otp_replay_duplicates(): void
    {
        $roles = [
            'Requester',
            'Department Head',
            'Recommending Approver',
            'OIC',
            'PPMO Staff',
            'Property Custodian',
            'President',
            'CEO',
            'System Administrator',
        ];

        foreach ($roles as $index => $role) {
            $user = $this->createUserWithOtp($role, $index);

            $this->postJson('/api/auth/otp/verify', [
                'user_id' => $user->id,
                'otp' => '123456',
            ])->assertOk();

            $this->assertDatabaseCount('activity_logs', $index + 1);

            if ($index === 0) {
                $this->postJson('/api/auth/otp/verify', [
                    'user_id' => $user->id,
                    'otp' => '123456',
                ])->assertStatus(422);

                $this->assertDatabaseCount('activity_logs', 1);
            }

            if ($role !== 'System Administrator') {
                $this->postJson('/api/auth/logout')->assertOk();
            }
        }

        $firstLog = DB::table('activity_logs')->where('action', 'user_logged_in')->orderBy('id')->first();
        $firstLogPayload = json_decode($firstLog->payload, true);
        unset($firstLogPayload['first_name'], $firstLogPayload['last_name']);
        $firstLogPayload['user_name'] = 'Requester';
        $firstLogPayload['user'] = 'Requester';
        DB::table('activity_logs')->where('id', $firstLog->id)->update([
            'payload' => json_encode($firstLogPayload),
        ]);
        DB::table('activity_logs')->insert([
            'action' => 'audit_completed',
            'payload' => json_encode([
                'action' => 'audit_completed',
                'user' => 'login1@example.com',
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $logsResponse = $this->getJson('/api/activity-logs')->assertOk();
        foreach ($roles as $index => $role) {
            $logsResponse->assertJsonFragment([
                'text' => 'User logged in',
                'user_name' => "Login User {$index}",
                'role' => $role,
                'email' => "login{$index}@example.com",
            ]);
        }
        $auditLog = collect($logsResponse->json('data'))->firstWhere('action', 'audit_completed');
        $this->assertSame('Login User 1', $auditLog['user_name'] ?? null);
    }

    public function test_ppmo_staff_can_see_its_login_activity_without_a_cached_activity_response(): void
    {
        $user = $this->createUserWithOtp('PPMO Staff', 10);

        $this->postJson('/api/auth/otp/verify', [
            'user_id' => $user->id,
            'otp' => '123456',
        ])->assertOk();

        $this->getJson('/api/activity-logs')
            ->assertOk()
            ->assertHeader('Cache-Control', 'private, no-store')
            ->assertJsonFragment([
                'text' => 'User logged in',
                'user_name' => 'Login User 10',
                'role' => 'PPMO Staff',
                'email' => 'login10@example.com',
            ]);
    }

    private function createUserWithOtp(string $role, int $index): User
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => "LOGIN-{$index}",
            'first_name' => 'Login',
            'last_name' => "User {$index}",
            'full_name' => $role,
            'email' => "login{$index}@example.com",
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => $role,
            'status' => 'active',
        ]);

        $user->otpVerifications()->create([
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'is_used' => false,
            'last_sent_at' => now(),
        ]);

        return $user;
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

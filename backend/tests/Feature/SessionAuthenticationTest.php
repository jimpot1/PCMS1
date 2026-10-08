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

        $logsResponse = $this->getJson('/api/activity-logs')->assertOk();
        foreach ($roles as $index => $role) {
            $logsResponse->assertJsonFragment([
                'text' => 'User logged in',
                'user_name' => "Login User {$index}",
                'role' => $role,
                'email' => "login{$index}@example.com",
            ]);
        }
    }

    public function test_activity_logs_fill_missing_actor_fields_from_the_account_record(): void
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'ACTIVITY-TEST',
            'first_name' => 'Activity',
            'last_name' => 'Staff',
            'full_name' => 'Activity Staff',
            'email' => 'activity@example.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'PPMO Staff',
            'status' => 'active',
        ]);

        \Illuminate\Support\Facades\DB::table('activity_logs')->insert([
            'action' => 'supply_created',
            'payload' => json_encode(['user' => $user->email]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->createActivityLogViewer())
            ->getJson('/api/activity-logs')
            ->assertOk()
            ->assertJsonPath('data.0.user_name', 'Activity Staff')
            ->assertJsonPath('data.0.role', 'PPMO Staff')
            ->assertJsonPath('data.0.email', 'activity@example.com')
            ->assertJsonPath('data.0.username', 'ACTIVITY-TEST');
    }

    private function createActivityLogViewer(): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'ACTIVITY-ADMIN',
            'full_name' => 'Activity Administrator',
            'email' => 'activity-admin@example.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'System Administrator',
            'status' => 'active',
        ]);
    }

    private function createUserWithOtp(string $role, int $index): User
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => "LOGIN-{$index}",
            'first_name' => 'Login',
            'last_name' => "User {$index}",
            'full_name' => "Login User {$index}",
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

    public function test_deactivated_user_cannot_use_protected_routes_or_keep_the_session(): void
    {
        $user = User::create([
            'id' => (string) Str::uuid(),
            'employee_id' => 'SESSION-DEACTIVATED',
            'full_name' => 'Deactivated Session User',
            'email' => 'deactivated-session@example.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'Requester',
            'status' => 'inactive',
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/dashboard')
            ->assertForbidden()
            ->assertJsonPath('account_deactivated', true);

        Auth::forgetGuards();
        $this->app['session']->forgetDrivers();
        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJson([
                'authenticated' => false,
                'user' => null,
            ]);
    }
}

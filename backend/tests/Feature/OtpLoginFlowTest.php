<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class OtpLoginFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_deactivated_account_is_blocked_at_login_with_a_clear_message(): void
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => 'EMP-DEACTIVATED',
            'full_name' => 'Deactivated User',
            'email' => 'deactivated@example.test',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'Requester',
            'status' => 'inactive',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'SecretPass123!',
        ])
            ->assertForbidden()
            ->assertJsonPath('account_deactivated', true)
            ->assertJsonPath(
                'message',
                'This account has been deactivated by an administrator. Please contact your system administrator if you believe this is a mistake.',
            );

        $this->assertGuest();
        $this->assertDatabaseMissing('otp_verifications', ['user_id' => $user->id]);
    }

    public function test_deactivated_account_cannot_complete_a_pending_otp_login(): void
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => 'EMP-DEACTIVATED-OTP',
            'full_name' => 'Deactivated OTP User',
            'email' => 'deactivated-otp@example.test',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'Requester',
            'status' => 'inactive',
        ]);
        $user->otpVerifications()->create([
            'otp_hash' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
            'is_used' => false,
            'last_sent_at' => now(),
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'user_id' => $user->id,
            'otp' => '123456',
        ])
            ->assertForbidden()
            ->assertJsonPath('account_deactivated', true);

        $this->assertGuest();
        $this->assertDatabaseMissing('activity_logs', ['action' => 'user_logged_in']);
    }

    public function test_valid_credentials_require_otp_before_authentication(): void
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => 'EMP-1001',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@gmail.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'Requester',
            'department' => 'IT',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'jane.doe@gmail.com',
            'password' => 'WrongPassword123!',
        ])->assertUnauthorized();

        $this->assertDatabaseMissing('activity_logs', ['action' => 'user_logged_in']);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jane.doe@gmail.com',
            'password' => 'SecretPass123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('requires_otp', true)
            ->assertJsonPath('user.email', 'ja***@gmail.com');

        $this->assertGuest();
        $this->assertDatabaseHas('otp_verifications', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('activity_logs', ['action' => 'user_logged_in']);
    }

    public function test_invalid_otp_is_rejected(): void
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => 'EMP-1002',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'full_name' => 'Jane Doe',
            'email' => 'jane.doe@gmail.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'Requester',
            'department' => 'IT',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'jane.doe@gmail.com',
            'password' => 'SecretPass123!',
        ]);

        $response = $this->postJson('/api/auth/otp/verify', [
            'user_id' => $user->id,
            'otp' => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Invalid or expired verification code.');

        $this->assertGuest();
        $this->assertDatabaseMissing('activity_logs', ['action' => 'user_logged_in']);
    }

    public function test_valid_otp_verification_sets_session_for_protected_routes(): void
    {
        $user = User::create([
            'id' => Str::uuid()->toString(),
            'employee_id' => 'EMP-1003',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'full_name' => 'Admin User',
            'email' => 'admin.user@gmail.com',
            'password_hash' => Hash::make('SecretPass123!'),
            'role' => 'System Administrator',
            'department' => 'IT',
            'status' => 'active',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'admin.user@gmail.com',
            'password' => 'SecretPass123!',
        ]);

        $otpRecord = $user->otpVerifications()->latest()->first();
        $this->assertNotNull($otpRecord);

        $validOtp = null;
        for ($candidate = 0; $candidate < 1000000; $candidate++) {
            $value = str_pad((string) $candidate, 6, '0', STR_PAD_LEFT);
            if (Hash::check($value, $otpRecord->otp_hash)) {
                $validOtp = $value;
                break;
            }
        }

        $this->assertNotNull($validOtp);

        $verifyResponse = $this->postJson('/api/auth/otp/verify', [
            'user_id' => $user->id,
            'otp' => $validOtp,
        ]);

        $verifyResponse->assertOk();
        $this->assertAuthenticated();

        $meResponse = $this->getJson('/api/auth/me');
        $meResponse->assertOk()
            ->assertJsonPath('email', 'admin.user@gmail.com');
    }
}

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

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jane.doe@gmail.com',
            'password' => 'SecretPass123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('requires_otp', true)
            ->assertJsonPath('user.email', 'ja***@gmail.com');

        $this->assertGuest();
        $this->assertDatabaseHas('otp_verifications', ['user_id' => $user->id]);
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

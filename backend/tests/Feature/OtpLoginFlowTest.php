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
}

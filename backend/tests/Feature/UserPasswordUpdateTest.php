<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserPasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_management_action_password_verification_accepts_the_authenticated_users_password(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator', 'AdminPass123!');

        $this->actingAs($admin, 'web')
            ->postJson('/api/users/verify-action-password', [
                'password' => 'AdminPass123!',
            ])
            ->assertOk()
            ->assertJsonPath('verified', true);
    }

    public function test_user_management_action_password_verification_rejects_an_incorrect_password(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator', 'AdminPass123!');

        $this->actingAs($admin, 'web')
            ->postJson('/api/users/verify-action-password', [
                'password' => 'WrongPass123!',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The password you entered is incorrect.');
    }

    public function test_user_update_hashes_a_new_password(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator', 'AdminPass123!');
        $user = $this->createUser('user@example.com', 'Requester', 'OldPass123!');

        $this->actingAs($admin, 'web')
            ->patchJson('/api/users/' . $user->id, [
                'password' => 'NewPass123!',
                'password_confirmation' => 'NewPass123!',
            ])
            ->assertOk();

        $user->refresh();

        $this->assertTrue(Hash::check('NewPass123!', $user->password_hash));
        $this->assertFalse(Hash::check('OldPass123!', $user->password_hash));
    }

    public function test_user_update_without_password_keeps_the_existing_password(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator', 'AdminPass123!');
        $user = $this->createUser('user@example.com', 'Requester', 'OldPass123!');
        $existingHash = $user->password_hash;

        $this->actingAs($admin, 'web')
            ->patchJson('/api/users/' . $user->id, ['first_name' => 'Updated'])
            ->assertOk();

        $user->refresh();

        $this->assertSame($existingHash, $user->password_hash);
        $this->assertTrue(Hash::check('OldPass123!', $user->password_hash));
    }

    public function test_user_update_rejects_a_weak_password(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator', 'AdminPass123!');
        $user = $this->createUser('user@example.com', 'Requester', 'OldPass123!');
        $existingHash = $user->password_hash;

        $this->actingAs($admin, 'web')
            ->patchJson('/api/users/' . $user->id, ['password' => 'password'])
            ->assertStatus(422);

        $user->refresh();

        $this->assertSame($existingHash, $user->password_hash);
        $this->assertTrue(Hash::check('OldPass123!', $user->password_hash));
    }

    private function createUser(string $email, string $role, string $password): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'full_name' => ucfirst(strtok($email, '@')),
            'email' => $email,
            'password_hash' => Hash::make($password),
            'role' => $role,
            'status' => 'active',
        ]);
    }
}

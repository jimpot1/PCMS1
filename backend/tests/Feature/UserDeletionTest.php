<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_permanently_delete_a_user_and_record_the_account_history(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator');
        $user = $this->createUser('requester@example.com', 'Requester');

        $this->actingAs($admin, 'web')
            ->deleteJson('/api/users/' . $user->id . '/permanent')
            ->assertOk()
            ->assertJsonPath('message', 'User permanently deleted and recorded in history.');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('deleted_user_histories', [
            'deleted_user_id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'role' => 'Requester',
            'deleted_by_id' => $admin->id,
            'deleted_by_email' => $admin->email,
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'user_permanently_deleted',
        ]);

        $this->actingAs($admin, 'web')
            ->getJson('/api/users/deleted-history')
            ->assertOk()
            ->assertJsonPath('data.0.email', $user->email)
            ->assertJsonPath('data.0.deleted_by_email', $admin->email);
    }

    public function test_admin_cannot_permanently_delete_their_own_account(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator');

        $this->actingAs($admin, 'web')
            ->deleteJson('/api/users/' . $admin->id . '/permanent')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You cannot permanently delete your own account.');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
        $this->assertDatabaseMissing('deleted_user_histories', [
            'deleted_user_id' => $admin->id,
        ]);
    }

    public function test_existing_delete_endpoint_still_deactivates_instead_of_permanently_deleting(): void
    {
        $admin = $this->createUser('admin@example.com', 'System Administrator');
        $user = $this->createUser('requester@example.com', 'Requester');

        $this->actingAs($admin, 'web')
            ->deleteJson('/api/users/' . $user->id)
            ->assertOk();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'status' => 'inactive',
        ]);
        $this->assertDatabaseMissing('deleted_user_histories', [
            'deleted_user_id' => $user->id,
        ]);
    }

    private function createUser(string $email, string $role): User
    {
        return User::create([
            'id' => (string) Str::uuid(),
            'full_name' => ucfirst(strtok($email, '@')),
            'email' => $email,
            'password_hash' => Hash::make('AdminPass123!'),
            'role' => $role,
            'status' => 'active',
        ]);
    }
}

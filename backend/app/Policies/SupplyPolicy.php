<?php

namespace App\Policies;

use App\Models\Supply;
use App\Models\User;

class SupplyPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function view(User $user, Supply $supply): bool
    {
        return $this->isInventoryManager($user);
    }

    public function create(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function update(User $user, Supply $supply): bool
    {
        return $this->isInventoryManager($user);
    }

    public function delete(User $user, Supply $supply): bool
    {
        return $this->isInventoryManager($user);
    }

    protected function isInventoryManager(User $user): bool
    {
        return in_array($user->role, ['Property Custodian', 'PPMO Staff', 'System Administrator', 'OIC'], true);
    }

    protected function isSystemAdministrator(User $user): bool
    {
        return $user->role === 'System Administrator';
    }
}

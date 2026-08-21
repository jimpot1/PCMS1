<?php

namespace App\Policies;

use App\Models\MaintenanceRecord;
use App\Models\User;

class MaintenanceRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function view(User $user, MaintenanceRecord $record): bool
    {
        return $this->isInventoryManager($user);
    }

    public function create(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function update(User $user, MaintenanceRecord $record): bool
    {
        return $this->isInventoryManager($user);
    }

    public function delete(User $user, MaintenanceRecord $record): bool
    {
        return $this->isInventoryManager($user);
    }

    protected function isInventoryManager(User $user): bool
    {
        return in_array($user->role, ['Property Custodian', 'PPMO Staff', 'System Administrator'], true);
    }

    protected function isSystemAdministrator(User $user): bool
    {
        return $user->role === 'System Administrator';
    }
}

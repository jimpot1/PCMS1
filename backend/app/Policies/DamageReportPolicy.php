<?php

namespace App\Policies;

use App\Models\DamageReport;
use App\Models\User;

class DamageReportPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function view(User $user, DamageReport $report): bool
    {
        return $this->isInventoryManager($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, DamageReport $report): bool
    {
        return $this->isInventoryManager($user);
    }

    public function delete(User $user, DamageReport $report): bool
    {
        return $this->isInventoryManager($user);
    }

    protected function isInventoryManager(User $user): bool
    {
        return in_array($user->role, ['Property Custodian', 'PPMO Staff', 'Department Head', 'System Administrator'], true);
    }

    protected function isSystemAdministrator(User $user): bool
    {
        return $user->role === 'System Administrator';
    }
}

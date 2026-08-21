<?php

namespace App\Policies;

use App\Models\Asset;
use App\Models\Department;
use App\Models\User;

class AssetPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Department Head', 'Property Custodian', 'PPMO Staff'], true);
    }

    public function view(User $user, Asset $asset): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Department Head') {
            return $this->sameDepartment($user, $asset->department_id);
        }

        return in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function create(User $user): bool
    {
        return $this->isInventoryManager($user);
    }

    public function update(User $user, Asset $asset): bool
    {
        return $this->isInventoryManager($user);
    }

    public function delete(User $user, Asset $asset): bool
    {
        return $this->isInventoryManager($user);
    }

    protected function sameDepartment(User $user, ?int $departmentId): bool
    {
        if ($departmentId === null || !$user->department) {
            return false;
        }

        return Department::query()
            ->where('name', $user->department)
            ->orWhere('code', $user->department)
            ->where('id', $departmentId)
            ->exists();
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

<?php

namespace App\Policies;

use App\Models\PhysicalAudit;
use App\Models\User;

class PhysicalAuditPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->canManage($user);
    }

    public function view(User $user, PhysicalAudit $audit): bool
    {
        return $this->canManage($user);
    }

    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    public function update(User $user, PhysicalAudit $audit): bool
    {
        return $this->canManage($user);
    }

    public function delete(User $user, PhysicalAudit $audit): bool
    {
        return $this->canManage($user);
    }

    protected function canManage(User $user): bool
    {
        return in_array($user->role, ['System Administrator', 'PPMO Staff', 'Property Custodian', 'OIC'], true);
    }
}
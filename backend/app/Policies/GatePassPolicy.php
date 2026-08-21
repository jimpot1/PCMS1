<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\GatePass;
use App\Models\User;

class GatePassPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Requester', 'Department Head', 'Property Custodian', 'OIC', 'PPMO Staff'], true);
    }

    public function view(User $user, GatePass $gatePass): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Requester') {
            return $gatePass->requested_by === $user->id;
        }

        if ($user->role === 'Department Head') {
            return $this->sameDepartment($user, $gatePass->department_id);
        }

        return in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff'], true);
    }

    public function create(User $user): bool
    {
        return $user->role === 'Requester'
            || in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff', 'System Administrator'], true);
    }

    public function update(User $user, GatePass $gatePass): bool
    {
        return $this->isSystemAdministrator($user)
            || ($gatePass->requested_by === $user->id && in_array($gatePass->status, ['pending', 'rejected'], true))
            || in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff'], true);
    }

    public function delete(User $user, GatePass $gatePass): bool
    {
        return $this->update($user, $gatePass);
    }

    public function approve(User $user, GatePass $gatePass): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Department Head') {
            return $gatePass->status === 'pending' && $this->sameDepartment($user, $gatePass->department_id);
        }

        return in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff'], true);
    }

    public function reject(User $user, GatePass $gatePass): bool
    {
        return $this->approve($user, $gatePass);
    }

    public function release(User $user, GatePass $gatePass): bool
    {
        return $this->isSystemAdministrator($user)
            || $user->role === 'Property Custodian'
            || $user->role === 'OIC';
    }

    public function returnGatePass(User $user, GatePass $gatePass): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        return $gatePass->requested_by === $user->id
            || in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff'], true);
    }

    public function scan(User $user, GatePass $gatePass): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Property Custodian', 'OIC', 'PPMO Staff'], true);
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

    protected function isSystemAdministrator(User $user): bool
    {
        return $user->role === 'System Administrator';
    }
}

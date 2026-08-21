<?php

namespace App\Policies;

use App\Models\AssetAssignment;
use App\Models\Department;
use App\Models\User;

class AssetAssignmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Property Custodian', 'PPMO Staff', 'Department Head'], true);
    }

    public function view(User $user, AssetAssignment $assignment): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($assignment->assigned_to === $user->id) {
            return true;
        }

        if ($user->role === 'Department Head') {
            return $this->sameDepartment($user, $assignment->department_id);
        }

        return in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['Property Custodian', 'PPMO Staff', 'System Administrator'], true);
    }

    public function update(User $user, AssetAssignment $assignment): bool
    {
        return $this->isSystemAdministrator($user)
            || $assignment->assigned_to === $user->id
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function delete(User $user, AssetAssignment $assignment): bool
    {
        return $this->update($user, $assignment);
    }

    public function accept(User $user, AssetAssignment $assignment): bool
    {
        return $this->isSystemAdministrator($user)
            || $assignment->assigned_to === $user->id
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function return(User $user, AssetAssignment $assignment): bool
    {
        return $this->accept($user, $assignment);
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

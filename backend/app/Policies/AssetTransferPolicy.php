<?php

namespace App\Policies;

use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\User;

class AssetTransferPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Requester', 'Department Head', 'Property Custodian', 'PPMO Staff'], true);
    }

    public function view(User $user, AssetTransfer $transfer): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Requester') {
            return $transfer->requested_by === $user->id;
        }

        if ($user->role === 'Department Head') {
            return $this->sameDepartment($user, $transfer->from_department_id) || $this->sameDepartment($user, $transfer->to_department_id);
        }

        return in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['Requester', 'Property Custodian', 'PPMO Staff', 'System Administrator'], true);
    }

    public function update(User $user, AssetTransfer $transfer): bool
    {
        return $this->isSystemAdministrator($user)
            || ($transfer->requested_by === $user->id && in_array($transfer->status, ['transfer_requested', 'revision_requested', 'on_hold'], true))
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function delete(User $user, AssetTransfer $transfer): bool
    {
        return $this->isSystemAdministrator($user)
            || ($transfer->requested_by === $user->id && in_array($transfer->status, ['transfer_requested', 'revision_requested', 'rejected', 'on_hold'], true))
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function approve(User $user, AssetTransfer $transfer): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Department Head') {
            return in_array($transfer->status, ['transfer_requested', 'pending'], true)
                && $this->sameDepartment($user, $transfer->from_department_id);
        }

        return in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function reject(User $user, AssetTransfer $transfer): bool
    {
        return $this->approve($user, $transfer);
    }

    public function hold(User $user, AssetTransfer $transfer): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
    }

    public function requestRevision(User $user, AssetTransfer $transfer): bool
    {
        return $this->hold($user, $transfer)
            || ($user->role === 'Department Head' && $this->sameDepartment($user, $transfer->from_department_id));
    }

    public function execute(User $user, AssetTransfer $transfer): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Property Custodian', 'PPMO Staff'], true);
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

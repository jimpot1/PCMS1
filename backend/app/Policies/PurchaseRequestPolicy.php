<?php

namespace App\Policies;

use App\Models\Department;
use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['Requester', 'Department Head', 'Recommending Approver', 'Property Custodian', 'OIC', 'PPMO Staff', 'President', 'CEO'], true);
    }

    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($this->isSystemAdministrator($user)) {
            return true;
        }

        if ($user->role === 'Requester') {
            return $purchaseRequest->requested_by === $user->id;
        }

        if ($user->role === 'Department Head') {
            return $this->sameDepartment($user, $purchaseRequest->department_id);
        }

        return match ($user->role) {
            'Recommending Approver' => $purchaseRequest->current_stage === 'recommending_approver' && $purchaseRequest->status === 'pending',
            'President', 'CEO' => $purchaseRequest->current_stage === 'president' && $purchaseRequest->status === 'pending',
            'Property Custodian', 'OIC' => $purchaseRequest->current_stage === 'property_custodian' && $purchaseRequest->status === 'approved',
            'PPMO Staff' => $purchaseRequest->status === 'approved'
                && ($purchaseRequest->workflow_destination === 'purchase_workflow'
                    ? $purchaseRequest->current_stage === 'property_custodian'
                    : $purchaseRequest->current_stage === 'ppmo_staff'),
            default => false,
        };
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['Requester', 'PPMO Staff'], true) || $this->isSystemAdministrator($user);
    }

    public function update(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->isSystemAdministrator($user)
            || ($user->role === 'Requester'
                && $purchaseRequest->requested_by === $user->id
                && in_array($purchaseRequest->status, ['draft', 'revision_requested'], true));
    }

    public function requestRevision(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($user->role === 'Department Head') {
            return $purchaseRequest->current_stage === 'department_head'
                && $purchaseRequest->status === 'pending'
                && $this->sameDepartment($user, $purchaseRequest->department_id);
        }

        return in_array($user->role, ['Recommending Approver', 'President', 'CEO'], true)
            && $purchaseRequest->status === 'pending'
            && $purchaseRequest->current_stage === match ($user->role) {
                'Recommending Approver' => 'recommending_approver',
                'President', 'CEO' => 'president',
            };
    }

    public function delete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->isSystemAdministrator($user)
            || ($user->role === 'Requester'
                && $purchaseRequest->requested_by === $user->id
                && in_array($purchaseRequest->status, ['draft', 'pending', 'revision_requested'], true));
    }

    public function advance(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($this->isSystemAdministrator($user) || $purchaseRequest->status === 'cancelled') {
            return $this->isSystemAdministrator($user) && $purchaseRequest->status !== 'cancelled';
        }

        return match ($user->role) {
            'Department Head' => $purchaseRequest->current_stage === 'department_head' && $this->sameDepartment($user, $purchaseRequest->department_id),
            'Recommending Approver' => $purchaseRequest->current_stage === 'recommending_approver',
            'Property Custodian', 'OIC' => $purchaseRequest->current_stage === 'property_custodian',
            'President', 'CEO' => $purchaseRequest->current_stage === 'president',
            default => false,
        };
    }

    public function reject(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->advance($user, $purchaseRequest);
    }

    public function release(User $user, PurchaseRequest $purchaseRequest): bool
    {
        if ($user->role === 'System Administrator') {
            return in_array($purchaseRequest->current_stage, ['property_custodian', 'ppmo_staff'], true);
        }

        if ($user->role === 'PPMO Staff') {
            $requiredStage = $purchaseRequest->workflow_destination === 'purchase_workflow' ? 'property_custodian' : 'ppmo_staff';
            return $purchaseRequest->current_stage === $requiredStage;
        }

        return in_array($user->role, ['System Administrator', 'Property Custodian', 'OIC'], true)
            && $purchaseRequest->current_stage === 'property_custodian';
    }

    public function verifyWalkInApproval(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $this->isSystemAdministrator($user)
            || in_array($user->role, ['PPMO Staff', 'Property Custodian', 'OIC'], true);
    }

    protected function sameDepartment(User $user, ?int $departmentId): bool
    {
        if ($departmentId === null || !$user->department) {
            return false;
        }

        return Department::query()
            ->whereKey($departmentId)
            ->where(function ($query) use ($user) {
                $query->where('name', $user->department)
                    ->orWhere('code', $user->department);
            })
            ->exists();
    }

    protected function isSystemAdministrator(User $user): bool
    {
        return $user->role === 'System Administrator';
    }
}

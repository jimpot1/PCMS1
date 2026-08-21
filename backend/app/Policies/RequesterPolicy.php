<?php

namespace App\Policies;

use App\Models\User;

class RequesterPolicy
{
    public function searchAssets(User $user): bool
    {
        return $user->role === 'Requester' || $this->isElevated($user);
    }

    public function searchSupplies(User $user): bool
    {
        return $user->role === 'Requester' || $this->isElevated($user);
    }

    public function createPurchaseRequest(User $user): bool
    {
        return $user->role === 'Requester' || $this->isElevated($user);
    }

    public function createGatePass(User $user): bool
    {
        return $user->role === 'Requester' || $this->isElevated($user);
    }

    protected function isElevated(User $user): bool
    {
        return in_array($user->role, ['Department Head', 'Property Custodian', 'PPMO Staff', 'President', 'CEO', 'System Administrator'], true);
    }
}

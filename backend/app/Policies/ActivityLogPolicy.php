<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['Admin', 'System Administrator', 'Property Custodian', 'PPMO Staff'], true);
    }

    public function view(User $user, ActivityLog $activityLog): bool
    {
        return in_array($user->role, ['Admin', 'System Administrator', 'Property Custodian', 'PPMO Staff'], true);
    }
}

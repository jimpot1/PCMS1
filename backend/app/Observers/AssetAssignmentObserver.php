<?php

namespace App\Observers;

use App\Models\AssetAssignment;

class AssetAssignmentObserver
{
    public function created(AssetAssignment $assignment): void
    {
        if ($assignment->status === 'active') {
            $assignment->asset()->update([
                'status' => 'assigned',
                'custodian_id' => $assignment->assigned_to,
            ]);
        }
    }

    public function updated(AssetAssignment $assignment): void
    {
        if ($assignment->wasChanged('status')) {
            if ($assignment->status === 'active') {
                $assignment->asset()->update([
                    'status' => 'assigned',
                    'custodian_id' => $assignment->assigned_to,
                ]);
            }

            if (in_array($assignment->status, ['returned', 'cancelled'], true)) {
                $asset = $assignment->asset;
                $hasActiveAssignments = $asset?->assignments()
                    ->where('id', '!=', $assignment->id)
                    ->where('status', 'active')
                    ->exists();

                if ($asset && ! $hasActiveAssignments) {
                    $asset->update([
                        'status' => $asset->condition === 'damaged' ? 'damaged' : 'available',
                        'custodian_id' => null,
                    ]);
                }
            }
        }
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetAssignment extends Model
{
    protected $table = 'asset_assignments';

    protected $fillable = [
        'asset_id',
        'assigned_to',
        'assigned_by',
        'department_id',
        'assignment_type',
        'quantity',
        'purpose',
        'condition_before',
        'condition_after',
        'photo_path',
        'assigned_at',
        'due_date',
        'returned_at',
        'accepted_at',
        'employee_signature',
        'custodian_signature',
        'status',
        'approval_status',
        'rejection_reason',
        'notes',
        'return_notes',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'due_date' => 'date',
        'returned_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

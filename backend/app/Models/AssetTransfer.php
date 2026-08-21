<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetTransfer extends Model
{
    protected $table = 'asset_transfers';

    protected $fillable = [
        'transfer_number',
        'asset_id',
        'from_department_id',
        'to_department_id',
        'to_custodian_id',
        'from_custodian_id',
        'requested_by',
        'approved_by',
        'department_approved_by',
        'executed_by',
        'status',
        'rejection_reason',
        'risk_score',
        'reason',
        'approval_notes',
        'revision_notes',
        'hold_reason',
        'remarks',
        'quantity',
        'transfer_type',
        'expected_return_date',
        'transfer_date',
        'actual_quantity',
        'condition_before',
        'condition_after',
        'photo_before_path',
        'photo_after_path',
        'receiving_signature',
        'releasing_signature',
    ];

    protected $casts = [
        'risk_score' => 'float',
        'expected_return_date' => 'date',
        'transfer_date' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function fromDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function fromCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_custodian_id');
    }

    public function toCustodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_custodian_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GatePass extends Model
{
    protected $table = 'gate_passes';

    protected $fillable = [
        'gate_pass_number',
        'asset_id',
        'requested_by',
        'department_id',
        'purpose',
        'destination',
        'vehicle',
        'driver',
        'quantity',
        'condition_before',
        'condition_after',
        'valid_until',
        'release_date',
        'qr_code_path',
        'approved_by',
        'returned_at',
        'receiving_signature',
        'receiving_photo_path',
        'security_remarks',
        'attachment_path',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'valid_until' => 'datetime',
        'release_date' => 'datetime',
        'returned_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}

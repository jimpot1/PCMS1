<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditSupplyCount extends Model
{
    protected $table = 'audit_supply_counts';

    protected $fillable = [
        'audit_id',
        'supply_id',
        'expected_quantity',
        'counted_quantity',
        'variance',
        'status',
        'notes',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(PhysicalAudit::class, 'audit_id');
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(Supply::class);
    }
}
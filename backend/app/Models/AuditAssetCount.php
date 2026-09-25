<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditAssetCount extends Model
{
    protected $table = 'audit_asset_counts';

    protected $fillable = [
        'audit_id',
        'asset_id',
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

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
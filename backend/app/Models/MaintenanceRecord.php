<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceRecord extends Model
{
    protected $table = 'maintenance_records';

    protected $fillable = [
        'asset_id',
        'type',
        'priority',
        'status',
        'technician',
        'scheduled_at',
        'completed_at',
        'cost',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
        'cost' => 'float',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}

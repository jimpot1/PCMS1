<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DamageReport extends Model
{
    protected $table = 'damage_reports';

    protected $fillable = [
        'asset_id',
        'reported_by',
        'department_id',
        'incident_type',
        'severity',
        'description',
        'assessment_notes',
        'assessed_by',
        'assessed_at',
        'photo_path',
        'status',
        'disposal_reference',
        'resolved_at',
    ];

    protected $casts = [
        'assessed_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

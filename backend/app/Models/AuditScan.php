<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditScan extends Model
{
    protected $table = 'audit_scans';

    public $timestamps = false;

    protected $fillable = [
        'audit_id',
        'asset_id',
        'found_department_id',
        'result',
        'scanned_at',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(PhysicalAudit::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function foundDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'found_department_id');
    }
}

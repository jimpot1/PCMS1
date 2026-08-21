<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhysicalAudit extends Model
{
    protected $table = 'physical_audits';

    protected $fillable = [
        'audit_number',
        'area',
        'department_id',
        'auditor_id',
        'scheduled_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function auditScans(): HasMany
    {
        return $this->hasMany(AuditScan::class, 'audit_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}

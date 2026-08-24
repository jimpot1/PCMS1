<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetUnit extends Model
{
    protected $table = 'asset_units';

    protected $fillable = [
        'asset_id',
        'unit_code',
        'serial_number',
        'status',
        'department_id',
        'custodian_id',
        'condition',
        'location',
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function custodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'custodian_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(AssetUnitMovement::class);
    }
}

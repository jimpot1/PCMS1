<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetUnitMovement extends Model
{
    protected $table = 'asset_unit_movements';

    protected $fillable = [
        'asset_unit_id',
        'asset_id',
        'movement_type',
        'from_department_id',
        'to_department_id',
        'from_custodian_id',
        'to_custodian_id',
        'reference_type',
        'reference_id',
        'remarks',
    ];

    public function assetUnit(): BelongsTo
    {
        return $this->belongsTo(AssetUnit::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}

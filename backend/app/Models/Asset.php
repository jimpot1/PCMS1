<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Asset extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'asset_id',
        'property_number',
        'serial_number',
        'name',
        'brand',
        'model',
        'description',
        'category_id',
        'department_id',
        'custodian_id',
        'current_holder_id',
        'last_assigned_at',
        'purchase_request_id',
        'location',
        'condition',
        'status',
        'purchase_date',
        'purchase_cost',
        'quantity',
        'available_quantity',
        'supplier_id',
        'warranty_until',
        'depreciation_rate',
        'qr_code_path',
        'image_path',
        'remarks',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class);
    }

    public function currentAssignment(): HasOne
    {
        return $this->hasOne(AssetAssignment::class)->where('status', 'active')->latestOfMany();
    }
}

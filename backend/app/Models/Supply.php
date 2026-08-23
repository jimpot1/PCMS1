<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supply extends Model
{
    protected $table = 'supplies';

    protected $fillable = [
        'sku',
        'name',
        'unit',
        'category',
        'description',
        'stock',
        'minimum_stock',
        'unit_price',
        'expiration_date',
        'supplier_id',
        'department_id',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'unit_price' => 'float',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}

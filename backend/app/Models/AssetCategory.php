<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssetCategory extends Model
{
    protected $fillable = ['name', 'code', 'depreciation_rate', 'useful_life_years', 'is_active'];
}

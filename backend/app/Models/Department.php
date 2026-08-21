<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'code', 'location', 'head_user_id', 'custodian_user_id', 'is_active'];
}

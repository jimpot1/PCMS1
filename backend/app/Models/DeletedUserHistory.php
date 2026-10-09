<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletedUserHistory extends Model
{
    protected $fillable = [
        'deleted_user_id',
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'email',
        'role',
        'department',
        'status',
        'deleted_by_id',
        'deleted_by_name',
        'deleted_by_email',
        'deleted_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];
}
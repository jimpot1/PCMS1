<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'employee_id',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'email',
        'password_hash',
        'role',
        'department',
        'status',
        'failed_login_attempts',
        'locked_until',
        'last_failed_login_at',
    ];

    protected $hidden = ['password_hash', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'locked_until' => 'datetime',
        'last_failed_login_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (! $user->getKey()) {
                $user->{$user->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}

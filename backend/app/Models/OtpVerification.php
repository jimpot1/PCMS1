<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OtpVerification extends Model
{
    use HasUuids;

    protected $table = 'otp_verifications';

    protected $fillable = [
        'user_id',
        'otp_hash',
        'expires_at',
        'attempts',
        'is_used',
        'used_at',
        'last_sent_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function markUsed(): void
    {
        $this->forceFill([
            'is_used' => true,
            'used_at' => now(),
        ])->save();
    }
}

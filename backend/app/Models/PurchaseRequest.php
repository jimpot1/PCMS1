<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequest extends Model
{
    protected $table = 'purchase_requests';

    protected $fillable = [
        'request_number',
        'procurement_for_request_id',
        'requested_by',
        'department_id',
        'replenishment_supply_id',
        'auto_generated',
        'current_stage',
        'status',
        'rejection_reason',
        'request_type',
        'workflow_destination',
        'department_name',
        'unit',
        'branch',
        'priority',
        'date_needed',
        'purpose',
        'requested_by_name',
        'attachment_path',
        'approval_document_path',
        'approval_status',
        'verified_by',
        'verified_at',
        'verification_notes',
        'line_items',
        'timeline',
        'total_amount',
        'released_by',
        'released_at',
        'receipt_number',
        'receipt_document_path',
        'receipt_generated_at',
        'is_walk_in',
        'walk_in_created_by',
        'walk_in_requester_name',
        'walk_in_requester_contact',
        'walk_in_has_account',
        'walk_in_notes',
        'expected_delivery_date',
        'stock_received_date',
        'received_quantity',
        'qc_status',
        'qc_notes',
        'qc_performed_by',
        'qc_performed_at',
        'receiving_notes',
        'receiving_photo_path',
        'procurement_status',
        'procurement_timeline',
    ];

    protected $casts = [
        'total_amount' => 'float',
        'line_items' => 'array',
        'timeline' => 'array',
        'date_needed' => 'date',
        'released_at' => 'datetime',
        'receipt_generated_at' => 'datetime',
        'verified_at' => 'datetime',
        'is_walk_in' => 'boolean',
        'walk_in_has_account' => 'boolean',
        'auto_generated' => 'boolean',
        'expected_delivery_date' => 'datetime',
        'stock_received_date' => 'datetime',
        'received_quantity' => 'array',
        'qc_performed_at' => 'datetime',
        'procurement_timeline' => 'array',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function procurementForRequest(): BelongsTo
    {
        return $this->belongsTo(self::class, 'procurement_for_request_id');
    }
}

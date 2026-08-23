<?php

namespace App\Providers;

use App\Models\ActivityLog;
use App\Models\Asset;
use App\Models\AssetAssignment;
use App\Models\AssetTransfer;
use App\Models\DamageReport;
use App\Models\GatePass;
use App\Models\MaintenanceRecord;
use App\Models\PurchaseRequest;
use App\Models\PhysicalAudit;
use App\Models\Supply;
use App\Policies\ActivityLogPolicy;
use App\Policies\AssetAssignmentPolicy;
use App\Policies\AssetPolicy;
use App\Policies\AssetTransferPolicy;
use App\Policies\DamageReportPolicy;
use App\Policies\GatePassPolicy;
use App\Policies\MaintenanceRecordPolicy;
use App\Policies\PurchaseRequestPolicy;
use App\Policies\PhysicalAuditPolicy;
use App\Policies\SupplyPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        PurchaseRequest::class => PurchaseRequestPolicy::class,
        Asset::class => AssetPolicy::class,
        Supply::class => SupplyPolicy::class,
        AssetAssignment::class => AssetAssignmentPolicy::class,
        AssetTransfer::class => AssetTransferPolicy::class,
        GatePass::class => GatePassPolicy::class,
        DamageReport::class => DamageReportPolicy::class,
        MaintenanceRecord::class => MaintenanceRecordPolicy::class,
        ActivityLog::class => ActivityLogPolicy::class,
        PhysicalAudit::class => PhysicalAuditPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}

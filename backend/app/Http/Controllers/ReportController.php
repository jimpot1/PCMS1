<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function export(Request $request, string $type)
    {
        $format = $request->input('format', 'json');

        return match ($type) {
            'audit-summary' => $this->auditSummary($format),
            'damage-summary' => $this->damageSummary($format),
            'anomaly-summary' => $this->anomalySummary($format),
            'assignment-summary' => $this->assignmentSummary($format),
            'transfer-summary' => $this->transferSummary($format),
            default => response()->json(['message' => 'Report type not found.'], 404),
        };
    }

    private function auditSummary(string $format)
    {
        $audits = DB::table('physical_audits')
            ->select('id', 'audit_number', 'area', 'scheduled_at', 'status', 'created_at')
            ->get();

        $auditDetails = [];
        foreach ($audits as $audit) {
            $scans = DB::table('audit_scans')
                ->where('audit_id', $audit->id)
                ->select('result')
                ->get();

            $auditDetails[] = [
                'audit_number' => $audit->audit_number,
                'area' => $audit->area,
                'status' => $audit->status,
                'verified' => $scans->where('result', 'verified')->count(),
                'missing' => $scans->where('result', 'missing')->count(),
                'wrong_department' => $scans->where('result', 'wrong_department')->count(),
                'total_scans' => $scans->count(),
                'scheduled_at' => $audit->scheduled_at,
                'created_at' => $audit->created_at,
            ];
        }

        $data = [
            'report_type' => 'Audit Summary',
            'generated_at' => now()->toIso8601String(),
            'total_audits' => count($auditDetails),
            'audits' => $auditDetails,
        ];

        if ($format === 'pdf') {
            return $this->generatePdf($data, 'audit-summary');
        }

        return response()->json($data);
    }

    private function damageSummary(string $format)
    {
        $reports = DB::table('damage_reports')
            ->select('id', 'severity', 'status', 'created_at')
            ->get();

        $byStatus = $reports->groupBy('status')->map(fn ($items) => $items->count());
        $bySeverity = $reports->groupBy('severity')->map(fn ($items) => $items->count());

        $data = [
            'report_type' => 'Damage Report Summary',
            'generated_at' => now()->toIso8601String(),
            'total_reports' => $reports->count(),
            'by_status' => $byStatus->toArray(),
            'by_severity' => $bySeverity->toArray(),
            'reports' => $reports->toArray(),
        ];

        if ($format === 'pdf') {
            return $this->generatePdf($data, 'damage-summary');
        }

        return response()->json($data);
    }

    private function anomalySummary(string $format)
    {
        $alerts = DB::table('anomaly_alerts')
            ->select('id', 'source_type', 'priority', 'status', 'created_at', 'updated_at', 'reason')
            ->get();

        $byType = $alerts->groupBy('source_type')->map(fn ($items) => $items->count());
        $byStatus = $alerts->groupBy('status')->map(fn ($items) => $items->count());
        $byPriority = $alerts->groupBy('priority')->map(fn ($items) => $items->count());

        // Calculate resolution time for resolved anomalies
        $resolvedAnomalies = DB::table('anomaly_alerts')
            ->where('status', 'resolved')
            ->select('created_at', 'updated_at')
            ->get();

        $avgResolutionTime = $resolvedAnomalies->count() > 0
            ? $resolvedAnomalies->map(fn ($a) => strtotime($a->updated_at) - strtotime($a->created_at))->avg() / 3600
            : 0;

        $data = [
            'report_type' => 'Anomaly Summary',
            'generated_at' => now()->toIso8601String(),
            'total_anomalies' => $alerts->count(),
            'by_type' => $byType->toArray(),
            'by_status' => $byStatus->toArray(),
            'by_priority' => $byPriority->toArray(),
            'avg_resolution_time_hours' => round($avgResolutionTime, 2),
            'anomalies' => $alerts->toArray(),
        ];

        if ($format === 'pdf') {
            return $this->generatePdf($data, 'anomaly-summary');
        }

        return response()->json($data);
    }

    private function assignmentSummary(string $format)
    {
        $assignments = DB::table('asset_assignments')
            ->select('id', 'asset_id', 'assigned_to', 'department_id', 'assigned_at', 'due_date', 'returned_at', 'status', 'created_at')
            ->get();

        $byStatus = $assignments->groupBy('status')->map(fn ($items) => $items->count());

        $overdue = $assignments
            ->where('status', 'active')
            ->filter(fn ($a) => $a->due_date && strtotime($a->due_date) < strtotime(now()->toDateString()))
            ->count();

        $data = [
            'report_type' => 'Asset Assignment Summary',
            'generated_at' => now()->toIso8601String(),
            'total_assignments' => $assignments->count(),
            'by_status' => $byStatus->toArray(),
            'overdue' => $overdue,
            'assignments' => $assignments->toArray(),
        ];

        if ($format === 'pdf') {
            return $this->generatePdf($data, 'assignment-summary');
        }

        return response()->json($data);
    }

    private function transferSummary(string $format)
    {
        $transfers = DB::table('asset_transfers')
            ->select('id', 'transfer_number', 'asset_id', 'from_department_id', 'to_department_id', 'status', 'created_at', 'updated_at')
            ->get();

        $byStatus = $transfers->groupBy('status')->map(fn ($items) => $items->count());
        $byToDepartment = $transfers->groupBy('to_department_id')->map(fn ($items) => $items->count());

        $approvedTransfers = $transfers->where('status', 'approved');
        $avgApprovalTimeHours = $approvedTransfers->count() > 0
            ? $approvedTransfers->map(fn ($t) => strtotime($t->updated_at) - strtotime($t->created_at))->avg() / 3600
            : 0;

        $data = [
            'report_type' => 'Asset Transfer Summary',
            'generated_at' => now()->toIso8601String(),
            'total_transfers' => $transfers->count(),
            'by_status' => $byStatus->toArray(),
            'by_to_department' => $byToDepartment->toArray(),
            'avg_approval_time_hours' => round($avgApprovalTimeHours, 2),
            'transfers' => $transfers->toArray(),
        ];

        if ($format === 'pdf') {
            return $this->generatePdf($data, 'transfer-summary');
        }

        return response()->json($data);
    }

    private function generatePdf(array $data, string $filename)
    {
        // For now, return JSON with a message about PDF generation
        // In production, use a library like 'barryvdh/laravel-dompdf'
        return response()->json([
            'message' => 'PDF generation not implemented yet. Data provided in JSON format.',
            'data' => $data,
            'pdf_url' => null,
        ]);
    }
}

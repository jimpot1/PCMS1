<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Services\ActivityLogFormatter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityLogController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(ActivityLog::class, 'activityLog');
    }

    public function index(Request $request): JsonResponse
    {
        $logs = DB::table('activity_logs')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50));

        $logs->getCollection()->transform(function ($row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];

            return [
                'id' => $row->id,
                'action' => $row->action,
                'text' => ActivityLogFormatter::format($row->action, $payload),
                'payload' => $payload,
                'status' => $row->status,
                'user' => $payload['user'] ?? null,
                'email' => $payload['email'] ?? null,
                'ip' => $payload['ip'] ?? null,
                'user_agent' => $payload['user_agent'] ?? null,
                'time' => $row->created_at,
                'updated_at' => $row->updated_at,
            ];
        });

        return response()->json($logs);
    }
}

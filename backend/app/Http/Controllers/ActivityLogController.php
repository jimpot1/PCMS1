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

        $payloads = [];
        $actorIdentifiers = [];
        foreach ($logs->getCollection() as $row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];
            $payloads[$row->id] = $payload;
            $identifiers = [
                $payload['user'] ?? null,
                $payload['email'] ?? null,
                $payload['username'] ?? null,
                $payload['performed_by'] ?? null,
            ];
            if ($row->action === 'user_logged_in') {
                $identifiers[] = $payload['user_id'] ?? null;
            }
            foreach ($identifiers as $identifier) {
                if (is_string($identifier) || is_int($identifier)) {
                    $actorIdentifiers[] = (string) $identifier;
                }
            }
        }

        $actorIdentifiers = collect($actorIdentifiers)->filter()->unique()->values();
        $actorUsers = $actorIdentifiers->isEmpty()
            ? collect()
            : DB::table('users')
                ->whereIn('id', $actorIdentifiers)
                ->orWhereIn('email', $actorIdentifiers)
                ->orWhereIn('employee_id', $actorIdentifiers)
                ->get(['id', 'email', 'employee_id', 'first_name', 'last_name']);
        $usersByIdentity = collect();
        foreach ($actorUsers as $actorUser) {
            foreach ([$actorUser->id, $actorUser->email, $actorUser->employee_id] as $identity) {
                if ($identity) {
                    $usersByIdentity->put(strtolower((string) $identity), $actorUser);
                }
            }
        }

        $logs->getCollection()->transform(function ($row) use ($payloads, $usersByIdentity) {
            $payload = $payloads[$row->id] ?? [];
            $actorReferences = [
                $row->action === 'user_logged_in' ? ($payload['user_id'] ?? null) : null,
                $payload['email'] ?? null,
                $payload['user'] ?? null,
                $payload['username'] ?? null,
                $payload['performed_by'] ?? null,
            ];
            $actorUser = null;
            foreach ($actorReferences as $reference) {
                if ($reference && $usersByIdentity->has(strtolower((string) $reference))) {
                    $actorUser = $usersByIdentity->get(strtolower((string) $reference));
                    break;
                }
            }
            $userName = trim(implode(' ', array_filter([
                $payload['first_name'] ?? $actorUser?->first_name,
                $payload['last_name'] ?? $actorUser?->last_name,
            ])));
            $userName = $userName ?: ($payload['user_name'] ?? $payload['user'] ?? $payload['email'] ?? null);

            return [
                'id' => $row->id,
                'action' => $row->action,
                'text' => ActivityLogFormatter::format($row->action, $payload),
                'payload' => $payload,
                'status' => $row->status,
                'user' => $userName,
                'user_name' => $userName,
                'role' => $payload['role'] ?? null,
                'email' => $payload['email'] ?? null,
                'username' => $payload['username'] ?? null,
                'ip' => $payload['ip'] ?? null,
                'user_agent' => $payload['user_agent'] ?? null,
                'time' => $row->created_at,
                'updated_at' => $row->updated_at,
            ];
        });

        return response()->json($logs)->header('Cache-Control', 'private, no-store');
    }
}

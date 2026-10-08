<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
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

        $entries = $logs->getCollection()->map(function ($row) {
            $payload = json_decode($row->payload ?? '{}', true) ?: [];
            if (! is_array($payload)) {
                $payload = [];
            }

            return ['row' => $row, 'payload' => $payload];
        });

        $userIds = $entries->pluck('payload')
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values();
        $emails = $entries->pluck('payload')
            ->flatMap(fn (array $payload) => [
                $payload['email'] ?? null,
                filter_var($payload['user'] ?? null, FILTER_VALIDATE_EMAIL) ? $payload['user'] : null,
                filter_var($payload['user_name'] ?? null, FILTER_VALIDATE_EMAIL) ? $payload['user_name'] : null,
            ])
            ->filter()
            ->unique()
            ->values();
        $usernames = $entries->pluck('payload')
            ->flatMap(fn (array $payload) => [
                $payload['username'] ?? null,
                $payload['employee_id'] ?? null,
            ])
            ->filter()
            ->unique()
            ->values();

        $users = collect();
        if ($userIds->isNotEmpty() || $emails->isNotEmpty() || $usernames->isNotEmpty()) {
            $users = User::query()
                ->select(['id', 'first_name', 'middle_name', 'last_name', 'full_name', 'email', 'employee_id', 'role'])
                ->where(function ($query) use ($userIds, $emails, $usernames) {
                    if ($userIds->isNotEmpty()) {
                        $query->whereIn('id', $userIds);
                    }
                    if ($emails->isNotEmpty()) {
                        $method = $userIds->isNotEmpty() ? 'orWhereIn' : 'whereIn';
                        $query->{$method}('email', $emails);
                    }
                    if ($usernames->isNotEmpty()) {
                        $method = $userIds->isNotEmpty() || $emails->isNotEmpty() ? 'orWhereIn' : 'whereIn';
                        $query->{$method}('employee_id', $usernames);
                    }
                })
                ->get();
        }

        $usersById = $users->keyBy('id');
        $usersByEmail = $users->keyBy(fn (User $user) => strtolower($user->email));
        $usersByUsername = $users->keyBy(fn (User $user) => strtolower($user->employee_id ?? ''));

        $logs->getCollection()->transform(function ($row, $index) use ($entries, $usersById, $usersByEmail, $usersByUsername) {
            $payload = $entries[$index]['payload'];
            $payloadEmail = $payload['email'] ?? null;
            $payloadUser = $payload['user'] ?? null;
            $payloadUsername = $payload['username'] ?? $payload['employee_id'] ?? null;
            $actor = ($payload['user_id'] ?? null)
                ? $usersById->get($payload['user_id'])
                : null;

            if (! $actor && is_string($payloadEmail) && $payloadEmail !== '') {
                $actor = $usersByEmail->get(strtolower($payloadEmail));
            }
            if (! $actor && is_string($payloadUser) && filter_var($payloadUser, FILTER_VALIDATE_EMAIL)) {
                $actor = $usersByEmail->get(strtolower($payloadUser));
            }
            if (! $actor && is_string($payloadUsername) && $payloadUsername !== '') {
                $actor = $usersByUsername->get(strtolower($payloadUsername));
            }

            $actorName = $actor
                ? ($actor->full_name ?: trim(implode(' ', array_filter([
                    $actor->first_name,
                    $actor->middle_name,
                    $actor->last_name,
                ]))) ?: $actor->email)
                : ($payload['user_name'] ?? null);
            if (! $actorName && is_string($payloadUser) && ! filter_var($payloadUser, FILTER_VALIDATE_EMAIL)) {
                $actorName = $payloadUser;
            }

            return [
                'id' => $row->id,
                'action' => $row->action,
                'text' => ActivityLogFormatter::format($row->action, $payload),
                'payload' => $payload,
                'status' => $row->status,
                'user' => $actorName ?? $payloadUser ?? $payloadEmail,
                'user_name' => $actorName,
                'role' => $actor?->role ?? $payload['role'] ?? null,
                'email' => $actor?->email ?? $payloadEmail,
                'username' => $actor?->employee_id ?? $payloadUsername,
                'ip' => $payload['ip'] ?? $payload['ip_address'] ?? null,
                'user_agent' => $payload['user_agent'] ?? null,
                'time' => $row->created_at,
                'updated_at' => $row->updated_at,
            ];
        });

        return response()->json($logs);
    }
}

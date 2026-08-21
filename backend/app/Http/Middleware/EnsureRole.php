<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = auth()->user();
        $role = $user->role ?? 'Employee';

        if (!in_array($role, $roles, true)) {
            return response()->json(['message' => 'This PCMS role cannot access the requested resource.'], 403);
        }

        return $next($request);
    }
}

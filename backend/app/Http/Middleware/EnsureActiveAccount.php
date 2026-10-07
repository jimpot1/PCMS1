<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public const INACTIVE_ACCOUNT_MESSAGE = 'This account has been deactivated by an administrator. Please contact your system administrator if you believe this is a mistake.';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status !== 'active') {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json([
                'message' => self::INACTIVE_ACCOUNT_MESSAGE,
                'account_deactivated' => true,
            ], 403);
        }

        return $next($request);
    }
}

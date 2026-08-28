<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOGIN_LOCKOUT_MINUTES = 1;
    private const LOGIN_RATE_LIMIT_SECONDS = 60;

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        $email = strtolower(trim($request->input('email')));
        $rateLimitKey = 'login:' . $email . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($rateLimitKey, self::MAX_LOGIN_ATTEMPTS)) {
            return response()->json([
                'message' => 'Too many login attempts. Please try again in a minute.',
            ], 429, ['Retry-After' => RateLimiter::availableIn($rateLimitKey)]);
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user?->locked_until && $user->locked_until->isFuture()) {
            return response()->json([
                'message' => 'This account is temporarily locked. Please try again later.',
            ], 423, ['Retry-After' => now()->diffInSeconds($user->locked_until)]);
        }

        if ($user?->locked_until && $user->locked_until->isPast()) {
            $user->forceFill([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ])->save();
        }

        if (! $user || ! Hash::check($request->input('password'), $user->password_hash)) {
            RateLimiter::hit($rateLimitKey, self::LOGIN_RATE_LIMIT_SECONDS);

            if ($user) {
                $failedAttempts = $user->failed_login_attempts + 1;
                $lockedUntil = $failedAttempts >= self::MAX_LOGIN_ATTEMPTS
                    ? now()->addMinutes(self::LOGIN_LOCKOUT_MINUTES)
                    : null;

                $user->forceFill([
                    'failed_login_attempts' => $failedAttempts,
                    'locked_until' => $lockedUntil,
                    'last_failed_login_at' => now(),
                ])->save();

                $this->logLoginFailure($request, $user, $lockedUntil ? 'login_locked' : 'login_failed');
            } else {
                $this->logLoginFailure($request, null, 'login_failed');
            }

            if ($user && $user->failed_login_attempts >= self::MAX_LOGIN_ATTEMPTS) {
                return response()->json([
                    'message' => 'This account is temporarily locked. Please try again later.',
                ], 423, ['Retry-After' => self::LOGIN_LOCKOUT_MINUTES * 60]);
            }

            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        Auth::login($user);
        $request->session()->regenerate();
        RateLimiter::clear($rateLimitKey);
        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_failed_login_at' => null,
        ])->save();

        return response()->json(['user' => $user]);
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('current_password'), $user->password_hash)) {
            return response()->json(['message' => 'Current password is incorrect.'], 403);
        }

        $user->password_hash = Hash::make($request->input('new_password'));
        $user->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    private function logLoginFailure(Request $request, ?User $user, string $action): void
    {
        DB::table('activity_logs')->insert([
            'action' => $action,
            'payload' => json_encode([
                'action' => $action,
                'email' => $request->input('email'),
                'user_id' => $user?->id,
                'user' => $user?->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

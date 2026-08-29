<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_MINUTES = 1;

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        $user = User::where('email', $request->input('email'))->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // Check if account is locked
        if ($user->locked_until && Carbon::now()->lessThan($user->locked_until)) {
            $remainingSeconds = Carbon::now()->diffInSeconds($user->locked_until);
            return response()->json([
                'message' => "Account is temporarily locked. Please try again in {$remainingSeconds} seconds.",
                'locked' => true,
                'remaining_seconds' => $remainingSeconds
            ], 423);
        }

        // Unlock if lockout period has expired
        if ($user->locked_until && Carbon::now()->greaterThanOrEqualTo($user->locked_until)) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        if (! Auth::guard('web')->attempt([
            'email' => $request->input('email'),
            'password' => $request->input('password'),
        ])) {
            // Increment failed login attempts
            $user->failed_login_attempts++;
            $user->last_failed_login_at = Carbon::now();

            // Lock account if max attempts exceeded
            if ($user->failed_login_attempts >= self::MAX_LOGIN_ATTEMPTS) {
                $user->locked_until = Carbon::now()->addMinutes(self::LOCKOUT_DURATION_MINUTES);
                $user->save();

                return response()->json([
                    'message' => "Too many failed login attempts. Account locked for " . self::LOCKOUT_DURATION_MINUTES . " minute(s).",
                    'locked' => true,
                    'remaining_seconds' => 60 * self::LOCKOUT_DURATION_MINUTES
                ], 423);
            }

            $user->save();

            $remainingAttempts = self::MAX_LOGIN_ATTEMPTS - $user->failed_login_attempts;
            return response()->json([
                'message' => 'Invalid email or password.',
                'attempts_remaining' => $remainingAttempts
            ], 401);
        }

        // Reset failed login attempts on successful login
        if ($user->failed_login_attempts > 0 || $user->locked_until) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }

        $request->session()->regenerate();

        return response()->json(['user' => Auth::guard('web')->user()]);
    }

    public function logout(Request $request)
    {
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

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

}

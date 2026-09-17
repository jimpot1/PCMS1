<?php

namespace App\Http\Controllers;

use App\Models\OtpVerification;
use App\Models\User;
use App\Services\OtpVerificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;
    private const LOCKOUT_DURATION_MINUTES = 1;

    public function __construct(private OtpVerificationService $otpVerificationService)
    {
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid email or password.'], 422);
        }

        $identifier = trim((string) $request->input('email'));
        $user = User::where('email', $identifier)
            ->orWhere('employee_id', $identifier)
            ->first();

        if (! $user) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->locked_until && Carbon::now()->lessThan($user->locked_until)) {
            $remainingSeconds = Carbon::now()->diffInSeconds($user->locked_until);
            return response()->json([
                'message' => "Account is temporarily locked. Please try again in {$remainingSeconds} seconds.",
                'locked' => true,
                'remaining_seconds' => $remainingSeconds,
            ], 423);
        }

        if ($user->locked_until && Carbon::now()->greaterThanOrEqualTo($user->locked_until)) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        if (! Hash::check($request->input('password'), $user->password_hash)) {
            $user->failed_login_attempts++;
            $user->last_failed_login_at = Carbon::now();

            if ($user->failed_login_attempts >= self::MAX_LOGIN_ATTEMPTS) {
                $user->locked_until = Carbon::now()->addMinutes(self::LOCKOUT_DURATION_MINUTES);
                $user->save();

                return response()->json([
                    'message' => "Too many failed login attempts. Account locked for " . self::LOCKOUT_DURATION_MINUTES . " minute(s).",
                    'locked' => true,
                    'remaining_seconds' => 60 * self::LOCKOUT_DURATION_MINUTES,
                ], 423);
            }

            $user->save();
            $remainingAttempts = self::MAX_LOGIN_ATTEMPTS - $user->failed_login_attempts;

            return response()->json([
                'message' => 'Invalid email or password.',
                'attempts_remaining' => $remainingAttempts,
            ], 401);
        }

        $user->failed_login_attempts = 0;
        $user->locked_until = null;
        $user->save();

        try {
            $otpData = $this->otpVerificationService->createForUser($user);
        } catch (\Throwable $throwable) {
            return response()->json(['message' => $throwable->getMessage()], 429);
        }

        return response()->json([
            'message' => 'A verification code has been sent to your email.',
            'requires_otp' => true,
            'user' => [
                'id' => $user->id,
                'email' => $this->otpVerificationService->maskEmail($user->email),
                'full_name' => $user->full_name,
                'role' => $user->role,
            ],
            'masked_email' => $this->otpVerificationService->maskEmail($user->email),
            'resend_cooldown_seconds' => $otpData['resend_cooldown_seconds'],
            'expires_in_seconds' => $otpData['expires_in_seconds'],
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string',
            'otp' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 422);
        }

        $user = User::find($request->input('user_id'));

        if (! $user) {
            return response()->json(['message' => 'Invalid or expired verification code.'], 422);
        }

        try {
            $this->otpVerificationService->verifyOtp($user, $request->input('otp'));
        } catch (\Throwable $throwable) {
            return response()->json(['message' => $throwable->getMessage()], 422);
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Verification successful.',
            'user' => Auth::guard('web')->user(),
        ]);
    }

    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid user session.'], 422);
        }

        $user = User::find($request->input('user_id'));

        if (! $user) {
            return response()->json(['message' => 'Invalid user session.'], 404);
        }

        try {
            $otpData = $this->otpVerificationService->createForUser($user);
        } catch (\Throwable $throwable) {
            return response()->json(['message' => $throwable->getMessage()], 429);
        }

        return response()->json([
            'message' => 'A new verification code has been sent to your email.',
            'masked_email' => $this->otpVerificationService->maskEmail($user->email),
            'resend_cooldown_seconds' => $otpData['resend_cooldown_seconds'],
            'expires_in_seconds' => $otpData['expires_in_seconds'],
        ]);
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


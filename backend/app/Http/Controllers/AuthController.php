<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
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

        if (! $user || ! Hash::check($request->input('password'), $user->password_hash)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status !== 'active') {
            return response()->json(['message' => 'Account is not active.'], 403);
        }

        Auth::login($user);
        $request->session()->regenerate();

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

}

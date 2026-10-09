<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UserController
{
    private const ROLE_OPTIONS = [
        'System Administrator',
        'Property Custodian',
        'PPMO Staff',
        'OIC',
        'Department Head',
        'Recommending Approver',
        'Requester',
        'President / CEO',
    ];

    private const LEGACY_ROLES = ['President', 'CEO'];

    protected static function normalizeRole(?string $role): ?string
    {
        if (in_array($role, self::LEGACY_ROLES, true)) {
            return 'President / CEO';
        }

        return $role;
    }

    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->search, function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('full_name', 'ilike', "%{$value}%")
                        ->orWhere('email', 'ilike', "%{$value}%")
                        ->orWhere('employee_id', 'ilike', "%{$value}%");
                });
            })
            ->when($request->role, fn ($query, $value) => $query->where('role', $value))
            ->orderBy('full_name')
            ->paginate($request->integer('per_page', 50));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['nullable', 'string', 'max:40'],
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['nullable', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
            'password_confirmation' => ['nullable', 'string'],
            'role' => ['required', 'string', 'in:' . implode(',', [...self::ROLE_OPTIONS, ...self::LEGACY_ROLES])],
            'department' => ['nullable', 'string', 'max:160'],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        $validated['role'] = self::normalizeRole($validated['role']);
        $temporaryPassword = $validated['password'] ?? Str::password(12, symbols: true);
        $fullName = trim("{$validated['first_name']} " . (($validated['middle_name'] ?? null) ? "{$validated['middle_name']} " : '') . $validated['last_name']);

        $user = User::create([
            'employee_id' => $validated['employee_id'] ?? null,
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'full_name' => $fullName,
            'email' => $validated['email'],
            'password_hash' => Hash::make($temporaryPassword),
            'role' => $validated['role'],
            'department' => $validated['department'] ?? null,
            'status' => 'active',
        ]);

        return response()->json([
            'user' => $user,
            'temporary_password' => ($validated['password'] ?? null) ? null : $temporaryPassword,
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['sometimes', 'nullable', 'string', 'max:40'],
            'first_name' => ['sometimes', 'string', 'max:80'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:80'],
            'last_name' => ['sometimes', 'string', 'max:80'],
            'email' => ['sometimes', 'email', 'max:160', 'unique:users,email,' . $user->id],
            'password' => ['sometimes', 'nullable', 'string', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
            'password_confirmation' => ['sometimes', 'nullable', 'string'],
            'role' => ['sometimes', 'string', 'in:' . implode(',', [...self::ROLE_OPTIONS, ...self::LEGACY_ROLES])],
            'department' => ['sometimes', 'nullable', 'string', 'max:160'],
            'status' => ['sometimes', 'in:active,inactive'],
        ], [
            'password.min' => 'Password must be at least 8 characters long.',
            'password.confirmed' => 'Password confirmation does not match.',
        ]);

        if (isset($validated['first_name']) || isset($validated['last_name']) || isset($validated['middle_name'])) {
            $firstName = $validated['first_name'] ?? $user->first_name;
            $middleName = array_key_exists('middle_name', $validated) ? $validated['middle_name'] : $user->middle_name;
            $lastName = $validated['last_name'] ?? $user->last_name;
            $validated['full_name'] = trim("{$firstName} " . ($middleName ? "{$middleName} " : '') . $lastName);
        }

        if (isset($validated['role'])) {
            $validated['role'] = self::normalizeRole($validated['role']);
        }

        if (filled($validated['password'] ?? null)) {
            $user->password_hash = Hash::make($validated['password']);
        }
        unset($validated['password']);

        $user->update($validated);

        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->update(['status' => 'inactive']);

        return response()->json(['message' => 'User deactivated.']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController
{
    public function index(): JsonResponse
    {
        $departments = Department::orderBy('name')->get();

        return response()->json($departments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:32', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:160'],
            'location' => ['nullable', 'string', 'max:160'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $department = Department::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json($department, 201);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:32', 'unique:departments,code,' . $department->id],
            'name' => ['sometimes', 'string', 'max:160'],
            'location' => ['sometimes', 'nullable', 'string', 'max:160'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $department->update($validated);

        return response()->json($department->fresh());
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->update(['is_active' => false]);

        return response()->json(['message' => 'Department deactivated.']);
    }
}

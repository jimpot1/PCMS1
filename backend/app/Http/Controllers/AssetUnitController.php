<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssetUnitController extends Controller
{
    public function index(Asset $asset): JsonResponse
    {
        $units = AssetUnit::query()
            ->where('asset_id', $asset->id)
            ->with(['department', 'custodian'])
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $units,
            'asset_id' => $asset->id,
            'total_units' => $units->count(),
        ]);
    }

    public function store(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'unit_code' => ['nullable', 'string', 'max:80'],
            'serial_number' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:available,assigned,in_transit,maintenance,damaged,disposed'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'custodian_id' => ['nullable', 'exists:users,id'],
            'condition' => ['nullable', 'string', 'max:40'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['asset_id'] = $asset->id;

        $unit = AssetUnit::create($validated);

        return response()->json($unit, 201);
    }
}

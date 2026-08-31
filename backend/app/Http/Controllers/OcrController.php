<?php

namespace App\Http\Controllers;

use App\Services\GoogleVisionOcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OcrController
{
    public function history(Request $request): JsonResponse
    {
        $scans = DB::table('ocr_scans')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        $scans->getCollection()->transform(function ($scan) {
            $payload = json_decode($scan->extracted_payload ?? '{}', true) ?: [];

            return [
                'id' => $scan->id,
                'asset_id' => $scan->asset_id,
                'image_path' => $scan->image_path,
                'confidence' => max(0, min(100, (float) $scan->confidence_score)),
                'status' => $scan->asset_id ? 'registered' : 'pending_review',
                'fields' => $payload['fields'] ?? $payload['details'] ?? [],
                'created_at' => $scan->created_at,
            ];
        });

        return response()->json($scans);
    }

    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:20480'],
        ]);

        if (! $request->hasFile('image') || ! $request->file('image')->isValid()) {
            Log::warning('OCR scan failed: missing or invalid upload', ['has_file' => $request->hasFile('image')]);

            return response()->json([
                'success' => false,
                'message' => 'No image uploaded or the image is invalid.',
                'confidence' => 0,
                'data' => [],
            ], 200);
        }

        $file = $request->file('image');
        Log::info('OCR upload received', [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getClientMimeType(),
        ]);

        $result = GoogleVisionOcrService::scan(file_get_contents($file->path()));

        Log::info('OCR scan result', [
            'success' => $result['success'],
            'confidence' => $result['confidence'],
            'error' => $result['error'],
        ]);

        $fields = $result['fields'] ?? [];
        $storedImagePath = $file->store('ocr-scans', 'public');

        $scanId = DB::table('ocr_scans')->insertGetId([
            'asset_id' => null,
            'image_path' => $storedImagePath,
            'extracted_payload' => json_encode([
                'image_name' => $file->getClientOriginalName(),
                'image_size' => $file->getSize(),
                'mime_type' => $file->getClientMimeType(),
                'success' => $result['success'],
                'fields' => $fields,
                'details' => $result['details'] ?? $fields,
            ]),
            'confidence_score' => $result['confidence'],
            'confirmed_by' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $confidence = max(0, min(100, (float) $result['confidence']));

        $details = $result['details'] ?? $fields;

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'scan_id' => $scanId,
            'processing_status' => $result['success'] ? 'completed' : 'needs_review',
            'confidence' => $confidence,
            'data' => [
                'property_number' => $details['property_number'] ?? null,
                'serial_number' => $details['serial_number'] ?? null,
                'brand' => $details['brand'] ?? null,
                'model' => $details['model'] ?? null,
                'asset_name' => $details['asset_name'] ?? null,
                'description' => $details['description'] ?? null,
                'department' => $details['department'] ?? null,
                'location' => $details['location'] ?? null,
                'purchase_date' => $details['purchase_date'] ?? null,
                'purchase_cost' => $details['purchase_cost'] ?? null,
                'quantity' => $details['quantity'] ?? 1,
                'warranty_until' => $details['warranty_until'] ?? null,
                'condition' => $details['condition'] ?? 'Good',
            ],
            'details' => $details,
            'error' => $result['error'],
        ], 200);
    }
}

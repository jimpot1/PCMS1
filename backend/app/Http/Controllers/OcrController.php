<?php

namespace App\Http\Controllers;

use App\Services\GoogleVisionOcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\SystemSettingController;
use Illuminate\Support\Facades\Schema;

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
                'field_confidence' => $payload['field_confidence'] ?? [],
                'field_details' => $payload['field_details'] ?? [],
                'items' => $payload['items'] ?? [],
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

        $scanData = [
            'asset_id' => null,
            'image_path' => $storedImagePath,
            'extracted_payload' => json_encode([
                'image_name' => $file->getClientOriginalName(),
                'image_size' => $file->getSize(),
                'mime_type' => $file->getClientMimeType(),
                'success' => $result['success'],
                'fields' => $fields,
                'details' => $result['details'] ?? $fields,
                'field_confidence' => $result['field_confidence'] ?? [],
                'field_details' => $result['field_details'] ?? [],
                'items' => $result['items'] ?? [],
            ]),
            'confidence_score' => $result['confidence'],
            'confirmed_by' => null,
            'created_at' => now(),
        ];

        if (Schema::hasColumn('ocr_scans', 'updated_at')) {
            $scanData['updated_at'] = now();
        }

        $scanId = DB::table('ocr_scans')->insertGetId($scanData);

        $confidence = max(0, min(100, (float) $result['confidence']));
        $confidenceThreshold = SystemSettingController::integer('ocr_confidence_threshold', 80);
        $needsReview = ! $result['success'] || $confidence < $confidenceThreshold;

        $details = $result['details'] ?? $fields;

        return response()->json([
            'success' => $result['success'],
            'message' => $needsReview && $result['success']
                ? "OCR completed below the configured confidence threshold ({$confidenceThreshold}%). Review the extracted fields."
                : $result['message'],
            'scan_id' => $scanId,
            'processing_status' => $needsReview ? 'needs_review' : 'completed',
            'confidence' => $confidence,
            'confidence_threshold' => $confidenceThreshold,
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
                'quantity' => $details['quantity'] ?? null,
                'warranty_until' => $details['warranty_until'] ?? null,
                'condition' => $details['condition'] ?? null,
            ],
            'details' => $details,
            'field_confidence' => $result['field_confidence'] ?? [],
            'field_details' => $result['field_details'] ?? [],
            'items' => $result['items'] ?? [],
            'error' => $result['error'],
        ], 200);
    }
}

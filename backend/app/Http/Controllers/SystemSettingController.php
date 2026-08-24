<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemSettingController extends Controller
{
    private const DEFAULTS = [
        'recommending_approver_enabled' => true,
        'maintenance_reminder_days' => 7,
        'low_stock_auto_requisition_enabled' => true,
        'ocr_confidence_threshold' => 80,
        'anomaly_risk_threshold' => 8,
    ];

    public function index(): JsonResponse
    {
        $saved = SystemSetting::query()->pluck('value', 'key');
        $settings = collect(self::DEFAULTS)->map(fn ($value, $key) => array_key_exists($key, $saved->all())
            ? filter_var($saved[$key], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (is_numeric($saved[$key]) ? (int) $saved[$key] : $saved[$key])
            : $value);
        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recommending_approver_enabled' => ['sometimes', 'boolean'],
            'maintenance_reminder_days' => ['sometimes', 'integer', 'in:1,3,7,14'],
            'low_stock_auto_requisition_enabled' => ['sometimes', 'boolean'],
            'ocr_confidence_threshold' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'anomaly_risk_threshold' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);
        foreach ($validated as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['value' => is_bool($value) ? ($value ? 'true' : 'false') : (string) $value, 'updated_by' => $request->user()->id]);
        }
        DB::table('activity_logs')->insert(['action' => 'system_settings_updated', 'payload' => json_encode(['action' => 'system_settings_updated', 'settings' => array_keys($validated), 'user' => $request->user()->email]), 'status' => 'active', 'created_at' => now(), 'updated_at' => now()]);
        return $this->index();
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        return $value === null ? $default : filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function integer(string $key, int $default): int
    {
        $value = SystemSetting::query()->where('key', $key)->value('value');
        return is_numeric($value) ? (int) $value : $default;
    }
}

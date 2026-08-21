<?php

namespace App\Services;

class ActivityLogFormatter
{
    public static function format(?string $action, array $payload): string
    {
        $label = ucfirst(str_replace('_', ' ', $action ?? 'activity'));

        $identifierKeys = ['transfer_number', 'gate_pass_number', 'request_number', 'audit_number', 'property_number', 'sku'];
        foreach ($identifierKeys as $key) {
            if (! empty($payload[$key])) {
                return "{$label}: {$payload[$key]}";
            }
        }

        return $label;
    }
}

<?php

namespace App\Services;

use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\Feature\Type as FeatureType;
use Google\Cloud\Vision\V1\Image;

class GoogleVisionOcrService
{
    public static function scan(string $imageContents): array
    {
        $client = null;

        try {
            $credentials = self::credentialsConfig();
            $client = new ImageAnnotatorClient([
                'credentialsConfig' => $credentials,
                'transport' => 'rest',
            ]);

            $image = (new Image())->setContent($imageContents);
            $feature = (new Feature())->setType(FeatureType::DOCUMENT_TEXT_DETECTION);
            $request = (new AnnotateImageRequest())->setImage($image)->setFeatures([$feature]);
            $batchRequest = (new BatchAnnotateImagesRequest())->setRequests([$request]);

            $batchResponse = $client->batchAnnotateImages($batchRequest);
            $imageResponse = $batchResponse->getResponses()[0];

            if ($imageResponse->hasError()) {
                throw new \RuntimeException('Google Vision API error: ' . $imageResponse->getError()->getMessage());
            }

            $fullTextAnnotation = $imageResponse->getFullTextAnnotation();
            $rawText = $fullTextAnnotation ? $fullTextAnnotation->getText() : '';

            if (trim($rawText) === '') {
                throw new \RuntimeException('OCR returned empty text');
            }

            $confidences = [];
            if ($fullTextAnnotation) {
                foreach ($fullTextAnnotation->getPages() as $page) {
                    $confidences[] = $page->getConfidence();
                }
            }
            $confidence = count($confidences) > 0
                ? (array_sum($confidences) / count($confidences)) * 100
                : 0;

            $layoutLines = self::extractLayoutLines($fullTextAnnotation);
            $fields = self::extractFields($layoutLines !== [] ? implode("\n", $layoutLines) : $rawText);

            return [
                'success' => true,
                'message' => 'OCR completed.',
                'confidence' => round($confidence, 2),
                'fields' => $fields,
                'details' => $fields,
                'error' => null,
            ];
        } catch (\Throwable $exception) {
            return [
                'success' => false,
                'message' => 'OCR failed.',
                'confidence' => 0,
                'fields' => [],
                'details' => [],
                'error' => $exception->getMessage(),
            ];
        } finally {
            $client?->close();
        }
    }

    protected static function credentialsConfig(): array
    {
        $base64 = trim((string) config('services.google_vision.credentials_base64', ''));

        if ($base64 !== '') {
            $json = base64_decode($base64, true);

            if ($json === false) {
                throw new \RuntimeException('GOOGLE_VISION_CREDENTIALS_BASE64 is not valid Base64.');
            }

            $credentials = json_decode($json, true);

            if (! is_array($credentials) || empty($credentials['client_email']) || empty($credentials['private_key'])) {
                throw new \RuntimeException('GOOGLE_VISION_CREDENTIALS_BASE64 does not contain a valid service-account JSON key.');
            }

            return ['keyFile' => $credentials];
        }

        $path = trim((string) config('services.google_vision.credentials_path', ''));

        if ($path === '') {
            throw new \RuntimeException('Google Vision credentials are not configured.');
        }

        if (! is_file($path) || ! is_readable($path)) {
            throw new \RuntimeException("Google Vision credentials file is missing or unreadable: {$path}");
        }

        return ['keyFilePath' => $path];
    }

    protected static function extractFields(string $text): array
    {
        $lines = array_values(array_filter(array_map(
            fn ($line) => self::normalizeLine($line),
            preg_split('/\R/', $text) ?: []
        )));

        if ($lines === []) {
            return self::emptyFields();
        }

        $fields = self::emptyFields();

        // Queue of field keys waiting for a value, in the order their labels appeared.
        $pendingFields = [];

        // The field currently "open" for multi-line accumulation (only used for description).
        $openField = null;
        $descriptionLines = [];

        $flushDescription = function () use (&$fields, &$descriptionLines) {
            if ($descriptionLines !== []) {
                $fields['description'] = self::normalizeDescription($descriptionLines);
                $descriptionLines = [];
            }
        };

        foreach ($lines as $line) {
            if (self::isIgnorableLine($line)) {
                continue;
            }

            $fieldKey = self::detectField($line);

            // OCR may return a sequence of labels without values. Never use a
            // label-only line as the value of the preceding pending field.
            if ($fieldKey !== null && self::isLabelOnly($line, $fieldKey)) {
                if ($openField === 'description') {
                    $flushDescription();
                    $openField = null;
                }
                $pendingFields = [$fieldKey];
                continue;
            }

            if ($fieldKey !== null && $pendingFields !== [] && ! preg_match('/^[^:]{1,80}:\s*/', $line)) {
                $fieldKey = null;
            }

            // Description values may contain words that are also field labels.
            // Only a colon-delimited label should close the multiline value.
            $hasInlineValue = $fieldKey !== null && self::extractInlineValue($line, $fieldKey) !== null;
            $isLabelOnly = $fieldKey !== null && self::isLabelOnly($line, $fieldKey);
            if ($openField === 'description' && ! $hasInlineValue && ! $isLabelOnly) {
                $descriptionLines[] = $line;
                continue;
            }

            if ($fieldKey !== null) {
                // A new label line closes out any open multi-line description.
                if ($openField === 'description') {
                    $flushDescription();
                    $openField = null;
                }

                $inlineValue = self::extractInlineValue($line, $fieldKey);
                if ($inlineValue !== null && $inlineValue !== '') {
                    // "Label: value" on the same line — fill immediately, nothing queued.
                    $fields[$fieldKey] = self::normalizeValue($fieldKey, $inlineValue);
                    if ($fieldKey === 'description') {
                        $openField = 'description';
                        $descriptionLines = [$inlineValue];
                    }
                    continue;
                }

                // Label with no inline value — queue it instead of clobbering
                // whatever field was already waiting.
                $pendingFields[] = $fieldKey;
                continue;
            }

            // Not a label line — it's a value for the oldest pending field.
            if ($openField === 'description') {
                $descriptionLines[] = $line;
                continue;
            }

            if (empty($pendingFields)) {
                continue;
            }

            $targetField = array_shift($pendingFields);

            if ($targetField === 'description') {
                $openField = 'description';
                $descriptionLines[] = $line;
                continue;
            }

            if ($fields[$targetField] === null) {
                $fields[$targetField] = self::normalizeValue($targetField, $line);
            }
        }

        // Flush a description that was still open at end of text.
        if ($openField === 'description') {
            $flushDescription();
        }

        if ($fields['asset_name'] === null && ($fields['brand'] !== null || $fields['model'] !== null)) {
            $combinedName = self::clean(implode(' ', array_filter([$fields['brand'], $fields['model']]))) ?? null;
            $fields['asset_name'] = $combinedName;
        }

        if ($fields['brand'] === null && $fields['manufacturer'] !== null) {
            $fields['brand'] = $fields['manufacturer'];
        }

        if ($fields['purchase_date'] !== null) {
            $fields['purchase_date'] = self::normalizeDate($fields['purchase_date']);
        }

        if ($fields['warranty_until'] !== null) {
            $fields['warranty_until'] = self::normalizeDate($fields['warranty_until']);
        }

        if ($fields['purchase_cost'] !== null) {
            $fields['purchase_cost'] = self::normalizeCost($fields['purchase_cost']);
        }

        if ($fields['quantity'] === null) {
            $fields['quantity'] = '1';
        }

        if ($fields['condition'] === null) {
            $fields['condition'] = 'Good';
        }

        return array_filter($fields, fn ($value) => $value !== null && $value !== '');
    }

    protected static function isLabelOnly(string $line, string $fieldKey): bool
    {
        $normalized = strtolower(trim(self::normalizeLine($line)));
        $normalized = preg_replace('/[\s:：#.-]+$/u', '', $normalized) ?? $normalized;
        $labels = [
            'property_number' => ['property number', 'property no', 'property no#', 'property #'],
            'asset_name' => ['asset name', 'item name', 'equipment'],
            'brand' => ['brand'],
            'manufacturer' => ['manufacturer', 'mfr', 'mfg'],
            'model' => ['model'],
            'serial_number' => ['serial number', 'serial no', 'serial', 'sn'],
            'description' => ['description'],
            'department' => ['department'],
            'location' => ['location'],
            'purchase_date' => ['purchase date', 'date acquired'],
            'purchase_cost' => ['purchase cost', 'cost', 'amount'],
            'quantity' => ['quantity'],
            'warranty_until' => ['warranty until', 'warranty expiry', 'warranty end', 'warranty'],
            'condition' => ['condition'],
        ];

        return in_array($normalized, $labels[$fieldKey] ?? [], true);
    }

    protected static function extractLayoutLines($annotation): array
    {
        $words = [];
        foreach ($annotation?->getPages() ?? [] as $page) {
            foreach ($page->getBlocks() as $block) {
                foreach ($block->getParagraphs() as $paragraph) {
                    foreach ($paragraph->getWords() as $word) {
                        $text = self::clean(implode('', array_map(
                            fn ($symbol) => $symbol->getText(),
                            iterator_to_array($word->getSymbols())
                        )));
                        $vertices = iterator_to_array($word->getBoundingBox()?->getVertices() ?? []);
                        if ($text === null || $vertices === []) {
                            continue;
                        }

                        $x = min(array_map(fn ($vertex) => $vertex->getX(), $vertices));
                        $y = min(array_map(fn ($vertex) => $vertex->getY(), $vertices));
                        $height = max(array_map(fn ($vertex) => $vertex->getY(), $vertices)) - $y;
                        $words[] = ['text' => $text, 'x' => $x, 'y' => $y, 'height' => max(1, $height)];
                    }
                }
            }
        }

        usort($words, fn ($left, $right) => $left['y'] <=> $right['y'] ?: $left['x'] <=> $right['x']);
        $rows = [];
        foreach ($words as $word) {
            $rowIndex = null;
            foreach ($rows as $index => $row) {
                $threshold = max(6, min($word['height'], $row['height']) * 0.7);
                if (abs($word['y'] - $row['y']) <= $threshold) {
                    $rowIndex = $index;
                    break;
                }
            }

            if ($rowIndex === null) {
                $rows[] = ['y' => $word['y'], 'height' => $word['height'], 'words' => [$word]];
            } else {
                $rows[$rowIndex]['words'][] = $word;
                $rows[$rowIndex]['y'] = min($rows[$rowIndex]['y'], $word['y']);
                $rows[$rowIndex]['height'] = max($rows[$rowIndex]['height'], $word['height']);
            }
        }

        usort($rows, fn ($left, $right) => $left['y'] <=> $right['y']);

        return array_values(array_map(function ($row) {
            usort($row['words'], fn ($left, $right) => $left['x'] <=> $right['x']);
            return implode(' ', array_column($row['words'], 'text'));
        }, $rows));
    }

    protected static function emptyFields(): array
    {
        return [
            'property_number' => null,
            'asset_name' => null,
            'brand' => null,
            'manufacturer' => null,
            'model' => null,
            'serial_number' => null,
            'description' => null,
            'department' => null,
            'location' => null,
            'purchase_date' => null,
            'purchase_cost' => null,
            'quantity' => null,
            'warranty_until' => null,
            'condition' => null,
        ];
    }

    protected static function detectField(string $line): ?string
    {
        $normalizedLine = self::normalizeLine($line);

        if ($normalizedLine === '') {
            return null;
        }

        if (preg_match('/\b(property\s*(number|no|#))\b/i', $normalizedLine)) {
            return 'property_number';
        }

        if (preg_match('/\b(asset\s*name|item\s*name|equipment)\b/i', $normalizedLine)) {
            return 'asset_name';
        }

        if (preg_match('/\b(brand|manufacturer|mfr|mfg)\b/i', $normalizedLine)) {
            return 'brand';
        }

        if (preg_match('/\bmodel\b/i', $normalizedLine)) {
            return 'model';
        }

        if (preg_match('/\b(serial\s*(number|no)?|sn)\b/i', $normalizedLine)) {
            return 'serial_number';
        }

        if (preg_match('/\bdescription\b/i', $normalizedLine)) {
            return 'description';
        }

        if (preg_match('/\bdepartment\b/i', $normalizedLine)) {
            return 'department';
        }

        if (preg_match('/\blocation\b/i', $normalizedLine)) {
            return 'location';
        }

        if (preg_match('/\b(purchase\s*date|date\s*acquired)\b/i', $normalizedLine)) {
            return 'purchase_date';
        }

        if (preg_match('/\b(purchase\s*cost|cost|amount)\b/i', $normalizedLine)) {
            return 'purchase_cost';
        }

        if (preg_match('/\bquantity\b/i', $normalizedLine)) {
            return 'quantity';
        }

        if (preg_match('/\b(warranty\s*(until|expiry|end)?|warranty)\b/i', $normalizedLine)) {
            return 'warranty_until';
        }

        if (preg_match('/\bcondition\b/i', $normalizedLine)) {
            return 'condition';
        }

        return null;
    }

    protected static function extractInlineValue(string $line, string $fieldKey): ?string
    {
        $normalizedLine = self::normalizeLine($line);

        if ($normalizedLine === '') {
            return null;
        }

        $labelPattern = match ($fieldKey) {
            'property_number' => '(?:property\\s*(?:number|no|#))',
            'asset_name' => '(?:asset\\s*name|item\\s*name|equipment)',
            'brand' => '(?:brand|manufacturer|mfr|mfg)',
            'model' => 'model',
            'serial_number' => '(?:serial\\s*(?:number|no)?|sn)',
            'description' => 'description',
            'department' => 'department',
            'location' => 'location',
            'purchase_date' => '(?:purchase\\s*date|date\\s*acquired)',
            'purchase_cost' => '(?:purchase\\s*cost|cost|amount)',
            'quantity' => 'quantity',
            'warranty_until' => '(?:warranty\\s*(?:until|expiry|end)?|warranty)',
            'condition' => 'condition',
            default => null,
        };

        if ($labelPattern === null || ! preg_match('/^' . $labelPattern . '(?:\\s*[:：-]\\s*|\\s+)(.*)$/iu', $normalizedLine, $matches)) {
            return null;
        }

        $value = self::clean($matches[1] ?? null);

        if ($fieldKey === 'brand' && preg_match('/\bmanufacturer\b/i', $normalizedLine)) {
            return $value;
        }

        return $value;
    }

    protected static function normalizeValue(string $fieldKey, string $value): ?string
    {
        $value = self::clean($value);

        if ($value === null) {
            return null;
        }

        return match ($fieldKey) {
            'property_number' => self::clean($value),
            'asset_name' => self::clean($value),
            'brand' => self::clean($value),
            'manufacturer' => self::clean($value),
            'model' => self::clean($value),
            'serial_number' => self::clean($value),
            'description' => self::clean($value),
            'department' => self::clean($value),
            'location' => self::clean($value),
            'purchase_date' => self::normalizeDate($value),
            'purchase_cost' => self::normalizeCost($value),
            'quantity' => self::normalizeQuantity($value),
            'warranty_until' => self::normalizeDate($value),
            'condition' => self::clean($value),
            default => self::clean($value),
        };
    }

    protected static function normalizeDescription(array $lines): ?string
    {
        $joined = self::clean(implode(' ', $lines));

        if ($joined === null) {
            return null;
        }

        return preg_replace('/\s+/', ' ', $joined);
    }

    protected static function normalizeDate(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = self::clean($value);
        if ($value === null) {
            return null;
        }

        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'F j Y', 'j F Y', 'M j Y', 'j M Y'];

        foreach ($formats as $format) {
            $date = \DateTimeImmutable::createFromFormat('!' . $format, $value);
            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        return $value;
    }

    protected static function normalizeCost(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/[^0-9.]/', '', self::clean($value) ?? '');
        if ($digits === '') {
            return null;
        }

        $digits = str_replace(',', '', $digits);
        $parts = explode('.', $digits);
        if (count($parts) > 2) {
            $parts = [$parts[0], implode('', array_slice($parts, 1))];
        }

        if (count($parts) === 2) {
            $whole = rtrim($parts[0], '.');
            $decimal = substr($parts[1], 0, 2);
            return $whole . '.' . $decimal;
        }

        return $parts[0];
    }

    protected static function normalizeQuantity(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', self::clean($value) ?? '');
        return $digits === '' ? '1' : $digits;
    }

    protected static function isIgnorableLine(string $line): bool
    {
        $normalizedLine = self::normalizeLine($line);

        if ($normalizedLine === '') {
            return true;
        }

        if (preg_match('/\b(sample\s*data|sample|field|instruction|instructions|table\s*header)\b/i', $normalizedLine)) {
            return true;
        }

        return false;
    }

    protected static function normalizeLine(?string $line): string
    {
        if ($line === null) {
            return '';
        }

        $cleaned = trim($line);
        $cleaned = preg_replace('/^[\-\*•]+\s*/u', '', $cleaned);
        $cleaned = preg_replace('/\s+/', ' ', $cleaned);

        return trim($cleaned ?? '');
    }

    protected static function clean(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $cleaned = trim(preg_replace('/\s+/', ' ', $value));

        return $cleaned === '' ? null : $cleaned;
    }
}
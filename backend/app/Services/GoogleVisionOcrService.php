<?php

namespace App\Services;

use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\Feature\Type as FeatureType;
use Google\Cloud\Vision\V1\Image;
use Illuminate\Support\Facades\Log;

class GoogleVisionOcrService
{
    public static function scan(string $imageContents): array
    {
        $client = null;

        try {
            $credentials = self::credentialsConfig();
            $client = new ImageAnnotatorClient([
                'credentials' => $credentials,
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

            $layoutRows = self::extractLayoutRows($fullTextAnnotation);
            $layoutLines = array_map(fn (array $row) => self::layoutRowText($row), $layoutRows);
            if (config('app.debug')) {
                Log::debug('OCR parsing stages', [
                    'raw_text' => $rawText,
                    'ocr_words' => array_map(fn ($row) => $row['words'] ?? [], $layoutRows),
                    'reconstructed_rows' => $layoutLines,
                    'detected_headings' => array_values(array_filter($layoutLines, fn ($line) => self::isHeading($line))),
                    'detected_labels' => array_map(fn ($row) => self::findLabelsInWords($row['words'] ?? []), $layoutRows),
                ]);
            }
            $fields = self::extractFields($layoutLines !== [] ? implode("\n", $layoutLines) : $rawText, $layoutRows);
            $items = $fields['_items'] ?? [];
            unset($fields['_items']);
            $fieldConfidence = self::fieldConfidence($fields);
            $fieldDetails = self::fieldDetails($fields, $fieldConfidence);
            if (config('app.debug')) {
                Log::debug('OCR final field mapping', [
                    'fields' => $fields,
                    'field_confidence' => $fieldConfidence,
                    'items' => $items,
                ]);
            }

            return [
                'success' => true,
                'message' => 'OCR completed.',
                'confidence' => round($confidence, 2),
                'fields' => $fields,
                'details' => $fields,
                'field_confidence' => $fieldConfidence,
                'field_details' => $fieldDetails,
                'items' => $items,
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

    protected static function credentialsConfig(): array|string
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

            return $credentials;
        }

        $path = trim((string) config('services.google_vision.credentials_path', ''));

        if ($path === '') {
            throw new \RuntimeException('Google Vision credentials are not configured.');
        }

        if (! is_file($path) || ! is_readable($path)) {
            throw new \RuntimeException("Google Vision credentials file is missing or unreadable: {$path}");
        }

        return $path;
    }

    protected static function extractFields(string $text, array $layoutRows = []): array
    {
        $lines = array_values(array_filter(array_map(
            fn ($line) => self::normalizeLine($line),
            preg_split('/\R/', $text) ?: []
        )));

        if ($lines === [] && $layoutRows === []) {
            return self::emptyFields();
        }

        $fields = self::emptyFields();
        $tableItems = [];

        if ($layoutRows !== []) {
            [$fields, $tableItems] = self::extractStructuredRows($layoutRows);
        }

        // Text-only fixtures and OCR responses without geometry still get a
        // conservative label/value pass. It never infers one field from another.
        if ($layoutRows === []) {
            $tableItems = self::extractDelimitedTableItems($lines);
        }
        if ($layoutRows === [] || count(array_filter($fields)) === 0) {
            $fields = self::mergeFields($fields, self::extractTextFields($lines));
        }

        if ($fields['brand'] === null && $fields['manufacturer'] !== null) {
            $fields['brand'] = $fields['manufacturer'];
        }

        if ($tableItems !== []) {
            foreach ($tableItems[0] as $key => $value) {
                if ($value !== null && $value !== '') {
                    $fields[$key] = $value;
                }
            }
            $fields['_items'] = $tableItems;
        }

        return array_filter($fields, fn ($value) => $value !== null && $value !== '');
    }

    protected static function extractStructuredRows(array $layoutRows): array
    {
        $fields = self::emptyFields();
        $tableItems = [];
        $tableHeader = null;
        $pending = null;

        foreach ($layoutRows as $index => $row) {
            $words = $row['words'] ?? [];
            $text = self::layoutRowText($row);
            if ($text === '' || self::isHeading($text)) {
                continue;
            }

            $labels = self::findLabelsInWords($words);
            if (count($labels) >= 2 && self::isTableHeaderRow($words, $labels)) {
                $tableHeader = ['index' => $index, 'labels' => $labels, 'words' => $words];
                continue;
            }

            if ($tableHeader !== null && $index > $tableHeader['index']) {
                $item = self::mapTableDataRow($tableHeader, $row);
                $nonEmpty = array_filter($item, fn ($value) => $value !== null && $value !== '');
                if (count($nonEmpty) >= 2) {
                    $tableItems[] = self::completeItem($item);
                    continue;
                }
                if (count($nonEmpty) === 1 && $tableItems !== []) {
                    $continuationField = array_key_first($nonEmpty);
                    $continuationValue = $nonEmpty[$continuationField];
                    if ($continuationField === 'serial_number' && ! preg_match('/^[A-Z0-9]+(?:[-_][A-Z0-9]+)+$/i', $continuationValue)) {
                        $last = array_key_last($tableItems);
                        $tableItems[$last]['description'] = self::normalizeDescription([
                            $tableItems[$last]['description'] ?? '',
                            $continuationValue,
                        ]);
                        continue;
                    }
                }
                // A later section heading or unrelated label row ends the current table.
                $tableHeader = null;
            }

            if ($labels !== []) {
                foreach ($labels as $labelIndex => $label) {
                    $nextStart = $labels[$labelIndex + 1]['start'] ?? count($words);
                    $valueWords = array_slice($words, $label['end'], $nextStart - $label['end']);
                    $value = self::wordsText($valueWords);
                    if ($value !== null && ! self::isHeading($value)) {
                        self::assignCandidate($fields, $label['field'], $value);
                    } else {
                        $pending = $label['field'];
                    }
                }
                continue;
            }

            if ($pending !== null && ! self::isHeading($text)) {
                self::assignCandidate($fields, $pending, $text);
                $pending = null;
            }
        }

        return [$fields, $tableItems];
    }

    protected static function extractTextFields(array $lines): array
    {
        $fields = self::emptyFields();
        $pending = null;
        foreach ($lines as $line) {
            if (self::isIgnorableLine($line) || self::isHeading($line)) {
                continue;
            }
            $field = self::detectLeadingField($line);
            if ($field !== null) {
                if (self::isLabelOnly($line, $field)) {
                    $pending = $field;
                    continue;
                }
                $value = self::extractInlineValue($line, $field);
                if ($value !== null && $value !== '') {
                    self::assignCandidate($fields, $field, $value);
                    $pending = $field === 'description' ? 'description' : null;
                }
                continue;
            }
            if ($pending !== null) {
                self::assignCandidate($fields, $pending, $line);
                $pending = $pending === 'description' ? 'description' : null;
            }
        }
        return $fields;
    }

    protected static function detectLeadingField(string $line): ?string
    {
        $normalized = self::normalizeLine($line);
        foreach (['office' => 'department', 'room' => 'location'] as $alias => $field) {
            if (preg_match('/^' . $alias . '(?:\s*[:：#.-]\s*|\s+|$)/iu', $normalized)) {
                return $field;
            }
        }
        foreach (self::fieldAliases() as $field => $aliases) {
            foreach ($aliases as $alias) {
                $pattern = preg_quote($alias, '/') . '(?:\s*[:：#.-]\s*|\s+|$)';
                if (preg_match('/^' . $pattern . '/iu', $normalized)) {
                    return $field;
                }
            }
        }
        return null;
    }

    protected static function mergeFields(array $base, array $candidate): array
    {
        foreach ($candidate as $field => $value) {
            if (($base[$field] ?? null) === null && $value !== null && $value !== '') {
                $base[$field] = $value;
            }
        }
        return $base;
    }

    protected static function assignCandidate(array &$fields, string $field, ?string $value): void
    {
        $value = self::normalizeValue($field, $value ?? '');
        if ($value === null || self::isInvalidCandidate($field, $value)) {
            if (config('app.debug')) {
                Log::debug('OCR candidate rejected', [
                    'field' => $field,
                    'value' => $value,
                    'reason' => 'field validation',
                ]);
            }
            return;
        }
        if (($fields[$field] ?? null) === null) {
            $fields[$field] = $value;
        }
    }

    protected static function fieldConfidence(array $fields): array
    {
        $confidence = [];
        foreach (self::emptyFields() as $field => $_) {
            $value = $fields[$field] ?? null;
            $confidence[$field] = ($value === null || $value === '') ? 0.0 : match ($field) {
                'property_number', 'serial_number' => preg_match('/[A-Z0-9]+(?:[-_][A-Z0-9]+)+/i', $value) ? 0.97 : 0.55,
                'quantity' => preg_match('/^\d+$/', $value) ? 0.99 : 0.45,
                'purchase_cost' => preg_match('/^\d+(?:\.\d{1,2})?$/', $value) ? 0.97 : 0.5,
                'purchase_date', 'warranty_until' => preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) ? 0.96 : 0.45,
                'description' => 0.90,
                default => 0.92,
            };
        }
        return $confidence;
    }

    protected static function fieldDetails(array $fields, array $confidence): array
    {
        $details = [];
        foreach (self::emptyFields() as $field => $_) {
            $value = $fields[$field] ?? null;
            $details[$field] = [
                'value' => $value,
                'confidence' => $confidence[$field] ?? 0,
                'status' => $value === null || $value === '' ? 'missing' : (($confidence[$field] ?? 0) >= 0.85 ? 'detected' : 'review'),
            ];
        }
        return $details;
    }

    protected static function fieldAliases(): array
    {
        return [
            'property_number' => ['property number', 'property no', 'property #', 'property id'],
            'asset_name' => ['asset name', 'asset', 'item name', 'item', 'equipment name', 'equipment', 'property description', 'description of property'],
            'brand' => ['brand', 'manufacturer', 'make'],
            'model' => ['model number', 'model no', 'model'],
            'serial_number' => ['serial number', 'serial no', 'serial', 's/n', 'sn'],
            'description' => ['description', 'specification', 'specifications'],
            'department' => ['department', 'assigned department'],
            'location' => ['location', 'assigned location'],
            'purchase_date' => ['purchase date', 'acquisition date', 'date acquired'],
            'purchase_cost' => ['unit cost', 'unit price', 'purchase cost', 'acquisition cost', 'total amount'],
            'quantity' => ['quantity', 'qty'],
            'warranty_until' => ['warranty until', 'warranty expiry', 'warranty end', 'warranty'],
            'condition' => ['condition', 'status'],
        ];
    }

    protected static function isHeading(string $value): bool
    {
        $normalized = strtolower(trim(preg_replace('/[^a-z0-9]+/i', ' ', $value) ?? ''));
        $headings = [
            'property acknowledgment receipt', 'property acknowledgement receipt', 'par',
            'asset specifications', 'assignment location', 'sales invoice',
            'delivery receipt', 'sales invoice delivery receipt', 'item details',
            'item information', 'product details', 'details', 'invoice',
        ];
        return in_array($normalized, $headings, true);
    }

    protected static function findLabelsInWords(array $words): array
    {
        $labels = [];
        $aliases = self::fieldAliases();
        $normalizedWords = array_map(fn ($word) => self::normalizeToken($word['text'] ?? ''), $words);
        $orderedAliases = [];
        foreach ($aliases as $field => $fieldAliases) {
            foreach ($fieldAliases as $alias) {
                $orderedAliases[] = ['field' => $field, 'tokens' => preg_split('/\s+/', $alias) ?: []];
            }
        }
        usort($orderedAliases, fn ($left, $right) => count($right['tokens']) <=> count($left['tokens']));

        for ($index = 0; $index < count($normalizedWords); $index++) {
            foreach ($orderedAliases as $alias) {
                $length = count($alias['tokens']);
                if (array_slice($normalizedWords, $index, $length) !== $alias['tokens']) {
                    continue;
                }
                $labels[] = [
                    'field' => $alias['field'],
                    'start' => $index,
                    'end' => $index + $length,
                    'x' => $words[$index]['x'] ?? 0,
                ];
                $index += $length - 1;
                break;
            }
        }

        // Some invoices render the first item-name column with a duplicated
        // "Brand" header. Keep the second Brand as brand and treat the first as asset_name.
        foreach ($labels as $index => $label) {
            if ($label['field'] === 'brand' && $index === 0 && isset($labels[$index + 1]) && $labels[$index + 1]['field'] === 'brand') {
                $labels[$index]['field'] = 'asset_name';
            }
        }
        return $labels;
    }

    protected static function isTableHeaderRow(array $words, array $labels): bool
    {
        if (count($labels) < 2) {
            return false;
        }
        $covered = [];
        foreach ($labels as $label) {
            for ($index = $label['start']; $index < $label['end']; $index++) {
                $covered[$index] = true;
            }
        }
        return count($covered) >= max(2, count($words) - 1);
    }

    protected static function mapTableDataRow(array $header, array $row): array
    {
        $item = self::emptyFields();
        $labels = $header['labels'];
        if (count($labels) < 2) {
            return $item;
        }

        $boundaries = [];
        foreach ($labels as $index => $label) {
            $left = $index === 0
                ? -PHP_INT_MAX
                : ($labels[$index - 1]['x'] + $label['x']) / 2;
            $right = $index === count($labels) - 1
                ? PHP_INT_MAX
                : ($label['x'] + $labels[$index + 1]['x']) / 2;
            $boundaries[] = ['field' => $label['field'], 'left' => $left, 'right' => $right];
        }

        foreach ($row['words'] ?? [] as $word) {
            $x = $word['x'] ?? 0;
            $column = null;
            foreach ($boundaries as $boundary) {
                if ($x >= $boundary['left'] && $x < $boundary['right']) {
                    $column = $boundary['field'];
                    break;
                }
            }
            if ($column === null) {
                $column = $x < $boundaries[0]['left'] ? $boundaries[0]['field'] : $boundaries[array_key_last($boundaries)]['field'];
            }
            $item[$column] = self::clean(trim(($item[$column] ?? '') . ' ' . ($word['text'] ?? '')));
        }

        foreach ($item as $field => $value) {
            if ($value !== null) {
                $item[$field] = self::normalizeValue($field, $value);
            }
        }
        return $item;
    }

    protected static function wordsText(array $words): ?string
    {
        if ($words === []) {
            return null;
        }
        return self::clean(implode(' ', array_column($words, 'text')));
    }

    protected static function normalizeToken(string $value): string
    {
        return strtolower(trim(preg_replace('/[^a-z0-9\/]+/i', ' ', $value) ?? ''));
    }

    protected static function isInvalidCandidate(string $field, string $value): bool
    {
        if (self::isHeading($value)) {
            return true;
        }
        $lower = strtolower($value);
        if ($field === 'property_number' && (str_contains($lower, 'par number') || str_contains($lower, 'property number'))) {
            return true;
        }
        if ($field === 'property_number' && ! preg_match('/\b[A-Z0-9]{2,}(?:[-_][A-Z0-9]+)+\b/i', $value)) {
            return true;
        }
        if ($field === 'serial_number' && preg_match('/\b(description|computer|details|with|brand|model|quantity|unit cost)\b/i', $value)) {
            return true;
        }
        if ($field === 'brand' && preg_match('/\b(model|serial number|quantity|unit cost|total amount)\b/i', $value)) {
            return true;
        }
        if ($field === 'asset_name' && self::isHeading($value)) {
            return true;
        }
        if ($field === 'quantity' && ! preg_match('/^\d+$/', $value)) {
            return true;
        }
        if ($field === 'purchase_cost' && ! preg_match('/\d/', $value)) {
            return true;
        }
        return false;
    }

    protected static function extractTableItems(array $lines, array $layoutRows): array
    {
        $items = self::extractDelimitedTableItems($lines);
        if ($items !== []) {
            return $items;
        }

        $rows = [];
        foreach ($layoutRows as $row) {
            $text = self::layoutRowText($row);
            if ($text !== '') {
                $rows[] = ['text' => $text, 'words' => $row['words']];
            }
        }

        $header = null;
        foreach ($rows as $index => $row) {
            $matches = self::headerFields($row['text']);
            if (count($matches) >= 2) {
                $header = ['index' => $index, 'fields' => $matches, 'words' => $row['words']];
                break;
            }
        }
        if ($header === null) {
            return [];
        }

        $items = [];
        foreach (array_slice($rows, $header['index'] + 1) as $row) {
            $values = self::mapSpatialRow($header, $row);
            if (count(array_filter($values, fn ($value) => $value !== null && $value !== '')) < 2) {
                continue;
            }
            $items[] = self::completeItem($values);
        }
        return $items;
    }

    protected static function extractDelimitedTableItems(array $lines): array
    {
        foreach ($lines as $index => $line) {
            if (substr_count($line, '|') < 2) {
                continue;
            }
            $headers = array_map(fn ($value) => self::fieldFromHeader($value), str_getcsv($line, '|'));
            if (count(array_filter($headers)) < 2) {
                continue;
            }
            $items = [];
            foreach (array_slice($lines, $index + 1) as $valueLine) {
                if (substr_count($valueLine, '|') < 2) {
                    continue;
                }
                $values = array_map('trim', str_getcsv($valueLine, '|'));
                $item = self::emptyFields();
                foreach ($headers as $column => $field) {
                    if ($field !== null && isset($values[$column])) {
                        $item[$field] = self::normalizeValue($field, $values[$column]);
                    }
                }
                if (count(array_filter($item, fn ($value) => $value !== null && $value !== '')) >= 2) {
                    $items[] = self::completeItem($item);
                }
            }
            return $items;
        }
        return [];
    }

    protected static function headerFields(string $line): array
    {
        $fields = [];
        foreach (preg_split('/\s{2,}|\|/', $line) ?: [] as $part) {
            $field = self::fieldFromHeader($part);
            if ($field !== null) {
                $fields[] = $field;
            }
        }
        return $fields;
    }

    protected static function fieldFromHeader(string $header): ?string
    {
        $header = self::normalizeLine($header);
        if ($header === '') {
            return null;
        }
        return self::detectField($header);
    }

    protected static function mapSpatialRow(array $header, array $row): array
    {
        $values = self::emptyFields();
        $anchors = [];
        foreach ($header['words'] as $index => $word) {
            $field = self::detectField($word['text']);
            if ($field === null && isset($header['words'][$index + 1])) {
                $field = self::detectField($word['text'] . ' ' . $header['words'][$index + 1]['text']);
            }
            if ($field !== null && ! array_filter($anchors, fn ($anchor) => $anchor['field'] === $field)) {
                $anchors[] = ['field' => $field, 'x' => $word['x']];
            }
        }
        if (count($anchors) < 2) {
            foreach ($header['fields'] as $index => $field) {
                if (! isset($anchors[$index]) && isset($header['words'][$index])) {
                    $anchors[] = ['field' => $field, 'x' => $header['words'][$index]['x']];
                }
            }
        }
        if (count($anchors) < 2) {
            return $values;
        }
        foreach ($row['words'] as $word) {
            $nearest = $anchors[0];
            foreach ($anchors as $anchor) {
                if (abs($word['x'] - $anchor['x']) < abs($word['x'] - $nearest['x'])) {
                    $nearest = $anchor;
                }
            }
            $field = $nearest['field'];
            $values[$field] = self::clean(trim(($values[$field] ?? '') . ' ' . $word['text']));
        }
        foreach ($values as $field => $value) {
            if ($value !== null) {
                $values[$field] = self::normalizeValue($field, $value);
            }
        }
        return $values;
    }

    protected static function completeItem(array $item): array
    {
        $item = array_merge(self::emptyFields(), $item);
        if ($item['brand'] === null && $item['manufacturer'] !== null) {
            $item['brand'] = $item['manufacturer'];
        }
        if ($item['quantity'] === null) {
            $item['quantity'] = '1';
        }
        return array_filter($item, fn ($value) => $value !== null && $value !== '');
    }

    protected static function isLabelOnly(string $line, string $fieldKey): bool
    {
        $normalized = strtolower(trim(self::normalizeLine($line)));
        $normalized = preg_replace('/[\s:：#.-]+$/u', '', $normalized) ?? $normalized;
        $labels = [
            'property_number' => ['property number', 'property no', 'property no#', 'property #', 'par number'],
            'asset_name' => ['asset name', 'item name', 'item', 'equipment', 'description of property'],
            'brand' => ['brand'],
            'manufacturer' => ['manufacturer', 'mfr', 'mfg'],
            'model' => ['model'],
            'serial_number' => ['serial number', 'serial no', 'serial', 'sn'],
            'description' => ['description'],
            'department' => ['department'],
            'location' => ['location'],
            'purchase_date' => ['purchase date', 'acquisition date', 'date acquired'],
            'purchase_cost' => ['purchase cost', 'acquisition cost', 'unit cost', 'unit price', 'cost', 'amount'],
            'quantity' => ['quantity', 'qty'],
            'warranty_until' => ['warranty until', 'warranty expiry', 'warranty end', 'warranty'],
            'condition' => ['condition'],
        ];

        return in_array($normalized, $labels[$fieldKey] ?? [], true);
    }

    protected static function extractLayoutRows($annotation): array
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
            return $row;
        }, $rows));
    }

    protected static function layoutRowText(array $row): string
    {
        $text = '';
        $previousRight = null;
        foreach ($row['words'] as $word) {
            $gap = $previousRight === null ? 0 : $word['x'] - $previousRight;
            $text .= ($gap > max(18, $word['height'] * 1.8) ? '  ' : ' ') . $word['text'];
            $previousRight = $word['x'] + max(1, strlen($word['text']) * $word['height'] * 0.45);
        }
        return self::normalizeLine($text);
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

        if (preg_match('/\b(property\s*(number|no|#)|property\s*id)\b/i', $normalizedLine)) {
            return 'property_number';
        }

        if (preg_match('/\b(asset\s*name|item\s*(name)?|equipment|description\s*of\s*property)\b/i', $normalizedLine)) {
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

        if (preg_match('/\b(purchase\s*date|acquisition\s*date|date\s*acquired)\b/i', $normalizedLine)) {
            return 'purchase_date';
        }

        if (preg_match('/\b(purchase\s*cost|acquisition\s*cost|unit\s*(cost|price)|cost|amount)\b/i', $normalizedLine)) {
            return 'purchase_cost';
        }

        if (preg_match('/\b(quantity|qty)\b/i', $normalizedLine)) {
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
            'property_number' => '(?:property\\s*(?:number|no|#)|property\\s*id)',
            'asset_name' => '(?:asset\\s*name|item(?:\\s*name)?|equipment|description\\s*of\\s*property)',
            'brand' => '(?:brand|manufacturer|mfr|mfg)',
            'model' => 'model',
            'serial_number' => '(?:serial\\s+(?:number|no)|serial|sn)',
            'description' => 'description',
            'department' => 'department',
            'location' => 'location',
            'purchase_date' => '(?:purchase\\s*date|acquisition\\s*date|date\\s*acquired)',
            'purchase_cost' => '(?:purchase\\s*cost|acquisition\\s*cost|unit\\s*(?:cost|price)|cost|amount)',
            'quantity' => '(?:quantity|qty)',
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

        if ($fieldKey === 'serial_number') {
            $value = preg_replace('/^(?:(?:no|number)\s*)?[\s:.;#-]+/i', '', $value) ?? $value;
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

        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'F j, Y', 'j F, Y', 'M j, Y', 'j M, Y', 'F j Y', 'j F Y', 'M j Y', 'j M Y'];

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
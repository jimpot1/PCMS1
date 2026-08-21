<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LlmAnomalyExplanationService
{
    public function generateForAnomalyId(int $anomalyId, bool $force = false): ?string
    {
        $anomaly = DB::table('anomaly_alerts')->find($anomalyId);

        if (! $anomaly || $anomaly->source_type !== 'quantity_anomaly') {
            return null;
        }

        if (! $force && ($anomaly->ai_explanation_status ?? null) === 'generated' && ! empty($anomaly->ai_explanation)) {
            return $anomaly->ai_explanation;
        }

        DB::table('anomaly_alerts')
            ->where('id', $anomalyId)
            ->update([
                'ai_explanation_status' => 'pending',
                'updated_at' => now(),
            ]);

        try {
            $explanation = $this->requestExplanation($anomaly);

            DB::table('anomaly_alerts')
                ->where('id', $anomalyId)
                ->update([
                    'ai_explanation' => $explanation,
                    'ai_explanation_status' => 'generated',
                    'ai_explanation_error' => null,
                    'ai_explanation_generated_at' => now(),
                    'updated_at' => now(),
                ]);

            return $explanation;
        } catch (\Throwable $e) {
            Log::warning('OpenAI anomaly explanation failed', [
                'anomaly_id' => $anomalyId,
                'message' => $e->getMessage(),
            ]);

            DB::table('anomaly_alerts')
                ->where('id', $anomalyId)
                ->update([
                    'ai_explanation_status' => 'failed',
                    'ai_explanation_error' => substr($e->getMessage(), 0, 500),
                    'updated_at' => now(),
                ]);

            return null;
        }
    }

    protected function requestExplanation(object $anomaly): string
    {
        $apiKey = config('services.openai.api_key');

        if (! $apiKey) {
            throw new \RuntimeException('OpenAI API key is not configured.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(config('services.openai.timeout', 20))
            ->post('https://api.openai.com/v1/responses', [
                'model' => config('services.openai.model', 'gpt-5.6'),
                'instructions' => $this->instructions(),
                'input' => $this->buildPrompt($anomaly),
                'text' => [
                    'format' => ['type' => 'text'],
                ],
            ]);

        if ($response->failed()) {
            throw new \RuntimeException('OpenAI request failed with status ' . $response->status() . '.');
        }

        $text = trim((string) ($response->json('output_text') ?? $this->extractOutputText($response->json('output') ?? [])));

        if ($text === '') {
            throw new \RuntimeException('OpenAI response did not include explanation text.');
        }

        return $text;
    }

    protected function instructions(): string
    {
        return implode(' ', [
            'You explain already-detected PCMS supplies stock anomalies for an OIC.',
            'Do not decide whether this is an anomaly and do not invent statistics.',
            'Use only the supplied evidence, including z-score and historical values.',
            'Mention the supply, department, difference from the historical average, and recent similar spikes if provided.',
            'Give a short professional risk interpretation and recommend OIC review or verification when appropriate.',
            'Never claim fraud, theft, or wrongdoing as fact; use uncertain wording such as may indicate, could indicate, or requires review.',
            'Keep the answer to 2 to 4 sentences.',
        ]);
    }

    protected function buildPrompt(object $anomaly): string
    {
        $context = $this->decodeContext($anomaly->analysis_context ?? null);

        return "Explain this already-detected supplies stock quantity anomaly in plain language.\n"
            . "Supply: " . ($context['supply_name'] ?? 'Unknown supply') . "\n"
            . "Department: " . ($context['department_name'] ?? 'Unknown department') . "\n"
            . "Current quantity: " . ($context['current_quantity'] ?? 'not provided') . "\n"
            . "Historical average quantity: " . ($context['historical_average'] ?? 'not provided') . "\n"
            . "Historical standard deviation: " . ($context['historical_stddev'] ?? 'not provided') . "\n"
            . "Z-score: " . ($context['z_score'] ?? 'not provided') . "\n"
            . "Historical sample size: " . ($context['historical_sample_size'] ?? 'not provided') . "\n"
            . "Similar recent spikes: " . ($context['similar_recent_spikes'] ?? 'not provided') . "\n"
            . "System reason: " . ($anomaly->reason ?? 'not provided') . "\n"
            . "Recommended action: " . ($anomaly->recommended_action ?? 'not provided');
    }

    protected function decodeContext(?string $context): array
    {
        if (! $context) {
            return [];
        }

        $decoded = json_decode($context, true);

        return is_array($decoded) ? $decoded : [];
    }

    protected function extractOutputText(array $output): string
    {
        $text = '';

        foreach ($output as $item) {
            foreach (($item['content'] ?? []) as $content) {
                if (($content['type'] ?? null) === 'output_text' && isset($content['text'])) {
                    $text .= $content['text'];
                }
            }
        }

        return $text;
    }
}

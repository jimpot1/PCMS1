<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Models\PurchaseRequest;
use App\Models\Supply;
use Illuminate\Console\Command;

/**
 * Repairs purchase_requests.line_items rows that were saved with a blank
 * item name / zero amount, by re-reading the current Supply/Asset record
 * that the line item is actually linked to (source_type + source_id).
 *
 * This does NOT touch anything if the underlying Supply/Asset record
 * itself has a blank name or zero price — those are flagged in a
 * separate "needs manual fix in Supplies/Assets" report instead, since
 * there's no name/price to copy from in that case.
 *
 * Usage:
 *   php artisan pcms:repair-line-items            # dry run, shows what WOULD change
 *   php artisan pcms:repair-line-items --apply     # actually saves the fixes
 */
class RepairPurchaseRequestLineItems extends Command
{
    protected $signature = 'pcms:repair-line-items {--apply : Actually save the fixes (default is dry-run only)}';

    protected $description = 'Backfill blank item names / zero amounts on purchase_requests.line_items from the linked Supply/Asset catalog record';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');

        $fixedRequests = 0;
        $fixedLines = 0;
        $badCatalogRows = collect(); // supplies/assets that themselves have no name/price

        PurchaseRequest::query()
            ->whereNotNull('line_items')
            ->orderBy('id')
            ->chunkById(50, function ($requests) use (&$fixedRequests, &$fixedLines, &$badCatalogRows, $apply) {
                foreach ($requests as $purchaseRequest) {
                    $items = $purchaseRequest->line_items ?? [];
                    if (empty($items)) {
                        continue;
                    }

                    $changed = false;

                    foreach ($items as $index => $line) {
                        $name = trim((string) ($line['item'] ?? $line['particular'] ?? ''));
                        $amount = (float) ($line['amount'] ?? $line['estimated_cost'] ?? 0);
                        $qty = (float) ($line['qty'] ?? $line['quantity'] ?? 0);
                        $sourceType = $line['source_type'] ?? $line['type'] ?? null;
                        $sourceId = $line['source_id'] ?? null;

                        if (($name !== '' && $amount > 0) || ! $sourceId || ! in_array($sourceType, ['supply', 'asset'], true)) {
                            continue; // already fine, or nothing to look up against
                        }

                        $catalogName = null;
                        $catalogPrice = null;

                        if ($sourceType === 'supply') {
                            $supply = Supply::find($sourceId);
                            if ($supply) {
                                $catalogName = trim((string) $supply->name);
                                $catalogPrice = (float) ($supply->unit_price ?? 0);
                            }
                        } else {
                            $asset = Asset::find($sourceId);
                            if ($asset) {
                                $catalogName = trim((string) $asset->name);
                                $catalogPrice = (float) ($asset->purchase_cost ?? 0);
                            }
                        }

                        if ($catalogName === '' || $catalogName === null || $catalogPrice <= 0) {
                            // Nothing usable to copy from — the catalog record
                            // itself needs a human to fill in name/price.
                            $badCatalogRows->push([
                                'purchase_request' => $purchaseRequest->request_number ?? $purchaseRequest->id,
                                'source_type' => $sourceType,
                                'source_id' => $sourceId,
                                'catalog_name' => $catalogName,
                                'catalog_price' => $catalogPrice,
                            ]);
                            continue;
                        }

                        $itemChanged = false;

                        if ($name === '' && $catalogName) {
                            $items[$index]['item'] = $catalogName;
                            $items[$index]['particular'] = $catalogName;
                            $itemChanged = true;
                        }

                        if ($amount <= 0 && $catalogPrice > 0 && $qty > 0) {
                            $newAmount = $qty * $catalogPrice;
                            $items[$index]['amount'] = $newAmount;
                            $items[$index]['estimated_cost'] = $newAmount;
                            $items[$index]['unit_price'] = $catalogPrice;
                            $items[$index]['unitPrice'] = $catalogPrice;
                            $itemChanged = true;
                        }

                        if ($itemChanged) {
                            $fixedLines++;
                            $changed = true;
                        }
                    }

                    if ($changed) {
                        $fixedRequests++;
                        $this->line(($apply ? 'FIXED   ' : 'WOULD FIX ') . ($purchaseRequest->request_number ?? "#{$purchaseRequest->id}"));

                        if ($apply) {
                            $purchaseRequest->line_items = $items;
                            $purchaseRequest->total_amount = collect($items)
                                ->sum(fn ($item) => (float) ($item['amount'] ?? $item['estimated_cost'] ?? 0));
                            $purchaseRequest->save();
                        }
                    }
                }
            });

        $this->newLine();
        $this->info("{$fixedRequests} request(s), {$fixedLines} line item(s) " . ($apply ? 'fixed.' : 'would be fixed (re-run with --apply to save).'));

        if ($badCatalogRows->isNotEmpty()) {
            $this->newLine();
            $this->warn('These Supply/Asset catalog records have no usable name/price — fix them directly in Supplies/Assets management, then re-run this command:');
            $this->table(
                ['Purchase Request', 'Type', 'Source ID', 'Catalog Name', 'Catalog Price'],
                $badCatalogRows->map(fn ($row) => [
                    $row['purchase_request'],
                    $row['source_type'],
                    $row['source_id'],
                    $row['catalog_name'] ?: '(blank)',
                    $row['catalog_price'],
                ])->all()
            );
        }

        return self::SUCCESS;
    }
}

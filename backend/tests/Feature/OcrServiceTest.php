<?php

namespace Tests\Feature;

use App\Services\GoogleVisionOcrService;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OcrServiceTest extends TestCase
{
    #[Test]
    public function it_extracts_structured_fields_without_leaking_raw_text_into_description(): void
    {
        $text = <<<'OCR'
Property Number:
BCP-IT-2026-000145

Asset Name:
Dell OptiPlex 7010 Desktop Computer

Brand:
Dell

Model:
OptiPlex 7010 MT

Serial Number:
DELL7H4K92X1

Description:
Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.

Department:
Information Technology Department

Location:
IT Office - Room 204

Purchase Date:
15/03/2025

Purchase Cost:
PHP 42,500.00

Quantity:
1

Warranty Until:
15/03/2028

Condition:
Good
OCR;

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, $text);

        $this->assertSame('BCP-IT-2026-000145', $fields['property_number']);
        $this->assertSame('Dell OptiPlex 7010 Desktop Computer', $fields['asset_name']);
        $this->assertSame('Dell', $fields['brand']);
        $this->assertSame('OptiPlex 7010 MT', $fields['model']);
        $this->assertSame('DELL7H4K92X1', $fields['serial_number']);
        $this->assertSame('Desktop computer assigned to the Information Technology Department for office and administrative tasks. Includes Intel Core i5 processor, 16GB RAM, and 512GB SSD.', $fields['description']);
        $this->assertSame('Information Technology Department', $fields['department']);
        $this->assertSame('IT Office - Room 204', $fields['location']);
        $this->assertSame('2025-03-15', $fields['purchase_date']);
        $this->assertSame('42500.00', $fields['purchase_cost']);
        $this->assertSame('1', $fields['quantity']);
        $this->assertSame('2028-03-15', $fields['warranty_until']);
        $this->assertSame('Good', $fields['condition']);
        $this->assertStringNotContainsString('Property Number', $fields['description']);
    }

    #[Test]
    public function it_does_not_shift_label_only_lines_into_the_previous_field(): void
    {
        $text = <<<'OCR'
Property Number
Asset Name
Model
Model
Serial Number
Description
Desktop computer assigned to the Information Technology Department.
Department
Information Technology Department
Location
IT Office - Room 204
OCR;

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, $text);

        $this->assertArrayNotHasKey('property_number', $fields);
        $this->assertArrayNotHasKey('asset_name', $fields);
        $this->assertArrayNotHasKey('model', $fields);
        $this->assertArrayNotHasKey('serial_number', $fields);
        $this->assertSame('Desktop computer assigned to the Information Technology Department.', $fields['description']);
        $this->assertSame('Information Technology Department', $fields['department']);
        $this->assertSame('IT Office - Room 204', $fields['location']);
    }

    #[Test]
    public function it_extracts_values_from_label_and_value_rows_without_colons(): void
    {
        $text = <<<'OCR'
Property Number BCP-IT-2026-000145
Asset Name Dell OptiPlex 7010 Desktop Computer
Brand Dell
Model OptiPlex 7010 MT
Serial Number DELL7H4K92X1
Description Desktop computer for office use.
Department Information Technology Department
Location IT Office - Room 204
Purchase Date 15/03/2025
Purchase Cost PHP 42,500.00
Quantity 1
Warranty Until 15/03/2028
Condition Good
OCR;

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, $text);

        $this->assertSame('BCP-IT-2026-000145', $fields['property_number']);
        $this->assertSame('Dell OptiPlex 7010 Desktop Computer', $fields['asset_name']);
        $this->assertSame('Dell', $fields['brand']);
        $this->assertSame('OptiPlex 7010 MT', $fields['model']);
        $this->assertSame('DELL7H4K92X1', $fields['serial_number']);
        $this->assertSame('Information Technology Department', $fields['department']);
        $this->assertSame('IT Office - Room 204', $fields['location']);
    }

    #[Test]
    public function it_maps_delimited_invoice_rows_to_asset_fields_and_preserves_multiple_items(): void
    {
        $text = <<<'OCR'
Sales Invoice / Delivery Receipt
Acquisition Date: 2026-09-15
Asset Name | Brand | Model | Serial Number | Quantity | Unit Cost
Laptop Computer | Dell | Latitude 5430 | SN-DL-99824X | 1 | PHP 55,000.00
Monitor | LG | 24MP400 | SN-LG-1002 | 3 | ₱8,500.00
OCR;

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, $text);

        $this->assertSame('Laptop Computer', $fields['asset_name']);
        $this->assertSame('Dell', $fields['brand']);
        $this->assertSame('Latitude 5430', $fields['model']);
        $this->assertSame('SN-DL-99824X', $fields['serial_number']);
        $this->assertSame('1', $fields['quantity']);
        $this->assertSame('55000.00', $fields['purchase_cost']);
        $this->assertCount(2, $fields['_items']);
        $this->assertSame('LG', $fields['_items'][1]['brand']);
        $this->assertSame('3', $fields['_items'][1]['quantity']);
    }

    #[Test]
    public function it_recognizes_par_aliases_without_filling_missing_optional_fields(): void
    {
        $text = <<<'OCR'
PAR Number: PAR-2026-0042
Property Number: PROP-2026-0911
Acquisition Date: September 20, 2026
Asset Name: Ergonomic Executive Chair
Brand: ErgoPro
Model: Comfort-X
Serial No.: EP-CH-2026-011
Description: Mesh backrest, adjustable lumbar support, 3D armrests
Department: Logistics Office
Location: Building A, Room 302
Quantity: 1
Unit Cost: PHP 12,500.00
OCR;

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, $text);

        $this->assertSame('PROP-2026-0911', $fields['property_number']);
        $this->assertSame('2026-09-20', $fields['purchase_date']);
        $this->assertSame('EP-CH-2026-011', $fields['serial_number']);
        $this->assertSame('12500.00', $fields['purchase_cost']);
        $this->assertArrayNotHasKey('condition', $fields);
    }

    #[Test]
    public function it_maps_bounding_box_rows_without_merging_neighboring_cells(): void
    {
        $rows = [
            $this->layoutRow(['Asset', 'Name', 'Ergonomic', 'Executive', 'Chair', 'Quantity', '1'], [10, 45, 180, 280, 390, 600, 700]),
            $this->layoutRow(['Brand', 'ErgoPro', 'Unit', 'Cost', 'PHP', '12,500.00'], [10, 180, 600, 650, 700, 760]),
            $this->layoutRow(['Model', 'Comfort-X'], [10, 180]),
            $this->layoutRow(['Serial', 'Number', 'EP-CH-2026-011'], [10, 50, 180]),
            $this->layoutRow(['Description', 'Mesh', 'backrest,', 'adjustable', 'lumbar', 'support,', '3D', 'armrests'], [10, 180, 230, 310, 400, 480, 570, 610]),
            $this->layoutRow(['Department', 'Logistics', 'Office'], [10, 180, 270]),
            $this->layoutRow(['Location', 'Building', 'A,', 'Room', '302'], [10, 180, 250, 290, 350]),
        ];

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, '', $rows);

        $this->assertSame('Ergonomic Executive Chair', $fields['asset_name']);
        $this->assertSame('1', $fields['quantity']);
        $this->assertSame('ErgoPro', $fields['brand']);
        $this->assertSame('12500.00', $fields['purchase_cost']);
        $this->assertSame('EP-CH-2026-011', $fields['serial_number']);
        $this->assertSame('Mesh backrest, adjustable lumbar support, 3D armrests', $fields['description']);
        $this->assertSame('Logistics Office', $fields['department']);
        $this->assertSame('Building A, Room 302', $fields['location']);
    }

    #[Test]
    public function it_maps_invoice_columns_and_moves_continuation_specs_to_description(): void
    {
        $rows = [
            $this->layoutRow(['Asset', 'Name', 'Brand', 'Model', 'Serial', 'Number', 'Quantity', 'Unit', 'Cost'], [10, 45, 220, 330, 440, 490, 620, 700, 740]),
            $this->layoutRow(['Laptop', 'Computer', 'Dell', 'Latitude', '5430', 'SN-DL-99824X', '1', 'PHP', '55,000.00'], [10, 60, 220, 330, 360, 520, 620, 700, 740]),
            $this->layoutRow(['Intel', 'Core', 'i7,', '16GB', 'RAM,', '512GB', 'SSD'], [430, 440, 450, 460, 470, 480, 490]),
        ];

        $method = new \ReflectionMethod(GoogleVisionOcrService::class, 'extractFields');
        $method->setAccessible(true);

        $fields = $method->invoke(null, '', $rows);

        $this->assertSame('Laptop Computer', $fields['asset_name']);
        $this->assertSame('Dell', $fields['brand']);
        $this->assertSame('Latitude 5430', $fields['model']);
        $this->assertSame('SN-DL-99824X', $fields['serial_number']);
        $this->assertSame('55000.00', $fields['purchase_cost']);
        $this->assertSame('Intel Core i7, 16GB RAM, 512GB SSD', $fields['description']);
    }

    private function layoutRow(array $texts, array $xPositions): array
    {
        return [
            'y' => 10,
            'height' => 10,
            'words' => array_map(
                fn ($text, $index) => ['text' => $text, 'x' => $xPositions[$index], 'y' => 10, 'height' => 10],
                $texts,
                array_keys($texts)
            ),
        ];
    }
}

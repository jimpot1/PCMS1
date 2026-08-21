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
}

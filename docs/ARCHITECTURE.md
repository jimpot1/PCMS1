# PCMS Architecture

PCMS is designed as a subsystem inside the SMS dashboard shell.

## Layers

- React frontend: SMS-matched dashboard, RBAC views, OCR workflow, reports, charts, tables, notifications.
- Laravel 12 REST API: protected routes, validation, repositories/controllers, report export, Supabase JWT verification.
- PostgreSQL: normalized property, department, supply, purchase, audit, OCR, anomaly, and activity-log tables.
- Python OCR API: Google Cloud Vision-backed asset label extraction for property number, serial number, brand, model, and description.
- Python anomaly API: inventory movement, repair, transfer, stock, and audit anomaly scoring.
- Supabase Auth: identity provider and JWT source; Laravel enforces role metadata.

## Roles

System Administrator, Property Custodian, PPMO Staff, Department Head, Employee, and Auditor are enforced through protected routes and middleware.

## Local Commands

```bash
npm install --prefix frontend
npm run dev

composer install --working-dir=backend
php backend/artisan migrate --seed

uvicorn python-services.ocr.main:app --reload --port 8101
uvicorn python-services.anomaly.main:app --reload --port 8102
```

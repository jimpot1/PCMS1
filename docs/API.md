# PCMS REST API

All endpoints are under `/api` and require a Supabase bearer token.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/dashboard` | Dashboard metrics, activities, analytics |
| GET/POST | `/assets` | Asset registry list and creation |
| GET/PATCH/DELETE | `/assets/{asset}` | Asset details, update, archive |
| POST | `/ocr/scan` | Send an asset label image to OCR |
| GET/POST | `/transfers` | Asset transfer workflow |
| GET/POST | `/maintenance` | Maintenance schedules and history |
| GET/POST | `/supplies` | Supplies inventory and stock control |
| GET/POST | `/purchase-requests` | PR approval workflow |
| GET/POST | `/gate-passes` | Digital gate pass and QR workflow |
| GET/POST | `/audits` | Physical audit schedules/results |
| GET | `/inventory-monitoring/anomalies` | Existing anomaly alerts |
| POST | `/inventory-monitoring/analyze` | Run anomaly detection |
| GET | `/reports/{type}` | Export report metadata/download |
| GET/POST | `/users` | RBAC user management |

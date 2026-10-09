# PCMS

Property Custodian Management System (PCMS) is a web-based platform for managing property records, custodianship, inventory movement, procurement workflows, and approval processes. The project combines a React frontend, a Laravel API backend, and optional Python services for OCR and anomaly detection.

## Overview

- Frontend: React + Vite
- Backend: Laravel 12
- Database: Laravel-supported relational database
- Optional services: Python OCR and anomaly processing
- Primary workflows: request submission, approval routing, asset tracking, reporting, and audit support

## Simple Role and Module Guide

PCMS modules are the sections available from the side menu after signing in. Some actions are restricted to particular roles, even when a module is visible.

### System Administrator

The System Administrator oversees the system and its records:

- **Dashboard** — Review a summary of system activity and operational work.
- **Asset Registry** — Add, update, search, and review property records.
- **OCR Asset Tagging** — Scan asset tags and review OCR scan history.
- **Asset Assignment** — Record assets issued to employees and manage assignment and return records.
- **Asset Transfer** — Review and manage requests to move assets between departments.
- **Asset Return** — Track assets returned by their assigned users.
- **Supplies Inventory** — Maintain supply records and stock information.
- **Department** — Maintain the departments used by asset and workflow records.
- **Preventive Maintenance** — Track maintenance work and upcoming maintenance needs.
- **Damage Report** — Record and follow up on reported asset damage.
- **Purchase Workflow** — Monitor purchase requests and related processing.
- **Gate Pass** — Review gate-pass records and their status.
- **Audit Dashboard** — Review inventory audit work and results.
- **Inventory Monitoring** — Review unusual inventory activity and related alerts.
- **Report & Analytics** — Review and export available operational reports.
- **User Management** — Create, update, deactivate, and manage user accounts. Permanent deletion is available only where authorized and is recorded in deletion history.
- **Notification** — View system notifications.
- **System Settings** — Manage configurable system settings.
- **Activity Logs** — Review recorded user and system actions.

### PPMO Staff

PPMO Staff handle day-to-day property, inventory, procurement, and document processing:

- **Dashboard** — See operational summaries and work queues.
- **Asset Registry** — Maintain and search property records.
- **OCR Asset Tagging** — Scan asset tags and review OCR results.
- **Asset Assignment** — Process asset issuance and assignment records.
- **Asset Transfer** — Process asset movement requests and related records.
- **Asset Return** — Record and manage returned assets.
- **Supplies Inventory** — Track supplies and inventory movements.
- **Department** — View and use department records in operations.
- **Inventory Monitoring** — Review inventory alerts and investigate unusual activity.
- **Preventive Maintenance** — Track maintenance needs and work.
- **Damage Report** — Record and manage damage reports.
- **Purchase Workflow** — Process requests through the operational stages, including receiving and release where authorized.
- **Gate Pass** — Manage gate-pass records and processing.
- **Audit Dashboard** — Perform inventory audit and verification work.
- **Walk-in Request** — Enter a purchase request on behalf of a walk-in requester.
- **Approved Release Queue** — Work on approved requests that are ready for release.
- **Gate Pass Preparation** — Prepare gate-pass documents.
- **Release Receipt Preparation** — Prepare receipts for released items.
- **Purchase Order Documents** — Access purchase-order documents for processing.
- **Reports & Analytics** — Review available reports and analytics.
- **Activity & Transaction Logs** — Review operational activity and transaction records.

PPMO Staff do not have the System Administrator's user-management or system-settings menu. Available actions may still depend on the user's permissions and the status of a request or record.

## Project Structure

```text
PCMS1/
├── backend/           # Laravel API and business logic
├── frontend/          # React application
├── docs/              # Architecture and workflow documentation
├── flowcharts/        # Process flow diagrams
├── database/          # SQL/schema assets
├── package.json       # Root scripts for frontend tasks
├── DEPLOYMENT.md      # Deployment notes and hosting guidance
├── pcms.sql           # Database dump / schema source
├── README.md          # Project overview and setup guide
└── ...
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ and npm
- PHP 8.2+
- Composer
- A database server available for the Laravel app
- Git

## Installation

### 1. Install frontend dependencies

```bash
npm install --prefix frontend
```

### 2. Install backend dependencies

```bash
composer install --working-dir=backend
```

### 3. Configure environment files

Copy or create the Laravel environment file if needed:

```bash
cp backend/.env.example backend/.env
```

Update the backend environment with your database and application settings.

## Running the Application

### Start the frontend

```bash
npm run dev
```

This runs the Vite dev server for the React app.

### Start the Laravel backend

From the project root:

```bash
php backend/artisan serve
```

Alternatively, use the root script if available:

```bash
npm run dev
```

> The root package.json delegates to the frontend dev server. For full local development, run the Laravel API and the frontend separately.

## Database Setup

Create and migrate the database schema:

```bash
php backend/artisan migrate
```

If seed data is required:

```bash
php backend/artisan db:seed
```

## Common Commands

### Frontend build

```bash
npm --prefix frontend run build
```

### Preview production build

```bash
npm --prefix frontend run preview
```

### Laravel testing

```bash
php backend/artisan test
```

## Documentation

Additional project guidance is available in:

- [DEPLOYMENT.md](DEPLOYMENT.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/API.md](docs/API.md)
- [docs/WORKFLOW_VERIFICATION.md](docs/WORKFLOW_VERIFICATION.md)

## Notes

This project may include OCR and anomaly detection integrations that depend on external Python services. If those services are not required for your environment, you can still run the core web application while those integrations are configured separately.

## License

This project does not currently declare a license in the repository. If you are distributing or deploying it, confirm the legal usage terms before publishing.

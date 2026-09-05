# PCMS

Property Custodian Management System (PCMS) is a web-based platform for managing property records, custodianship, inventory movement, procurement workflows, and approval processes. The project combines a React frontend, a Laravel API backend, and optional Python services for OCR and anomaly detection.

## Overview

- Frontend: React + Vite
- Backend: Laravel 12
- Database: Laravel-supported relational database
- Optional services: Python OCR and anomaly processing
- Primary workflows: request submission, approval routing, asset tracking, reporting, and audit support

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

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    location VARCHAR(160),
    head_user_id UUID,
    custodian_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY departments_select_authenticated ON departments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY departments_insert_authenticated ON departments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY departments_update_authenticated ON departments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY departments_delete_authenticated ON departments FOR DELETE USING (auth.role() = 'authenticated');

CREATE TABLE asset_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    depreciation_rate NUMERIC(5,2) DEFAULT 0,
    useful_life_years INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    contact_person VARCHAR(120),
    email VARCHAR(160),
    phone VARCHAR(80),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    asset_id VARCHAR(40) UNIQUE NOT NULL,
    property_number VARCHAR(80) UNIQUE NOT NULL,
    serial_number VARCHAR(120),
    name VARCHAR(180) NOT NULL,
    brand VARCHAR(120),
    model VARCHAR(120),
    description TEXT,
    category_id BIGINT REFERENCES asset_categories(id),
    department_id BIGINT REFERENCES departments(id),
    custodian_id UUID,
    location VARCHAR(180),
    condition VARCHAR(40) NOT NULL DEFAULT 'good',
    status VARCHAR(40) NOT NULL DEFAULT 'available',
    purchase_date DATE,
    purchase_cost NUMERIC(14,2),
    quantity INTEGER NOT NULL DEFAULT 1,
    supplier_id BIGINT REFERENCES suppliers(id),
    warranty_until DATE,
    depreciation_rate NUMERIC(5,2) DEFAULT 0,
    qr_code_path TEXT,
    image_path TEXT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_select_authenticated ON assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY assets_insert_authenticated ON assets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY assets_update_authenticated ON assets FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY assets_delete_authenticated ON assets FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_assets_search ON assets USING gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(property_number,'') || ' ' || coalesce(serial_number,'')));
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_department ON assets(department_id);

CREATE TABLE asset_assignments (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    assigned_to UUID NOT NULL,
    assigned_by UUID NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    assigned_at TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    status VARCHAR(40) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_transfers (
    id BIGSERIAL PRIMARY KEY,
    transfer_number VARCHAR(40) UNIQUE NOT NULL,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    from_department_id BIGINT REFERENCES departments(id),
    to_department_id BIGINT REFERENCES departments(id),
    requested_by UUID NOT NULL,
    approved_by UUID,
    status VARCHAR(40) DEFAULT 'pending',
    risk_score NUMERIC(5,2) DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_records (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    type VARCHAR(60) NOT NULL,
    priority VARCHAR(30) DEFAULT 'medium',
    status VARCHAR(40) DEFAULT 'scheduled',
    technician VARCHAR(160),
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    cost NUMERIC(14,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE damage_reports (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    reported_by UUID NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    severity VARCHAR(40) NOT NULL,
    description TEXT NOT NULL,
    photo_path TEXT,
    status VARCHAR(40) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplies (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 0,
    expiration_date DATE,
    supplier_id BIGINT REFERENCES suppliers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    supply_id BIGINT REFERENCES supplies(id) NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    requested_by UUID,
    issued_by UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_requests (
    id BIGSERIAL PRIMARY KEY,
    request_number VARCHAR(40) UNIQUE NOT NULL,
    requested_by UUID NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    current_stage VARCHAR(60) DEFAULT 'employee',
    status VARCHAR(40) DEFAULT 'pending',
    total_amount NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gate_passes (
    id BIGSERIAL PRIMARY KEY,
    gate_pass_number VARCHAR(40) UNIQUE NOT NULL,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    purpose TEXT NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    qr_code_path TEXT,
    approved_by UUID,
    returned_at TIMESTAMP,
    status VARCHAR(40) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE physical_audits (
    id BIGSERIAL PRIMARY KEY,
    audit_number VARCHAR(40) UNIQUE NOT NULL,
    area VARCHAR(180) NOT NULL,
    auditor_id UUID NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(40) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ocr_scans (
    id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT REFERENCES assets(id),
    image_path TEXT NOT NULL,
    extracted_payload JSONB NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    confirmed_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE anomaly_alerts (
    id BIGSERIAL PRIMARY KEY,
    source_type VARCHAR(80) NOT NULL,
    source_id VARCHAR(80),
    risk_score NUMERIC(5,2) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(40) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(120),
    entity_id VARCHAR(80),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_scans (
    id BIGSERIAL PRIMARY KEY,
    audit_id BIGINT REFERENCES physical_audits(id) NOT NULL,
    asset_id BIGINT REFERENCES assets(id) NOT NULL,
    found_department_id BIGINT REFERENCES departments(id),
    result VARCHAR(20) NOT NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_scans_authenticated ON audit_scans FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

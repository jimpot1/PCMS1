import {
  AlertTriangle,
  Archive,
  Bell,
  Boxes,
  Building2,
  Camera,
  CheckCircle2,
  Cpu,
  FileText,
  FlaskConical,
  Monitor,
  Package,
  Printer,
  Sparkles,
  Wrench
} from 'lucide-react';

export const assets = [
  { id: 'AST-2026-0001', propertyNo: 'BCP-IT-2026-0001', serial: 'DL-5440-XK88', name: 'Dell Latitude 5440', department: 'Information Technology', custodian: 'Marco Reyes', value: 58500, condition: 'Good', status: 'Assigned' },
  { id: 'AST-2026-0002', propertyNo: 'BCP-LIB-2026-0019', serial: 'BR-MFC-2241', name: 'Brother MFC-L5900DW', department: 'Library', custodian: 'Grace Santos', value: 26800, condition: 'Needs Repair', status: 'Maintenance' },
  { id: 'AST-2026-0003', propertyNo: 'BCP-LAB-2025-0097', serial: 'OSC-2219-AF', name: 'Digital Oscilloscope', department: 'Engineering Laboratory', custodian: 'Engr. Dela Cruz', value: 148000, condition: 'Good', status: 'Available' },
  { id: 'AST-2026-0004', propertyNo: 'BCP-CLN-2025-0044', serial: 'MED-FRZ-7002', name: 'Medical Freezer', department: 'Clinic', custodian: 'Nurse Alvarez', value: 72000, condition: 'Good', status: 'Assigned' },
  { id: 'AST-2026-0005', propertyNo: 'BCP-ADM-2024-0101', serial: 'PRJ-EP-9381', name: 'Epson Projector', department: 'Administration', custodian: 'Lea Domingo', value: 45500, condition: 'Damaged', status: 'Damaged' },
  { id: 'AST-2026-0006', propertyNo: 'BCP-COM-2025-0131', serial: 'HP-ELT-9134', name: 'HP EliteDesk Workstation', department: 'Computer Laboratory', custodian: 'Paolo Tan', value: 63000, condition: 'Good', status: 'Assigned' },
  { id: 'AST-2026-0007', propertyNo: 'BCP-PPMO-2024-0028', serial: 'CAM-CN-7231', name: 'Canon DSLR Kit', department: 'PPMO', custodian: 'Riza Molina', value: 81500, condition: 'Good', status: 'Available' },
  { id: 'AST-2026-0008', propertyNo: 'BCP-FAC-2023-0088', serial: 'GEN-4500-XY', name: 'Portable Generator', department: 'Facilities', custodian: 'Jun Herrera', value: 112000, condition: 'Under Inspection', status: 'Maintenance' }
];

export const categories = [
  { name: 'Computers and Peripherals', count: 824, depreciation: 20, tone: 'blue', icon: Monitor },
  { name: 'Office Equipment', count: 486, depreciation: 15, tone: 'green', icon: Printer },
  { name: 'Laboratory Equipment', count: 218, depreciation: 10, tone: 'purple', icon: FlaskConical },
  { name: 'Furniture and Fixtures', count: 612, depreciation: 8, tone: 'orange', icon: Boxes },
  { name: 'Medical Equipment', count: 91, depreciation: 12, tone: 'teal', icon: Package },
  { name: 'Network Devices', count: 200, depreciation: 18, tone: 'red', icon: Cpu }
];

export const departments = [
  { name: 'Information Technology', location: 'Main Building 3F', custodian: 'Marco Reyes', assets: 284, requests: 9 },
  { name: 'Library', location: 'Academic Center 1F', custodian: 'Grace Santos', assets: 156, requests: 3 },
  { name: 'Clinic', location: 'Student Services Wing', custodian: 'Nurse Alvarez', assets: 73, requests: 2 },
  { name: 'Engineering Laboratory', location: 'Laboratory Building', custodian: 'Engr. Dela Cruz', assets: 318, requests: 7 },
  { name: 'Facilities', location: 'Maintenance Office', custodian: 'Jun Herrera', assets: 421, requests: 4 }
];

export const transfers = [
  { id: 'TRF-2026-0714-001', asset: 'Dell Latitude 5440', from: 'IT Office', to: 'Computer Laboratory', date: 'Jul 14, 2026', status: 'For Review', risk: 36, type: 'Transfer' },
  { id: 'TRF-2026-0713-004', asset: 'Epson Projector', from: 'Administration', to: 'Supplier Repair', date: 'Jul 13, 2026', status: 'Approved', risk: 72, type: 'Transfer' },
  { id: 'RET-2026-0712-002', asset: 'Canon DSLR Kit', from: 'Student Affairs', to: 'PPMO', date: 'Jul 12, 2026', status: 'For Review', risk: 24, type: 'Return' },
  { id: 'RET-2026-0711-007', asset: 'Portable Generator', from: 'Facilities', to: 'PPMO', date: 'Jul 11, 2026', status: 'Approved', risk: 58, type: 'Return' }
];

export const maintenance = [
  { id: 'MNT-001', asset: 'Brother MFC-L5900DW', type: 'Corrective Maintenance', technician: 'Supplier Technician', schedule: 'Jul 15, 2026', status: 'Scheduled', priority: 'Medium' },
  { id: 'MNT-002', asset: 'Portable Generator', type: 'Preventive Maintenance', technician: 'Facilities Team', schedule: 'Jul 16, 2026', status: 'Scheduled', priority: 'Low' },
  { id: 'MNT-003', asset: 'Epson Projector', type: 'Corrective Maintenance', technician: 'PPMO Technician', schedule: 'Jul 10, 2026', status: 'Overdue', priority: 'High' },
  { id: 'MNT-004', asset: 'Medical Freezer', type: 'Calibration', technician: 'Vendor Support', schedule: 'Jul 08, 2026', status: 'Completed', priority: 'Medium' }
];

export const supplies = [
  { sku: 'SUP-INK-001', name: 'Printer Ink Black', category: 'Printing', stock: 18, minimum: 25, supplier: 'BCP Office Supply' },
  { sku: 'SUP-PAP-002', name: 'A4 Bond Paper', category: 'Office', stock: 145, minimum: 80, supplier: 'Metro Paper Depot' },
  { sku: 'SUP-MED-011', name: 'Alcohol 1L', category: 'Medical', stock: 22, minimum: 30, supplier: 'HealthSource PH' },
  { sku: 'SUP-CBL-019', name: 'HDMI Cable', category: 'IT', stock: 64, minimum: 20, supplier: 'TechHub Manila' }
];

export const purchaseRequests = [
  { id: 'PR-2026-0714-001', requestedBy: 'Computer Laboratory', items: '25 Workstation UPS', amount: 187500, stage: 'PPMO Review', status: 'Pending' },
  { id: 'PR-2026-0713-006', requestedBy: 'Clinic', items: 'Medical supplies replenishment', amount: 42500, stage: 'Department Head', status: 'Pending' },
  { id: 'PR-2026-0712-009', requestedBy: 'Library', items: 'Printer maintenance kit', amount: 14800, stage: 'Purchase Order', status: 'Processing' }
];

export const auditItems = [
  { area: 'Computer Laboratory 2', auditor: 'Auditor Mendoza', verified: 87, missing: 1, ocrChecks: 42, date: 'Jul 18, 2026', status: 'Scheduled' },
  { area: 'Library Circulation', auditor: 'Auditor Ramos', verified: 124, missing: 0, ocrChecks: 66, date: 'Jul 12, 2026', status: 'Completed' },
  { area: 'Engineering Laboratory', auditor: 'Auditor Chua', verified: 211, missing: 3, ocrChecks: 98, date: 'Jul 20, 2026', status: 'Scheduled' }
];

export const monthlyAnalytics = [
  { month: 'Jan', assets: 180, repairs: 18, anomalies: 5 },
  { month: 'Feb', assets: 214, repairs: 20, anomalies: 6 },
  { month: 'Mar', assets: 252, repairs: 17, anomalies: 4 },
  { month: 'Apr', assets: 291, repairs: 28, anomalies: 9 },
  { month: 'May', assets: 334, repairs: 26, anomalies: 7 },
  { month: 'Jun', assets: 381, repairs: 31, anomalies: 11 },
  { month: 'Jul', assets: 426, repairs: 22, anomalies: 8 }
];

export const statusBreakdown = [
  { name: 'Assigned', value: 1456, color: '#2563EB' },
  { name: 'Available', value: 782, color: '#10B981' },
  { name: 'Maintenance', value: 150, color: '#F59E0B' },
  { name: 'Damaged', value: 43, color: '#EF4444' }
];

export const anomalyFlags = [
  { id: 'AI-001', title: 'Repeated repair requests', reason: 'Epson Projector has 4 repair requests in 45 days.', action: 'Inspect for replacement or supplier warranty claim.', priority: 'High', riskScore: 89 },
  { id: 'AI-002', title: 'Low stock trend detected', reason: 'Printer ink usage rose 61% above department baseline.', action: 'Review issuance logs and reorder threshold.', priority: 'Medium', riskScore: 74 },
  { id: 'AI-003', title: 'Duplicate assignment risk', reason: 'Two laptops share the same custodian and overlapping property tags.', action: 'Run OCR verification and physical audit.', priority: 'High', riskScore: 86 },
  { id: 'AI-004', title: 'Unexpected transfer spike', reason: 'Computer Laboratory transfers are 2.4x higher than historical average.', action: 'Require PPMO approval before next transfer.', priority: 'Medium', riskScore: 68 },
  { id: 'AI-005', title: 'Missing asset pattern', reason: 'Three laboratory items were not scanned in the last audit cycle.', action: 'Schedule spot audit for Engineering Laboratory.', priority: 'High', riskScore: 91 }
];

export const recentActivities = [
  { text: 'OCR scan confirmed property number BCP-PPMO-2026-000187.', time: '5 mins ago' },
  { text: 'Library submitted printer repair request MNT-001.', time: '15 mins ago' },
  { text: 'PPMO approved gate pass GP-2026-0714.', time: '1 hour ago' },
  { text: 'Low stock alert created for Printer Ink Black.', time: '2 hours ago' },
  { text: 'Computer Laboratory transfer request moved to PPMO Review.', time: '3 hours ago' },
  { text: 'Auditor Ramos completed Library Circulation audit.', time: 'Yesterday' },
  { text: 'System Administrator updated OCR confidence threshold.', time: 'Yesterday' }
];

export const notifications = [
  { title: 'Approval required', message: 'Purchase request PR-2026-0714-001 is waiting for PPMO review.', time: 'Now', tone: 'blue', icon: Bell },
  { title: 'AI anomaly alert', message: 'Duplicate assignment risk needs confirmation.', time: '8 mins', tone: 'red', icon: Sparkles },
  { title: 'Maintenance reminder', message: 'Brother MFC-L5900DW is scheduled tomorrow.', time: '22 mins', tone: 'orange', icon: Wrench },
  { title: 'Low stock warning', message: 'Printer Ink Black is below minimum stock.', time: '1 hour', tone: 'red', icon: AlertTriangle },
  { title: 'Audit completed', message: 'Library Circulation audit generated a report.', time: 'Yesterday', tone: 'green', icon: CheckCircle2 },
  { title: 'OCR scan received', message: 'Asset label image processed with 92% confidence.', time: 'Yesterday', tone: 'teal', icon: Camera }
];

export const roleMatrix = [
  { role: 'System Administrator', permissions: [true, true, true, true, true] },
  { role: 'Property Custodian', permissions: [true, true, true, true, false] },
  { role: 'PPMO Staff', permissions: [true, true, true, true, false] },
  { role: 'Department Head', permissions: [true, false, true, true, false] },
  { role: 'Employee', permissions: [true, false, false, false, false] },
  { role: 'Auditor', permissions: [true, true, false, true, false] }
];

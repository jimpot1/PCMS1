# PCMS Pre-Oral Review Guide

> **Purpose.** This is the team's speaking and review guide for the Property Custodian Management System (PCMS). It is based on the implemented repository, API routes, DFD/interface testing guide, and architecture notes. Use the wording in your approved Chapters 1–3 for your exact title, locale, respondents, and research-method details. Do not claim a feature is live when this guide marks it as a limitation or planned integration.

## 1. One-minute project explanation

**PCMS is a web-based Property Custodian Management System that gives the institution one controlled, traceable way to register assets, manage supplies, assign property to custodians, process transfers and maintenance, conduct physical audits, and route requests for approval and release.** It replaces fragmented manual records with role-based workflows, a central database, audit logs, reports, QR/OCR-assisted identification, and anomaly monitoring.

The system is for the people responsible for property and supplies: System Administrator, PPMO Staff, Property Custodian/OIC, Department Requester, Department Head, Recommending Approver, President/CEO, and Auditor. The key outcome is accountability: the institution can answer **what item exists, where it is, who is responsible for it, what happened to it, and who approved each action**.

### Short version to memorize

“Our project digitizes the property life cycle—from registration, tagging, issuance, inventory and transfers, through maintenance, audit, procurement, reporting, and access control—so that property records are accurate, searchable, accountable, and auditable.”

## 2. Problems addressed

| Observed operational problem | PCMS response | Evidence/output |
|---|---|---|
| Records may be scattered in paper forms, spreadsheets, and separate offices. | A centralized asset, supply, request, maintenance, audit, and activity-record database. | Searchable records, histories, and exports. |
| It is difficult to confirm the current custodian/location of property. | Asset assignment, acknowledgment, transfer approval, QR details, and clearance checking. | Accountability/PAR record, assignment history, transfer trail. |
| Manual stock checking can cause late replenishment or duplicated requests. | Department-scoped supply balances, stock movements, reorder levels, low-stock alerts, and automatic requisition logic. | Low-stock alert and traceable request. |
| Approval status is hard to follow and can be delayed. | Role-based approval queues, statuses, timeline, rejection/revision routes, and release queue. | Request number, stage, decision history, receipt. |
| Physical inventory may reveal missing or wrongly located assets late. | Audit sessions with QR/asset scanning, verified/missing/wrong-department outcomes, and exception follow-up. | Audit summary, damage report or transfer-review record. |
| Maintenance, loss, damage, and disposal history can be incomplete. | Preventive-maintenance records, reminders, damage reports, status holds, and recorded disposal outcomes. | Maintenance/incident history and activity log. |
| Management lacks timely consolidated data. | Role-scoped dashboards plus CSV/PDF reporting and analytics. | Inventory, supplies, maintenance, audit, and workflow reports. |
| Unauthorized changes could affect accountability records. | Authenticated sessions, role middleware/policies, validation, logged actions, and restricted admin settings. | 403 denial for unauthorized API actions; activity log. |

## 3. As-is versus to-be process

| Area | As-is (manual/fragmented process) | To-be with PCMS |
|---|---|---|
| Asset records | Paper forms or separate files; slow lookup and duplicate/incomplete entries are possible. | One asset registry with unique property record/tag, category, condition, location/department, history, and export. |
| Issuance/accountability | Custodian ownership depends on manual documents and follow-up. | Assignment/PAR record, acceptance/signature fields, return process, and clearance check. |
| Supplies | Physical or spreadsheet count; shortages may be noticed only after stock runs out. | Stock-in/out ledger by department, reorder monitoring, low-stock alerts, and request creation. |
| Transfers | Location/custodian changes may not be reflected promptly. | Transfer request, approval/hold/revision/execute actions, notifications, and anomaly review. |
| Procurement | Requesters must ask for updates across several approvers. | Queued, staged approval routing; requester status tracking; PPMO fulfillment and receipt. |
| Audit | Labor-intensive reconciliation with weak exception tracing. | Audit session, scan result, automatic missing/wrong-location exception records, and summary. |
| Management reporting | Manual consolidation and delayed reports. | Current data filtered and exported as CSV/PDF. |

**Important defense framing:** Do not say the old process had *no* controls. Say its controls were largely manual and therefore harder to consolidate, monitor, search, and audit. PCMS strengthens—not replaces—the institution’s approval authority and property policies.

## 4. The ten modules and their process flows

| # | Module | What it does / key features | Core flow |
|---:|---|---|---|
| P1 | **Asset Registry & Tagging** | Register/manage assets; category, department, condition/status, unique property number, QR information; OCR-assisted label capture; history/export. | Image/label capture → OCR extracts candidate fields → staff verifies/corrects fields → asset record/tag is saved → activity is logged. |
| P2 | **Property Issuance & Acknowledgment** | Assign property; create accountability/PAR-style form; acceptance/signature; return inspection; clearance checking. | Check that asset is available → PPMO assigns to custodian → pending acceptance or active assignment → acknowledgment → inventory/accountability updates → return or clearance check. |
| P3 | **Supplies Inventory** | Department-based supplies; stock-in/stock-out movement ledger; minimum/reorder level; low-stock alert; automatic requisition setting. | Create supply/opening balance → record stock movement → update on-hand quantity → compare with reorder level → alert/requisition if low → restock and resolve condition. |
| P4 | **Custodian Assignment & Transfer** | Track transfers of assets between custodians/departments; approval, revision, hold, execution; transfer recommendations/notifications; anomaly review. | Create transfer → validate asset/source/destination → authorized review/approve or revise/reject/hold → execute authorized transfer → update accountability/history. |
| P5 | **Preventive Maintenance** | Schedule maintenance, due dates, reminder settings/notifications, maintenance history, completion data, repair-frequency monitoring. | Create schedule → due-date monitoring/reminder → service is performed → record provider/cost/details → mark completed and set next due date. |
| P6 | **Lost, Damaged, Unserviceable & Disposal** | Incident/damage report with evidence; asset hold/status update; assessment; repair, lost, unserviceable, or disposal outcome. | Report incident → system holds/updates affected asset → assess → repair or declare outcome → preserve incident trail; affected items cannot follow normal issuance. |
| P7 | **Property Audit & Physical Inventory** | Schedule audit; scan/verify expected assets; detect wrong department; identify missing items; create follow-up exceptions. | Create audit session → scan/enter asset → verified or wrong-department result → complete audit → unverified expected assets become missing exceptions → review summary. |
| P8 | **Procurement Coordination** | Requester and walk-in intake; line items; departmental/recommending/executive approval routing; PPMO release; receipt/gate-pass support. | Submit request → Department Head → optional Recommending Approver → President/CEO when required → Property Custodian/PPMO release → stock/asset update and receipt. |
| P9 | **Reporting & Analytics** | Dashboard statistics; filtered inventory/supplies/maintenance reports; CSV/PDF export; monitoring of operational data. | Select report/type/filter → aggregate authorized data → display summary/table → export CSV/PDF → management uses result for decisions. |
| P10 | **User Roles & Access Control** | Login/logout/change password; user management; roles/departments/status; system settings; protected dashboards and APIs. | Authenticate → regenerate session → load role-specific dashboard → middleware/policy permits or rejects action → administrator manages users/settings → actions are logged. |

### Key differentiators worth emphasizing

- **Traceability, not just encoding:** records are connected across registration, assignment, transfer, maintenance, audit, request, and activity history.
- **Role-based workflow:** the same request does not appear the same way to every user; it progresses only through authorized decision points.
- **Exception handling:** wrong-location audit scans, low stock, unusual stock-out quantities, damaged items, and missing assets have defined follow-up paths.
- **Human-in-the-loop OCR:** OCR accelerates asset-label entry, but staff validate extracted fields before saving.

## 5. Key end-to-end walkthroughs

### A. Recommended live demo: requester to release

1. Sign in as a **Requester** and create a request with department, item(s), quantity, purpose, and date needed.
2. Show the generated request number and initial `pending / department_head` stage in **My Requests**.
3. Sign in as the matching **Department Head**. Open the pending queue and approve the request (or request revision/reject on a prepared second record).
4. If the administrator has enabled it, show the **Recommending Approver** stage. Otherwise explain that this stage is configuration-dependent.
5. Sign in as **President/CEO** and approve the request at executive stage.
6. Sign in as **PPMO Staff or Property Custodian/OIC**. Open the approved/release queue, verify the request, and process the release.
7. Show the receipt and, for a supply item, the resulting stock movement. Return to the requester view to show the completed/released status.

**Narration:** “At every step, the system retains the request number, workflow stage, status, actor, timestamp, and related transaction. The request does not become releasable until the configured approval path is complete.”

### B. Strong second demo: audit exception

1. Create/select an audit for a department.
2. Scan or enter an asset expected in that department: result is **verified**.
3. Scan an asset whose recorded department differs from where it was found: result is **wrong department**.
4. Explain that PCMS creates an anomaly/follow-up transfer record rather than silently overwriting the official location.
5. Complete the audit with an expected asset left unscanned. Show the **missing** exception and related damage-report follow-up.

### C. Fast feature demo: asset registration via OCR

1. Open OCR Asset Tagging as PPMO/authorized staff and upload an asset-label image.
2. Show extracted candidate fields (such as property number, serial number, brand, model, description).
3. Correct any uncertain values, then save the asset to the registry.
4. Show its tag/record and activity history.

**Never say:** “OCR is always accurate.” Say: “It reduces manual encoding; staff validate the result before the permanent record is created.”

## 6. Architecture and microservices

### What “microservices” means in this project

The **main PCMS application is a React frontend + Laravel REST API + relational database**. The specialized AI capabilities are separated into service boundaries so they can be maintained and scaled independently of the core property workflow.

| Component | Responsibility | Communication/result |
|---|---|---|
| React frontend | Role-specific screens, forms, dashboards, tables, charts, and export interaction. | Calls protected Laravel API endpoints. |
| Laravel API (core service) | Business rules, validation, workflows, authorization, persistence, reporting, and audit logging. | Reads/writes the PCMS database; calls specialized services where configured. |
| OCR service | Uses Google Cloud Vision-backed extraction to read asset labels. | Returns candidate property number, serial number, brand, model, and description for staff review. |
| Anomaly-detection service | Detects untracked transfers, unusual supply-out quantities, repeat repairs, and upcoming maintenance conditions. | Produces anomaly alerts and recommended review action. |
| LLM explanation service | Generates an explanation for eligible supply-quantity anomalies. | Adds explanation context for authorized operational roles; it does not make approval decisions. |
| Database | Stores normalized users, departments, assets, assignments, supplies, movements, requests, audits, maintenance, damage reports, gate passes, and logs. | Source of truth for PCMS records. |
| Authentication/session layer | Identifies the user and session used by protected routes. | Laravel authenticated session plus role checks. |

**Safe answer if asked “Is the whole system microservices?”**

“No. The core PCMS is a layered web application. We use service separation for specialized OCR and anomaly capabilities. This lets those capabilities evolve independently while the core Laravel API remains the authority for workflows, validation, and database changes.”

### Architecture flow

`User → React role-based interface → Laravel API (auth, validation, workflow, policies) → PCMS database`

`                                                ↘ OCR / anomaly / explanation services when needed`

## 7. Security implemented

### Implemented controls to state confidently

| Control | What the implementation does | Why it matters |
|---|---|---|
| Authentication | Login validates email/password against a hashed password; inactive accounts are denied. Successful login regenerates the session. | Prevents anonymous use and reduces session-fixation risk. |
| Password protection | Passwords are checked and stored using Laravel hashing; password changes require current password, confirmation, and minimum length. | Passwords are not stored or compared as plain text. |
| Role-based access control (RBAC) | `auth` middleware protects private routes; `EnsureRole` middleware returns HTTP 403 when the role is not allowed. Role-specific dashboards/queues are also shown in the frontend. | Users only access functions appropriate to their responsibility. |
| Authorization policies | Resource controllers use Laravel authorization policies in addition to route role checks. | Limits record operations by actor/context, not merely screen visibility. |
| Server-side validation | Laravel validates required fields, types, allowed values, existence references, quantities, files/images, and workflow actions. | Prevents malformed or invalid records from being saved. |
| Controlled workflow states | Requests, transfers, releases, assignments, gate passes, and audits have allowed stages/statuses and authorized actions. | Prevents bypassing approval/release procedures. |
| Database transactions/locking | Critical inventory/assignment/release paths use transactions and, where needed, row locking. | Helps prevent double release, negative availability, and partial updates. |
| Activity logging | Major operations create activity records with action, payload/context, user, and time. | Supports accountability and audit investigation. |
| Restricted AI explanations | Detailed AI anomaly explanations are limited to operational/admin roles. | Reduces unnecessary exposure of operational context. |

### Accurate boundaries / recommended hardening

- Use HTTPS, secure session-cookie settings, environment-managed credentials, production error handling, backups, monitoring, rate limiting, and security testing at deployment.
- Do not describe the present system as having MFA, encryption at rest, a live SIEM, or live external integrations unless the deployed configuration proves it.
- File uploads are validated by type/size in relevant controllers; production deployment should also use private storage and malware scanning where institutional policy requires it.
- Security is layered: frontend hiding is only for usability; the Laravel middleware, policies, validation, and database rules are the enforcement points.

## 8. Common panel questions with defense-ready answers

### Project rationale and scope

**Q: What problem does PCMS solve?**  
**A:** It addresses fragmented property and supply records, unclear accountability, delayed visibility of approvals and stock, manual audit reconciliation, and limited reporting. PCMS centralizes records and makes each asset/request traceable through controlled workflows.

**Q: Why is this system needed when spreadsheets already exist?**  
**A:** A spreadsheet can list items, but it does not reliably enforce role permissions, approval stages, asset accountability, audit exceptions, activity history, and connected stock movements. PCMS links these transactions in one controlled system.

**Q: What is the project’s scope?**  
**A:** The scope is the property and supplies life cycle represented by P1–P10: registry/tagging, issuance, supplies, transfers, maintenance, incidents/disposal, audit, procurement, reports, and RBAC. External systems mentioned in process documentation are integration points only; they are not live integrations in the current implementation.

**Q: Who are the users and beneficiaries?**  
**A:** Direct users are administrators, PPMO staff, custodians/OIC, requesters, approvers, and auditors. Beneficiaries include departments and management because they receive faster visibility, accountability, and reliable reports.

**Q: What makes your work different from a basic inventory system?**  
**A:** It is a property-custody workflow system, not only a stock list. It manages accountability/PAR, approval routing, transfers, audit exceptions, maintenance and incident states, activity logs, and role-specific actions.

### Modules and process

**Q: Which module is the core of the system?**  
**A:** The asset registry is the factual foundation, while the procurement/approval workflow is the operational control path. All modules are intentionally connected; for example, a released supply request affects inventory, and audit findings can trigger incident or transfer review.

**Q: How do you prevent a user from releasing an unapproved request?**  
**A:** The request has controlled stages and statuses. Only authorized roles have the release endpoint, and the release queue is filtered for eligible approved requests. The backend—not merely the screen—enforces the action.

**Q: What happens if an item is found in the wrong department during audit?**  
**A:** The audit records `wrong_department`, creates an untracked-transfer anomaly, and creates/uses a transfer-review record. PCMS does not silently change the official department; authorized staff must review it.

**Q: What happens when stock is low?**  
**A:** The system checks the department supply balance against the reorder level, shows a low-stock condition, and can create one traceable automatic requisition per active low-stock incident. Restocking above the threshold resolves the condition.

**Q: What happens if an asset is damaged or lost?**  
**A:** A damage/incident report is created and the asset is held/updated so it cannot proceed through normal issuance. Staff assess it and preserve the result—repair, declared lost, unserviceable, or disposed—in the record history.

**Q: How do you avoid duplicate asset records?**  
**A:** The registry generates/uses a property identifier and verifies asset details before saving. OCR assists but does not autonomously create a final record; the staff review step is important.

### AI, OCR, and microservices

**Q: Is OCR the same as AI decision-making?**  
**A:** No. OCR extracts text from an asset label to speed encoding. It returns candidate data; an authorized staff member validates and corrects it before the asset is saved.

**Q: How does anomaly detection work?**  
**A:** It uses explainable rules/statistical checks. For example, it flags an asset found in a department different from its recorded department, and it checks unusual supply-out quantities using historical values and a z-score threshold. It produces an alert for human review, not an automatic punishment or approval decision.

**Q: Why use microservices?**  
**A:** OCR and anomaly analysis are specialized workloads. Separating them keeps the core workflow stable and lets us improve or scale the specialized capability independently. The central API still validates and owns final database changes.

**Q: What if OCR or AI is unavailable?**  
**A:** The core system can still use manual data entry and normal workflow controls. These services assist users; they are not the sole source of truth for property records or approvals.

### Data, security, and quality

**Q: How is data secured?**  
**A:** PCMS uses authenticated sessions, hashed passwords, role middleware, authorization policies, server-side validation, restricted operational routes, controlled workflows, transactions/locking in critical processes, and activity logs. We also identify HTTPS, secure deployment configuration, backups, and security testing as deployment hardening requirements.

**Q: Can a user change records they should not see?**  
**A:** A user may be unable to see a menu in the interface, but the important control is server-side: protected API routes check authentication, role, and policy. A direct unauthorized request is denied with a 403 response.

**Q: How do you ensure data accuracy?**  
**A:** Required/typed server-side validation, controlled references to existing departments/assets/users, staff verification of OCR output, status rules, transaction logging, and physical-audit reconciliation work together. Accuracy is also operational: records must be entered and verified correctly by authorized staff.

**Q: How did you test the system?**  
**A:** We test each DFD module with an actor, input, expected output, stored record, authorization result, exception path, and screenshot/log evidence. The documented end-to-end scenario tests requester submission through approval and release, and the audit scenario tests verified, missing, and wrong-location outcomes.

**Q: What are the system’s current limitations?**  
**A:** External integrations such as HR/FMS/PREFECT and similar systems are not live; they are manual verification points. Some advanced UI areas may be placeholders. Notifications and the recommending-approver stage are configuration/implementation dependent. The current reporting export is CSV/PDF, not native XLSX. These are transparent future-enhancement items, not claims of completed integration.

### Research-defense questions to prepare from Chapters 1–3

**Q: What methodology did you use and why?**  
**A:** Answer using the exact methodology in the approved manuscript. Connect it to your requirements gathering, design, implementation, and testing outputs. Do not substitute a methodology name from this guide.

**Q: Who were your respondents, and how were they selected?**  
**A:** State the exact population, sampling method, count, and rationale from the approved Chapter 3. Explain that their roles give them direct knowledge of property/supply procedures.

**Q: How will you measure whether the system is acceptable/effective?**  
**A:** Use the actual evaluation instrument and criteria in Chapter 3 (for example, functional suitability, usability, reliability, security, and performance if those are in your study). Do not invent numerical results before data collection/analysis is complete.

**Q: What are your ethical/data-privacy considerations?**  
**A:** Discuss authorized access, minimum necessary operational data, secure credentials, limited role visibility, controlled test data, consent/approval procedures in the study, and observance of applicable institutional privacy policy. Use your manuscript’s exact protocol.

## 9. Team oral-delivery guide

| Presenter/topic | Must be able to explain |
|---|---|
| Problem/rationale | The pain points, beneficiaries, scope, and why a workflow system is needed. |
| DFD/modules | P1–P10, inputs/process/outputs, and cross-module connections. |
| Technical architecture | React, Laravel REST API, database, specialized OCR/anomaly services, and why final control remains in Laravel. |
| Demo lead | Login roles, request-to-release walkthrough, audit exception, prepared sample data, and fallback screenshots/video. |
| Security/test lead | RBAC, validation, policies, logs, transactions, test cases, known limits, and future hardening. |
| Research lead | Exact Chapter 1–3 wording: title, objectives, framework, methodology, respondents, instruments, and evaluation plan. |

## 10. Final checklist before the pre-oral

- Confirm the exact project title, institution/client name, research objectives, framework, methodology, respondents, and evaluation instrument against the approved PDF.
- Make a one-page mapping from each research objective to the specific PCMS module(s) that answer it.
- Seed safe demo data with obvious labels such as `DEMO-LAPTOP-001`; never use real personal or sensitive production data.
- Prepare accounts for Requester, Department Head, Recommending Approver (if enabled), President/CEO, PPMO, OIC/Property Custodian, and Administrator.
- Rehearse the normal path and one exception path: rejected/revision request, low stock, wrong-location asset, or damaged asset.
- Verify the demo environment, database connection, OCR configuration, export function, and browser before presenting. Capture screenshots or record a short fallback video.
- Be precise with verbs: say **implemented**, **configuration-dependent**, **manual simulation**, or **future integration** as appropriate.
- Never expose real passwords, API keys, database credentials, or the `.env` file during the presentation.

## Appendix: quick facts to memorize

- **System name:** Property Custodian Management System (PCMS).
- **Primary goal:** accurate, accountable, traceable management of institutional property and supplies.
- **Ten modules:** registry/tagging; issuance/PAR; supplies; transfer; maintenance; incident/disposal; audit; procurement; reports; RBAC.
- **Core approval path:** Requester → Department Head → optional Recommending Approver → President/CEO → Property Custodian/PPMO release → receipt/stock or asset update.
- **AI boundary:** OCR and anomaly analysis assist staff; humans remain responsible for validation and decisions.
- **Security boundary:** role-aware interface helps usability; backend authentication, middleware, policies, validation, workflows, and logs enforce access/control.
- **Truthful limitation statement:** external enterprise integrations are not yet live, and they must not be presented as operational.

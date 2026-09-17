# PCMS DFD Interface Testing Guide

Use this guide to familiarize yourself with the PCMS, test the implemented processes, and compare the observable result with the Level 2 DFDs in `flowcharts/`.

## Before you begin

1. Use a **test database** or clearly-labelled sample records (for example, `TEST-LAPTOP-001`). These tests create real records, approvals, stock movements, maintenance logs, and notifications.
2. Prepare accounts for: **System Administrator**, **PPMO Staff**, **Department Requester**, **Department Head**, **Recommending Approver**, **President**, and **Property Custodian/OIC**.
3. Create at least one department, one asset category, one asset, and one supply assigned to that department. Give the supply a small quantity and a reorder level greater than that quantity.
4. Capture evidence after each test: record/reference number, status, date/time, screenshot, notification, and Activity Log entry. Record actual versus expected behavior in a test sheet.
5. External integrations (HR, PREFECT, FMS, Clinic, OSAS, School Event, and Alumni) are not yet connected. Treat the integration steps below as **manual simulation/verification points**, not failed tests.

## Quick module map

| DFD process | Interface area | Main role |
|---|---|---|
| P1 Asset Registry & Tagging | Asset Registry; OCR Asset Tagging | PPMO Staff |
| P2 Property Issuance & Acknowledgment | Asset Assignment; Asset Return | PPMO Staff, requester |
| P3 Supplies Inventory | Department; Supplies Inventory; Inventory Monitoring | PPMO Staff |
| P4 Custodian Assignment & Transfer | Asset Transfer | PPMO Staff, OIC |
| P5 Preventive Maintenance | Preventive Maintenance; Notifications | PPMO Staff |
| P6 Lost, Damaged, Unserviceable | Damage Report | PPMO Staff/OIC |
| P7 Property Audit & Physical Inventory | Audit Dashboard | PPMO Staff/OIC |
| P8 Procurement Coordination | Purchase Workflow; role approval queues; release queue | requester, approvers, PPMO |
| P9 Reporting & Analytics | Reports & Analytics | PPMO/OIC/Admin |
| P10 User Roles & Access Control | Login; User Management; System Settings | System Administrator |

## P1 — Asset Registry & Tagging

**DFD flow:** P1.1 Image Capture & AI OCR → P1.2 Field Mapping → P1.3 Asset Tag & Record Generation.

1. Sign in as **PPMO Staff** and open **Asset Management → OCR Asset Tagging**.
2. Upload a clear asset-label image. Run OCR and inspect the extracted fields/confidence result.
3. Correct incomplete or low-confidence values. This is the manual-verification loop shown in P1.2.
4. Save the mapped record, then open **Asset Registry** and confirm the asset tag, category, description, department, condition, and status.
5. Open the asset’s detail/QR tag, if available, and confirm the generated tag identifies the same asset.
6. Open **Activity & Transaction Logs** and verify an asset-registration/update entry.

**Expected:** one valid asset record is stored in the Asset Ledger, with no duplicate tag number. OCR assists entry; staff remain responsible for correcting extracted data.

**Manual integration check:** note that FMS depreciation synchronization, School Event availability checks, and Alumni donated-asset intake are documented flows but require their external systems to be connected.

## P2 — Property Issuance, PAR, Acknowledgment, and Clearance

**DFD flow:** custodian verification → PAR/accountability record → assignment → return/clearance checking.

1. Ensure an asset is available and not assigned, disposed, lost, or under repair.
2. As **PPMO Staff**, open **Property Issuance → Asset Assignment** and create an assignment for a test employee/custodian.
3. Submit/activate the assignment according to the screen’s available action. Record the generated PAR/accountability reference.
4. Sign in as the assigned requester/custodian and open **My Assigned Assets**. Confirm the same asset appears there.
5. Back in PPMO, verify the asset now shows the correct custodian and its available inventory/assignment state changed only once.
6. Test the return path from **Asset Return** or the assignment/transfer action. Complete the return and confirm the asset becomes available again.
7. For clearance, initiate a clearance check for a custodian with no active property. It should clear. Repeat with an active assignment; it should be held/flagged until the property is returned or resolved.

**Expected:** the PAR/accountability link and custodian are traceable, clearance cannot pass while active accountability remains, and each action appears in logs.

**Manual integration check:** HR identity/department verification and PREFECT clearance-hold exchange are currently simulated by PCMS records; no live external request should be expected.

## P3 — Department Supplies Inventory and Low-Stock Requisition

**DFD flow:** P3.1 stock transaction → P3.2 threshold monitoring → P3.3 alert and procurement requisition.

1. As **PPMO Staff**, open **Inventory → Department** and select a test department (for example, Clinic). Add a supply with its unit, opening quantity, and reorder level.
2. Confirm the supply is listed in the Clinic inventory—not the general/unassigned inventory—and that its department is shown correctly.
3. Open **Supplies Inventory** and add a stock-in transaction. Confirm the department-specific on-hand quantity increases and a transaction is recorded.
4. Add a stock-out/release transaction large enough to make on-hand quantity less than or equal to the reorder level.
5. Open **Inventory Monitoring** and **Notifications**. Confirm the low-stock status/alert is visible.
6. Open **Purchase Workflow**. Confirm an automatic low-stock requisition exists for the same supply and department. Repeat the threshold check/transaction and confirm it does not create a duplicate active requisition.
7. Stock in enough units to exceed the reorder level. Refresh Monitoring and Purchase Workflow; the active low-stock trigger/requisition should no longer remain pending because of that shortage.

**Expected:** every supply and stock balance is department-scoped. Low stock creates one traceable procurement request and alert; restocking resolves the low-stock condition.

**Manual integration check:** Clinic, OSAS, and Alumni supply messages are not live. You can use a normal stock-in/out record to simulate their input and record the result in your test sheet.

## P4 — Custodian Assignment, Transfer, and Anomaly Review

**DFD flow:** log transfer → validate against asset/custodian data → execute, or route an anomaly to OIC.

1. Use an asset with an active assignment. As **PPMO Staff**, open **Property Issuance → Asset Transfer**.
2. Create a valid transfer using the current custodian and a valid new custodian/department. Submit it through its approval path.
3. Verify the transfer record includes the asset, source and destination custodian/department, reason, and status.
4. Complete the transfer as the authorized approver/OIC when it reaches their queue.
5. Confirm the asset detail and accountability record now show the destination custodian/location and that the requester receives a notification.
6. Test an exception: use an invalid/mismatched destination or scan an asset in a wrong department during P7. Confirm the record is flagged for review rather than silently changing accountability.

**Expected:** a valid transfer updates custodian/location once; irregular data routes to an OIC review queue. The documented P4 anomaly logic is rule/statistical validation, not AI OCR.

## P5 — Preventive Maintenance and Reminders

**DFD flow:** calculate/schedule → reminder notification → completion record.

1. As **PPMO Staff**, select an active asset and open **Maintenance → Preventive Maintenance**.
2. Create a maintenance schedule with a due date inside the configured reminder window. You may temporarily set the reminder-days value in **Administration → System Settings** as an admin.
3. Refresh Notifications and confirm the maintenance reminder appears for the responsible PPMO user. Run the scheduled command only if your local scheduler is configured; otherwise use a due/overdue record already produced by the application’s reminder run.
4. Open the maintenance item, record service details, service date, provider/technician, cost, next due date, and mark it completed.
5. Confirm the maintenance history and asset maintenance status update. Check Activity Logs/Notifications for the resulting record.
6. Refresh or run the reminder process again; the same schedule should not create repeated duplicate reminder notifications.

**Expected:** the asset has a traceable maintenance schedule and history, upcoming/overdue work alerts staff, and completion updates the schedule/history.

## P6 — Lost, Damaged, Unserviceable, and Disposal Workflow

**DFD flow:** incident report → asset condition/status update → repair, hold, or disposal decision.

1. As **PPMO Staff**, open **Maintenance → Damage Report** and create a report for a test asset. Attach a photo when available.
2. Test separately with the incident/assessment set to **damaged**, **lost**, and **unserviceable**. Supply a clear description and date for each test asset.
3. Confirm the asset’s condition/status reflects the report and that it is no longer treated as normally available for transfer/issuance.
4. For a repairable item, create or update its maintenance record from **Preventive Maintenance** and confirm the repair history is linked conceptually to the incident.
5. For an unserviceable item, submit the disposal decision/details required by the screen; use the approved disposal action. Confirm disposal data/status is retained and the asset cannot be re-issued.
6. Attempt a clearance/transfer using an affected asset to verify the accountability hold/restriction behavior. Review Notifications and Activity Logs.

**Expected:** incident history remains attached to the asset; lost/unserviceable/disposed assets cannot move through normal issuance; disposal is a recorded decision, not a deletion.

**Manual integration check:** a live PREFECT clearance hold is pending external integration. Verify PCMS’s local clearance/accountability outcome instead.

## P7 — Property Audit and Physical Inventory

**DFD flow:** create audit session → scan/verify expected asset → resolve missing or mismatch exceptions.

1. As **PPMO Staff** or **OIC**, open **Procurement & Audit → Audit Dashboard**.
2. Create an audit session for a specific department/location. Confirm the system loads the expected registered-asset dataset.
3. Scan or enter the QR/tag of an asset that belongs in the session. Confirm it is marked verified and audit progress changes.
4. Scan an asset assigned to another department/custodian. Confirm a mismatch/anomaly is created instead of marking it verified for the wrong place.
5. Leave one expected asset unverified, then complete the audit. Confirm the missing/unverified result becomes an exception for P6 investigation.
6. Review the completed audit summary and **Activity & Transaction Logs**. Verify the session, scans, mismatches, and final result are visible.

**Expected:** audit results distinguish verified, missing, and wrong-location/custodian assets. Missing items lead to P6 follow-up; mismatches lead to P4 review.

## P8 — Procurement, Approvals, Fulfillment, and Release

**DFD flow:** intake/validation → role-based approval routing → PPMO fulfillment/release → stock, asset, and PAR updates.

1. As a **Department Requester**, submit a request through the requester portal (or have PPMO create one through **Operations → Walk-in Request**). Add a supply or asset, quantity, purpose, department, and date needed.
2. Confirm the request appears under the requester’s **My Requests** with its initial status and request number.
3. Sign in sequentially as **Department Head**, **Recommending Approver** (when enabled), and **President**. In each approval queue, open the request and approve it. Record the status/stage after each decision.
4. To test rejection, create a second request and reject it at one stage with a reason. Confirm it stops routing and is visible in request history.
5. As **PPMO Staff**, open **Approved Release Queue**. Verify only fully approved requests appear. Review/edit the request if needed, then choose **Process Release** and confirm it.
6. Confirm the release creates a receipt; use **Release Receipt Preparation** to view, print, or download it.
7. For a supply request, confirm P3 reduces the department’s stock only once. For an acquired asset, confirm P1 registration/P2 accountability is completed when applicable.
8. Test stock insufficiency with a request greater than available quantity. Confirm release is prevented or handled as the implemented hold/partial workflow, rather than creating negative stock.

**Expected:** requests follow configured approval stages, rejected requests do not reach release, only fully approved requests enter PPMO release, and releasing changes the appropriate stock/asset/accountability records exactly once.

**Manual integration check:** FMS budget/PO validation is not live. Record the PCMS approval and release status; do not expect a financial-system response.

## P9 — Reporting and Analytics

**DFD flow:** aggregate D1–D5 records within the user’s allowed scope → display/export reports.

1. Create at least one test record in P1, P3, P5, P6, P7, and P8 so reports have meaningful data.
2. As **PPMO Staff**, **OIC**, or **System Administrator**, open **AI & Reports → Reports & Analytics**.
3. Generate the Asset Inventory, Supplies Inventory, and Maintenance Summary reports. Apply available filters such as department/date/status.
4. Compare report totals and rows against the source screens: Asset Registry, Department Supplies Inventory, Maintenance, Audit Dashboard, and Purchase Workflow.
5. Use **CSV Export** and open the downloaded file in Excel/LibreOffice. Confirm the headers, filters, and row count match the visible report.
6. Use **PDF Export** and verify the downloaded/printed document contains the report title, filters, table/summary data, and date.
7. Repeat as a lower-privileged role, if that role can access reports, and verify it cannot see records outside its permission/data scope.

**Expected:** reports reflect current PCMS data and produce usable CSV/PDF outputs. CSV is Excel-compatible; a separate native `.xlsx` workbook export is not currently the implemented export format.

## P10 — User Roles, Access Control, and System Settings

**DFD flow:** authenticate → issue role-scoped session/token → allow/deny actions based on permissions; admin maintains users/settings.

1. As **System Administrator**, open **Administration → User Management**. Create or edit a test user, assign a department and one role, then save.
2. Sign out and sign in as that user. Confirm the dashboard/sidebar matches the assigned role and the user cannot directly browse to restricted areas.
3. Verify at least one positive and one negative permission case: for example, PPMO can manage assets but a Department Requester cannot; an approver can open their approval queue but cannot manage supplies.
4. As admin, open **Administration → System Settings**. Change a clearly reversible setting, save, refresh the page, sign out/in, and confirm the saved value persists.
5. Test **Use recommending approver**: enable it, create a new purchase request, and verify it receives the Recommending Approver stage. Disable it, create another request, and verify the new request skips that stage. Do not change the setting while a request is already mid-approval unless deliberately testing policy transition behavior.
6. Test **Automatic low-stock requisitions**: disable it, make a supply low-stock, and confirm the alert does not create a new automatic requisition; re-enable it and repeat using a new test supply.
7. Test **Maintenance reminder days** with a test schedule due inside/outside the configured window. Confirm notifications follow the saved setting.
8. Review **Activity & Transaction Logs** and notifications for account/configuration actions where available.

**Expected:** roles control interface and API access, system settings remain after refresh/login, and the three policy settings influence only new/evaluated workflows as designed.

## Final documentation comparison checklist

For each completed test, mark these items in your test sheet:

- The actor, input, process result, stored record, notification, and output match the DFD arrow.
- The correct data store is reflected: assets/PAR in D1, supplies in D2, maintenance/incidents in D3, activity/approval/audit logs in D4, users/roles in D5.
- A rejected, invalid, missing-stock, wrong-location, or unserviceable scenario takes the exception path instead of the normal path.
- The result is visible to the correct next actor and hidden from unauthorized roles.
- Any difference is labelled either **implementation defect**, **documentation mismatch**, **test-data issue**, or **external integration pending**.

When you find a difference, capture the module/process number, test record ID, user role, exact steps, expected result from the DFD, actual result, and screenshot. That makes it straightforward to decide whether we should fix the code or revise the diagram.

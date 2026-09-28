# PCMS Main AI Features

## Simple Explanation for the Capstone Adviser

PCMS has two main AI-supported features:

1. **AI OCR** - reads information from asset documents or labels.
2. **Anomaly Monitoring** - finds unusual inventory and property activities.

The AI assists the staff. It does not replace human checking, approval, or decision-making.

## 1. AI OCR

### What it does

Staff upload a picture of an asset label, receipt, or property document. The OCR reads the text and extracts possible information such as:

- Property number
- Asset name
- Brand and model
- Serial number
- Description
- Department and location
- Purchase date and cost
- Quantity and condition

### How it works

```text
Upload document image
        |
Google Vision reads the text
        |
PCMS organizes the extracted information
        |
PCMS shows confidence scores
        |
Staff reviews and corrects the result
        |
Confirmed information is saved as an asset record
```

### Why it is useful

OCR reduces manual typing and helps staff register assets faster. It also keeps a record of the original scan.

### Important point

OCR is not always perfect. Staff must check the extracted information before saving it as an official asset record.

**Simple explanation:**

> OCR reads the information from an asset document and prepares the data for registration. The staff member still checks and confirms the information.

## 2. Anomaly Monitoring

### What it does

Anomaly Monitoring checks the system for unusual or inconsistent activities. When it finds one, PCMS creates an alert for authorized staff to investigate.

### Examples of anomalies

**Unusual supply quantity**

The system compares a new supply movement with previous movements. For example, if a department normally receives about 100 ballpens but suddenly receives 500, the system flags it for review.

**Unusual requester frequency**

The system checks if a person requests the same supply much more often than usual. This may be caused by a legitimate project or activity, so it still requires human review.

**Untracked asset transfer**

If an asset is recorded under one department but is found in another department during an audit, PCMS creates an alert.

**Low stock**

If the quantity of a supply falls below its minimum level, PCMS shows a low-stock alert so staff can reorder.

### How it works

```text
Supply, request, or audit activity occurs
        |
PCMS checks the activity using rules and statistics
        |
An alert is created when something is unusual
        |
Responsible staff are notified
        |
Staff investigate and resolve the alert
```

### How statistics are used

For supply quantities, PCMS uses historical data. It calculates the average previous quantity and compares the current quantity with that average. A large difference can be flagged using a z-score threshold.

The statistical check explains why the activity was flagged. It does not automatically accuse a person of fraud or wrongdoing.

### AI explanation

For eligible supply anomalies, the AI can summarize the recorded evidence in simple language. It may explain:

- What changed
- How different the activity is from normal
- Possible legitimate reasons
- What the responsible officer should verify

The AI explains an alert that was already detected. It does not approve requests, decide guilt, or close the investigation.

**Simple explanation:**

> Anomaly Monitoring looks for unusual patterns in supplies and property records. It creates an alert so authorized staff can investigate and take the proper action.

## How the Two Features Work Together

OCR helps create accurate asset records. Anomaly Monitoring checks what happens to those assets and supplies after they are recorded.

Example:

1. Staff use OCR to register a laptop.
2. The staff member checks the serial number, property number, and location.
3. During an audit, the laptop is found in another department.
4. PCMS detects the location mismatch.
5. PCMS creates an untracked-transfer alert.
6. Authorized staff verify whether the transfer was approved and update the record if necessary.

## Main Benefit to the Organization

Together, these features help PCMS:

- Reduce manual data entry
- Improve asset registration
- Detect unusual supply usage
- Find asset location discrepancies
- Notify responsible personnel
- Support audits and accountability

## Short Answer for the Adviser

> The two main AI-supported features of PCMS are OCR and Anomaly Monitoring. OCR reads asset documents and extracts information such as the property number, serial number, and description, but staff must validate the result before saving it. Anomaly Monitoring checks inventory and property activities for unusual patterns, creates alerts, and can provide an AI explanation. The AI assists the staff, while final verification, approval, and resolution remain under the authorized PCMS workflow.

## Other PCMS Modules

The AI features support the main PCMS modules. Each module handles a different part of the property and supplies process.

### P1. Asset Registry and Tagging

This module stores the official records of equipment and property. Staff can register assets, assign property numbers, record their department and condition, and view asset history. OCR helps staff enter the information faster.

### P2. Property Issuance and Acknowledgment

This module assigns an asset to a responsible employee or custodian. It records the accountability or PAR information, acceptance, returns, and clearance checking.

### P3. Supplies Inventory

This module manages department supplies and stock movements. It records stock received and released, checks available quantities, and shows low-stock alerts when supplies reach the reorder level.

### P4. Custodian Assignment and Transfer

This module manages the movement of property between custodians or departments. It records the source, destination, reason, approval, and final transfer status.

### P5. Preventive Maintenance

This module records maintenance schedules for assets. It reminds staff about upcoming maintenance and stores service details, costs, providers, completion dates, and the next schedule.

### P6. Lost, Damaged, Unserviceable, and Disposal

This module handles incidents involving property. Staff can report lost or damaged assets, place affected assets on hold, record assessments, and document repair, unserviceable, or disposal decisions.

### P7. Property Audit and Physical Inventory

This module helps staff verify the physical assets in a department. It identifies assets that are verified, missing, or found in the wrong department and creates follow-up actions for exceptions.

### P8. Procurement Coordination

This module manages requests for supplies or property. Requests pass through the required approval levels before the authorized staff release the item and update the related inventory or asset record.

### P9. Reporting and Analytics

This module summarizes the information stored in PCMS. Users can view filtered asset, supply, maintenance, audit, and workflow reports and export the results for management use.

### P10. User Roles and Access Control

This module manages login, users, roles, departments, account status, and system settings. It ensures that users can only view and perform actions allowed by their role.

## Simple Overall System Flow

```text
User logs in
        |
User performs an authorized action
        |
PCMS validates and records the action
        |
The related module updates the asset, supply, request, or audit record
        |
Notifications, reports, and activity history are updated
        |
AI OCR or Anomaly Monitoring assists when needed
```

## Short Explanation of the Whole System

> PCMS is a centralized system for managing properties, supplies, requests, transfers, maintenance, audits, reports, and users. The Asset Registry stores the official property information, while the other modules manage what happens to the assets and supplies throughout their life cycle. The approval workflow and role-based access control make sure that the right person performs each action. OCR helps staff register assets, and Anomaly Monitoring helps identify unusual activities that need review.

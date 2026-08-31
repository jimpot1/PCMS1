# PCMS Inventory Anomaly Detection System

## Overview

The PCMS Inventory Anomaly Detection System automatically detects unusual patterns and behaviors in inventory management using statistical analysis and AI-powered explanations. When anomalies are detected, the system:

1. **Flags the anomaly** in the Inventory Risk & Anomaly Monitoring Center
2. **Notifies relevant personnel** (OICs, Property Custodians, System Administrators)
3. **Generates AI explanations** using Groq LLM to explain the risk and recommended actions
4. **Tracks resolution status** for audit and compliance purposes

---

## Types of Anomalies Detected

### 1. **Quantity Anomalies** (`quantity_anomaly`)

**What it detects:**
- Unusual stock movements for a supply in a department
- Detects when a quantity movement is statistically unusual compared to historical patterns

**How it works:**
- **Method:** Statistical Z-score analysis
- **Calculation:** Compares current movement quantity against the historical average and standard deviation
- **Threshold:** Z-score > 2 (approximately 95th percentile - 2 standard deviations from mean)
- **Data requirement:** At least 3 previous movements of the same supply in the same department
- **Time period:** Analyzes all historical movements (typically last 6-12 months)

**Example:**
```
Supply: Ballpen
Department: Engineering
Historical movements: [100, 120, 110, 115, 105] units
Average: 110 units
Std Dev: 7.9 units
Current movement: 250 units
Z-score: (250 - 110) / 7.9 = 17.7 ❌ ANOMALY DETECTED
```

**When it's created:**
- During stock movements (when a request is fulfilled/released)
- During stock adjustments

**Risk score:** 6.0 (Medium)

**AI Explanation includes:**
- Z-score value and interpretation
- Historical average and standard deviation
- Historical usage chart
- Groq AI analysis of the unusual pattern
- Risk interpretation and verification recommendations

---

### 2. **Requester Frequency Anomalies** (`requester_frequency_anomaly`)

**What it detects:**
- Unusual request frequency by a single requester for a specific supply
- Detects when a user is requesting supplies at an abnormally high rate

**How it works:**
- **Method:** Time-series frequency analysis with Z-score
- **Calculation:** Compares recent request frequency (last 30 days) against historical monthly average (6-month baseline)
- **Threshold:** Z-score > 2 AND current frequency > historical average
- **Data requirement:** At least 2 months of historical request data
- **Time period:** 
  - Recent: Last 30 days
  - Historical: 6 months prior (excluding recent 30 days)

**Example:**
```
Requester: John Doe (Engineering Department)
Supply: Ballpen
Historical average: 2 requests/month (over 6 months)
Recent requests (30 days): 8 requests
Std Dev: 1.4
Z-score: (8 - 2) / 1.4 = 4.3 ❌ ANOMALY DETECTED
```

**When it's created:**
- During purchase request submission (if anomaly is detected)
- Can be triggered by system when analyzing request patterns

**Risk score:** 5.0 (Medium)

**AI Explanation includes:**
- Requester name and department
- Supply name
- Request frequency comparison
- Historical usage pattern
- Groq AI analysis of potential causes (training, project needs, fraud risk, etc.)
- Verification recommendations

---

### 3. **Untracked Transfers** (`untracked_transfer`)

**What it detects:**
- Assets physically found in a different department than recorded
- Detects unauthorized asset movements or misplaced property

**How it works:**
- **Trigger:** During physical asset audit/inventory count
- **Detection:** When an asset's physical location doesn't match the recorded department
- **No statistical analysis:** Simple location mismatch check

**Example:**
```
Asset: Laptop (Serial: XYZ123)
Recorded department: Finance
Found in: Engineering ❌ ANOMALY DETECTED
```

**Risk score:** 7.5 (High)

**Recommended action:**
- Review asset location
- Update department record if transfer is authorized
- Investigate if transfer is unauthorized

---

### 4. **Low Stock Alerts** (`low_stock`) - NOT AN ANOMALY

**Note:** Low stock conditions are **NOT technically anomalies** but operational alerts.

**What it detects:**
- Stock quantity falls below the minimum threshold

**How it works:**
- **Trigger:** Real-time stock level monitoring
- **Threshold:** Current stock < Minimum stock level
- **No AI explanation:** These are simple threshold violations

**Example:**
```
Supply: Ballpen
Current stock: 500 units
Minimum stock: 500 units
Status: Low Stock ⚠️ REORDER NEEDED
```

**Recommended action:**
- Reorder supply immediately

---

## Anomaly Alert Lifecycle

```
1. DETECTION
   ├─ System monitors inventory movements
   ├─ Analyzes patterns using statistical methods
   └─ Creates anomaly_alerts record

2. NOTIFICATION
   ├─ Relevant personnel notified
   └─ Transfer notification sent

3. AI EXPLANATION (Pending)
   ├─ Groq API processes anomaly details
   ├─ Generates risk interpretation
   └─ Updates ai_explanation field

4. REVIEW
   ├─ Administrator views in Monitoring Center
   ├─ Can request explanation regeneration
   └─ Investigates underlying cause

5. RESOLUTION
   ├─ Administrator marks as "Resolved"
   ├─ Documents findings
   └─ Closes anomaly alert
```

---

## Alert Priority & Risk Scoring

### Priority Levels
- **HIGH:** Immediate security or compliance concern (untracked transfers)
- **MEDIUM:** Requires investigation within 24-48 hours (quantity anomalies, frequency anomalies)

### Risk Score Scale (0-10)
- **7.5:** Untracked transfers (asset location mismatch)
- **6.0:** Quantity anomalies (unusual stock movements)
- **5.0:** Requester frequency anomalies (unusual request patterns)

---

## AI Explanation with Groq

When viewing anomaly details in the Monitoring Center, you can:

1. **View existing explanation** if generated
2. **Regenerate explanation** to get fresh AI analysis
3. **Request new explanation** if none exists

### Explanation Status
- **pending:** Waiting for AI to generate explanation
- **generated:** Explanation available (display in modal)
- **failed:** AI API error - try regenerating

### What Groq Explains
- **For Quantity Anomalies:**
  - Is this unusual?
  - What could have caused it?
  - Is it a risk?
  - What should the OIC verify?

- **For Frequency Anomalies:**
  - Is request frequency unusual?
  - Possible legitimate reasons (project, training, etc.)
  - Potential fraud indicators
  - Recommendations for verification

---

## Accessing Anomalies

1. Navigate to **Inventory Monitoring** in the sidebar
2. View **"Total Alerts"** dashboard card
3. Filter by type:
   - **Quantity Anomaly:** Supply usage patterns
   - **Requester Frequency:** User request patterns
   - **Untracked Transfer:** Asset location mismatches
   - **Low Stock:** Reorder alerts
4. Click **"View Analysis"** to open modal
5. Scroll to **"AI Risk Explanation"** section
6. Click **"Generate AI Explanation"** if not yet generated

---

## Configuration & Thresholds

### Current Settings (in AnomalyDetectionService)

```php
private const QUANTITY_ANOMALY_THRESHOLD = 2;           // Z-score > 2
private const REQUESTER_FREQUENCY_THRESHOLD = 2;       // Z-score > 2
```

### To Adjust Thresholds
1. Edit `backend/app/Services/AnomalyDetectionService.php`
2. Change the `QUANTITY_ANOMALY_THRESHOLD` or `REQUESTER_FREQUENCY_THRESHOLD` constant
3. Run migrations: `php artisan migrate`
4. Test with sample data

---

## Groq AI Integration

The system uses **Groq's `openai/gpt-oss-120b` model** for AI explanations.

### Configuration
- **API URL:** `https://api.groq.com/openai/v1`
- **Model:** `openai/gpt-oss-120b`
- **Timeout:** 20 seconds

### How it Works
1. Anomaly detected → Creates alert
2. User clicks "Generate AI Explanation"
3. Backend sends anomaly context to Groq API
4. Groq processes with instructions:
   - Don't invent statistics
   - Use only supplied evidence
   - Keep response 2-4 sentences
   - Include risk interpretation
5. Response stored in `ai_explanation` field
6. Frontend displays in modal

### Fallback Behavior
- If Groq API fails: Status set to "failed"
- User can retry generation
- Error message logged for debugging

---

## Example: Complete Anomaly Detection Flow

### Scenario: Ballpen Unusual Request

**Step 1: Detection**
```
Time: 2026-08-31 14:23:00
Action: Engineering Department requests 250 ballpens
Historical average: 110 ballpens
Z-score: 17.7 → ANOMALY DETECTED
```

**Step 2: Create Alert**
```
INSERT INTO anomaly_alerts:
- source_type: 'quantity_anomaly'
- source_id: 'department_5'
- risk_score: 6.0
- priority: 'medium'
- reason: 'Department 5 requested 250 units (z-score: 17.7, average: 110)'
- status: 'open'
- ai_explanation_status: 'pending'
```

**Step 3: Notify**
```
Send transfer_notification to:
- OIC (Role: OIC)
- System Administrator (Role: System Administrator)
Title: "AI Anomaly Alert"
Message: "Unusual supply usage detected for Ballpen in Engineering"
```

**Step 4: Request AI Explanation**
```
POST https://api.groq.com/openai/v1/chat/completions
{
  "model": "openai/gpt-oss-120b",
  "messages": [
    {
      "role": "system",
      "content": "You explain already-detected PCMS supplies stock anomalies..."
    },
    {
      "role": "user",
      "content": "Supply: Ballpen, Z-score: 17.7, Current: 250, Average: 110..."
    }
  ]
}
```

**Step 5: Display Explanation**
```
UI Modal - Inventory Monitoring:
- Supply: Ballpen
- Current: 250 units
- Historical Average: 110 units
- Z-Score: 17.7 (17.7 standard deviations from mean)
- AI Risk Explanation:
  "Ballpen demand in Engineering spiked significantly to 250 units, 
   well above the average of 110. This 127% increase may indicate 
   a special project or event. Recommend OIC verify if this is for 
   a known department activity or if there may be wastage concerns."
```

**Step 6: Resolution**
```
OIC reviews explanation
→ Confirms it's for new training program
→ Marks as "Resolved"
→ Status: closed
```

---

## Database Schema

### anomaly_alerts table
```sql
id                          BIGINT PRIMARY KEY
source_type                 VARCHAR(40)  -- quantity_anomaly, requester_frequency_anomaly, untracked_transfer, low_stock
source_id                   VARCHAR(255) -- department_id, requester_id, or asset_id
requester_id                UUID         -- Only for requester_frequency_anomaly
supply_id                   BIGINT       -- Only for frequency & quantity anomalies
department_id               BIGINT       -- For context
risk_score                  DECIMAL(5,2)
priority                    VARCHAR(30)  -- high, medium, low
reason                      TEXT
recommended_action          TEXT
status                      VARCHAR(40)  -- open, resolved, closed
found_department_id         BIGINT       -- For untracked_transfer only
analysis_context            JSON         -- Statistical context
ai_explanation              TEXT         -- Generated by Groq
ai_explanation_status       VARCHAR(30)  -- pending, generated, failed
ai_explanation_error        VARCHAR(500) -- Error message if failed
ai_explanation_generated_at TIMESTAMP
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

---

## Troubleshooting

### No AI Explanation Generated
1. Check Groq API key in `.env`: `OPENAI_API_KEY`
2. Verify API URL: `OPENAI_API_URL=https://api.groq.com/openai/v1`
3. Check backend logs: `storage/logs/laravel.log`
4. Try regenerating the explanation
5. Check if status = "failed" (see error message)

### Anomalies Not Detected
1. Verify migration ran: `php artisan migrate`
2. Check if supply has at least 3 previous movements
3. Review z-score threshold settings
4. Check stock_movements table for data

### Notifications Not Sent
1. Verify `transfer_notifications` table exists
2. Check if recipient users exist with correct roles
3. Review notification logs

---

## Performance Considerations

- **Quantity Anomaly Detection:** ~50ms per stock movement
- **Frequency Anomaly Detection:** ~100ms per purchase request
- **AI Explanation Generation:** 2-5 seconds (Groq API call)

For high-volume systems, consider:
- Running anomaly detection in background jobs
- Batching AI explanation requests
- Caching common explanations

---

Last Updated: 2026-08-31
System: PCMS v1.0 with Groq AI Integration

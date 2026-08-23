const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const STORAGE_PUBLIC_URL = import.meta.env.VITE_STORAGE_PUBLIC_URL || "";

export function assetQrCodeUrl(path) {
  if (!path || path === "0" || path === 0) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!STORAGE_PUBLIC_URL) return path;
  return `${STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${path}`;
}

export function releaseReceiptUrl(path) {
  return assetQrCodeUrl(path);
}

async function request(path, options = {}) {
  const currentUser = getStoredCurrentUser();
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (currentUser?.id) {
    headers.set("X-PCMS-User-ID", currentUser.id);
    headers.set("Authorization", `Bearer ${currentUser.id}`);
  }

  if (currentUser?.email) {
    headers.set("X-PCMS-User-Email", currentUser.email);
  }

  const response = await fetchWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
      credentials: "include",
    },
    20000,
  ).catch((error) => {
    throw normalizeFetchError(error);
  });

  const contentType = response.headers.get("Content-Type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : { message: await response.text().catch(() => "") };

  if (!response.ok) {
    const message = normalizeApiErrorMessage(payload, response.status);
    // Verbose logging for development: include status and full payload for 422 responses
    try {
      // eslint-disable-next-line no-console
      if (response.status === 422)
        console.error("[pcms] API 422 response", {
          path,
          status: response.status,
          payload,
        });
      else
        console.error("API request failed", {
          path,
          status: response.status,
          payload,
        });
    } catch (e) {
      // ignore logging errors
    }

    if (response.status === 422) {
      // Throw the full payload so callers can inspect detailed validation errors
      throw new Error(JSON.stringify({ status: response.status, payload }));
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const method = (options.method || "GET").toUpperCase();
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    typeof window !== "undefined"
  ) {
    window.dispatchEvent(
      new CustomEvent("pcms:dataChanged", { detail: { path, method } }),
    );
  }

  return payload;
}

function getStoredCurrentUser() {
  try {
    const rawUser = localStorage.getItem("pcms_current_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    localStorage.removeItem("pcms_current_user");
    return null;
  }
}

function normalizeApiErrorMessage(payload, status) {
  const rawMessage = payload?.message || payload?.error || "";

  // Map common auth/authorization statuses to clearer messages for the UI
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "You are not authorized to access this resource.";
  }

  if (
    typeof rawMessage === "string" &&
    rawMessage.trim().startsWith("<!DOCTYPE")
  ) {
    return `Server error (${status}). Check the Laravel log for details.`;
  }

  if (payload?.errors && typeof payload.errors === "object") {
    const firstError = Object.values(payload.errors).flat().find(Boolean);
    if (firstError) {
      return String(firstError);
    }
  }

  return rawMessage || `Request failed with status ${status}`;
}

function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `asset-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
}

function fetchWithTimeout(resource, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
  });
}

function normalizeFetchError(error) {
  if (error.name === "AbortError") {
    return new Error("Request timed out.");
  }

  return error;
}

function normalizeOcrFields(fields = {}) {
  return {
    property_number:
      fields.property_number ??
      fields.propertyNumber ??
      fields.property_no ??
      fields.propertyNo ??
      null,
    serial_number:
      fields.serial_number ?? fields.serialNumber ?? fields.serial ?? null,
    manufacturer: fields.manufacturer ?? null,
    brand: fields.brand ?? null,
    model: fields.model ?? null,
    description:
      fields.description ??
      fields.asset_description ??
      fields.assetDescription ??
      null,
    department: fields.department ?? null,
    location: fields.location ?? null,
    purchase_date:
      fields.purchase_date ??
      fields.date_acquired ??
      fields.dateAcquired ??
      null,
    purchase_cost:
      fields.purchase_cost ?? fields.unit_cost ?? fields.unitCost ?? null,
    quantity: fields.quantity ?? null,
    warranty_until: fields.warranty_until ?? null,
    condition: fields.condition ?? null,
    asset_name: fields.asset_name ?? fields.name ?? null,
  };
}

function normalizeOcrPayload(payload = {}) {
  const fields = payload.fields ?? payload.data ?? payload.details ?? {};
  const normalizedFields = normalizeOcrFields(fields);
  const hasParsedData = Object.values(normalizedFields).some((value) =>
    Boolean(value),
  );

  return {
    success: payload.success === false ? false : hasParsedData,
    scan_id: payload.scan_id ?? payload.id ?? null,
    processing_status:
      payload.processing_status ??
      (payload.success === false ? "needs_review" : "completed"),
    message:
      payload.message ||
      (hasParsedData
        ? "OCR completed."
        : "OCR did not extract any useful fields."),
    confidence:
      Number(payload.confidence_score ?? payload.confidence ?? 0) || 0,
    data: normalizedFields,
    details: payload.details ?? normalizedFields,
  };
}

export async function fetchBackendAssets({ limit = 200, search = "" } = {}) {
  const q = search ? `&search=${encodeURIComponent(search)}` : "";
  const response = await request(
    `/assets?per_page=${limit}&sort_by=created_at&sort_order=desc${q}`,
  );
  // Laravel's paginate() wraps results in { data: [...], current_page, ... }
  return response?.data || [];
}

export async function createBackendAsset(payload) {
  const record = {
    property_number: payload.property_number || undefined,
    serial_number: payload.serial_number || null,
    name: payload.name,
    unit: payload.unit || "pieces",
    brand: payload.brand || null,
    model: payload.model || null,
    description: payload.description || null,
    category_id: payload.category_id || null,
    department_id: payload.department_id || null,
    location: payload.location || null,
    condition: payload.condition || "good",
    status: payload.status || "available",
    purchase_date: payload.purchase_date || null,
    purchase_cost: payload.purchase_cost || null,
    quantity: payload.quantity ?? 1,
    supplier_id: payload.supplier_id || null,
    warranty_until: payload.warranty_until || null,
    remarks: payload.remarks || null,
    ocr_scan_id: payload.ocr_scan_id || null,
  };

  return request("/assets", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function fetchBackendAsset(id) {
  return request(`/assets/${id}`);
}

export async function updateBackendAsset(id, payload) {
  const record = {
    property_number: payload.property_number || undefined,
    serial_number: payload.serial_number || null,
    name: payload.name,
    brand: payload.brand || null,
    model: payload.model || null,
    description: payload.description || null,
    category_id: payload.category_id || null,
    department_id: payload.department_id || null,
    location: payload.location || null,
    condition: payload.condition || "good",
    status: payload.status || "available",
    purchase_date: payload.purchase_date || null,
    purchase_cost: payload.purchase_cost ?? null,
    quantity: payload.quantity ?? 1,
    supplier_id: payload.supplier_id || null,
    warranty_until: payload.warranty_until || null,
    remarks: payload.remarks || null,
  };

  const response = await request(`/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(record),
  });

  return response?.asset || response;
}

export async function deleteBackendAsset(id) {
  return request(`/assets/${id}`, { method: "DELETE" });
}

export async function fetchAssetHistory(id) {
  return request(`/assets/${id}/history`);
}

export async function fetchAssignments({
  limit = 200,
  search = "",
  status = "",
  assignment_type = "",
} = {}) {
  const params = new URLSearchParams({ per_page: String(limit) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (assignment_type) params.set("assignment_type", assignment_type);
  const response = await request(`/assignments?${params.toString()}`);
  return response?.data || [];
}

export async function fetchAssignmentRecommendations(payload = {}) {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  const response = await request(
    `/assignments/recommendations?${params.toString()}`,
  );
  return response?.data || [];
}

export async function fetchAssignment(id) {
  return request(`/assignments/${encodeURIComponent(id)}`);
}

export async function fetchAssignmentQrDetails(id) {
  return request(`/assignments/qr/${encodeURIComponent(id)}`);
}

export async function fetchEmployeeAssetProfile(userId) {
  return request(`/assignments/employee-profile/${encodeURIComponent(userId)}`);
}

export async function fetchAssignmentDashboard() {
  return request("/assignments/dashboard");
}

export async function fetchAssignmentUsers() {
  const response = await request("/assignment-users");
  return response?.data || [];
}

export async function createAssignment(payload) {
  const hasPhoto = payload.photo instanceof File;
  const body = hasPhoto ? new FormData() : JSON.stringify(payload);

  if (hasPhoto) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        body.append(key, value);
      }
    });
  }

  return request("/assignments", {
    method: "POST",
    body,
  });
}

export async function acceptAssignment(id, employeeSignature = "") {
  return request(`/assignments/${id}/accept`, {
    method: "PATCH",
    body: JSON.stringify({ employee_signature: employeeSignature }),
  });
}

export async function cancelAssignment(id, reason = "") {
  return request(`/assignments/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function returnAssignment(
  id,
  notes = null,
  conditionAfter = "good",
) {
  return request(`/assignments/${id}/return`, {
    method: "PATCH",
    body: JSON.stringify({ notes, condition_after: conditionAfter }),
  });
}

export async function checkClearance(userId) {
  return request(`/assignments/clearance-check/${userId}`);
}

export async function finalizeClearance(userId, decision, notes = "") {
  return request(`/assignments/clearance/${userId}/finalize`, {
    method: "POST",
    body: JSON.stringify({ decision, notes }),
  });
}

export async function fetchSupplies({
  limit = 200,
  search = "",
  department_id = "",
} = {}) {
  const q = search ? `&search=${encodeURIComponent(search)}` : "";
  const department = department_id
    ? `&department_id=${encodeURIComponent(department_id)}`
    : "";
  const response = await request(
    `/supplies?per_page=${limit}&sort_by=created_at&sort_order=desc${q}${department}`,
  );
  return response?.data || [];
}

export async function createSupply(payload) {
  const record = {
    sku: payload.sku,
    name: payload.name,
    unit: payload.unit || "pieces",
    category: payload.category || null,
    description: payload.description || null,
    stock: payload.quantity || payload.stock || 0,
    minimum_stock: payload.minimum_quantity || payload.minimum_stock || 0,
    unit_price: payload.unit_price ?? 0,
    expiration_date: payload.expiration_date || null,
    supplier_id: payload.supplier_id || null,
    department_id: payload.department_id || null,
  };

  return request("/supplies", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function updateSupply(id, payload) {
  return request(`/supplies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
export async function deleteSupply(id) {
  return request(`/supplies/${id}`, { method: "DELETE" });
}
export async function recordStockMovement(payload) {
  const record = {
    supply_id: payload.supply_id,
    movement_type: payload.movement_type, // 'in' or 'out'
    quantity: payload.quantity,
    department_id: payload.department_id || null,
    notes: payload.notes || null,
  };

  return request("/stock-movements", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function fetchStockMovements({
  limit = 200,
  department_id = "",
  movement_type = "",
} = {}) {
  const params = new URLSearchParams({ per_page: String(limit) });
  if (department_id) params.set("department_id", department_id);
  if (movement_type) params.set("movement_type", movement_type);
  const response = await request(`/stock-movements?${params.toString()}`);
  return response?.data || [];
}

export async function fetchTransfers({
  limit = 200,
  search = "",
  status = "",
  transfer_type = "",
} = {}) {
  const params = new URLSearchParams({ per_page: String(limit) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (transfer_type) params.set("transfer_type", transfer_type);
  const response = await request(`/transfers?${params.toString()}`);
  return response?.data || [];
}

export async function fetchTransferDashboard() {
  return request("/transfers/dashboard");
}

export async function fetchTransfer(id) {
  return request(`/transfers/${encodeURIComponent(id)}`);
}

export async function fetchTransferRecommendations(payload = {}) {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  const response = await request(
    `/transfers/recommendations?${params.toString()}`,
  );
  return response?.data || [];
}

export async function createTransfer(payload) {
  const record = {
    asset_id: payload.asset_id,
    to_department_id: payload.to_department_id,
    to_custodian_id: payload.to_custodian_id,
    quantity: Number(payload.quantity || 1),
    transfer_type: payload.transfer_type || "permanent",
    expected_return_date: payload.expected_return_date || null,
    reason: payload.reason || null,
  };

  return request("/transfers", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function approveTransfer(id) {
  return request(`/transfers/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function rejectTransfer(id, reason = "") {
  return request(`/transfers/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function holdTransfer(id, reason = "") {
  return request(`/transfers/${id}/hold`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function requestTransferRevision(id, reason = "") {
  return request(`/transfers/${id}/revision`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function executeTransfer(id, payload) {
  const hasFiles =
    payload.photo_before instanceof File || payload.photo_after instanceof File;
  const body = hasFiles ? new FormData() : JSON.stringify(payload);

  if (hasFiles) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        body.append(key, value);
    });
  }

  return request(`/transfers/${id}/execute`, {
    method: "POST",
    body,
  });
}

export function transferExportUrl() {
  return `${API_BASE_URL}/transfers/export`;
}

export async function resolveAnomaly(id) {
  return request(`/inventory-monitoring/anomalies/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function explainAnomaly(id) {
  return request(`/inventory-monitoring/anomalies/${id}/explain`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchMaintenanceRecords({ limit = 200 } = {}) {
  const response = await request(`/maintenance?per_page=${limit}`);
  return response?.data || [];
}

export async function fetchMaintenancePredictions({ daysAhead = 14 } = {}) {
  const response = await request(
    `/maintenance-predictions?days_ahead=${daysAhead}`,
  );
  return response?.data || [];
}

export async function createMaintenanceRecord(payload) {
  const record = {
    asset_id: payload.asset_id,
    type: payload.maintenance_type || payload.type,
    priority: payload.priority || "medium",
    technician: payload.technician_name || payload.technician || null,
    scheduled_at: payload.scheduled_date || payload.scheduled_at || null,
    cost: payload.cost || null,
    notes: payload.description || payload.notes || null,
  };

  return request("/maintenance", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function updateMaintenanceRecord(id, payload) {
  return request(`/maintenance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchDamageReports({ limit = 200 } = {}) {
  const response = await request(`/damage-reports?per_page=${limit}`);
  return response?.data || [];
}

export async function createDamageReport(payload) {
  if (payload instanceof FormData) {
    return request("/damage-reports", { method: "POST", body: payload });
  }

  const formData = new FormData();
  formData.append("asset_id", payload.asset_id || "");
  formData.append("ocr_scan_id", payload.ocr_scan_id || "");
  formData.append("incident_type", payload.incident_type || "damaged");
  formData.append("severity", payload.severity);
  formData.append("description", payload.description);
  if (payload.photo instanceof File) {
    formData.append("photo", payload.photo);
  }

  return request("/damage-reports", {
    method: "POST",
    body: formData,
  });
}

export async function updateDamageReport(id, payload) {
  return request(`/damage-reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchAudits({ limit = 200 } = {}) {
  const response = await request(`/audits?per_page=${limit}`);
  return response?.data || [];
}

export async function createAudit(payload) {
  const record = {
    area: payload.name || payload.area,
    department_id: payload.department_id || null,
    scheduled_at: payload.scheduled_date || payload.scheduled_at,
  };

  return request("/audits", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function scanAuditAsset(auditId, payload) {
  const record = {
    asset_id: payload.asset_id,
    found_department_id: payload.found_department_id,
  };

  return request(`/audits/${auditId}/scan`, {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function completeAudit(auditId) {
  return request(`/audits/${auditId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function fetchPurchaseRequests({ limit = 200, ...filters } = {}) {
  const params = new URLSearchParams({ per_page: String(limit) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const response = await request(`/purchase-requests?${params.toString()}`);
  return response?.data || [];
}

export async function recommendingApproverHistory() {
  const response = await request("/recommending-approver/history");
  return response?.data || [];
}

export async function fetchSupplyRequestQueue({
  limit = 200,
  ...filters
} = {}) {
  const params = new URLSearchParams({ per_page: String(limit) });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  });
  const response = await request(`/supply-requests/queue?${params.toString()}`);
  return response?.data || [];
}

export async function fetchPurchaseRequest(id) {
  const response = await request(`/purchase-requests/${id}`);
  return response?.data ?? response;
}

export async function releaseSupplyRequest(id, payload) {
  const response = await request(`/purchase-requests/${id}/supply-release`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response?.data ?? response;
}

export async function rejectPurchaseRequest(id, payload = {}) {
  return request(`/purchase-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function requestPurchaseRevision(id, reason) {
  return request(`/purchase-requests/${id}/revision`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function resubmitPurchaseRequest(id) {
  return request(`/purchase-requests/${id}/resubmit`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function updatePurchaseRequest(id, payload) {
  return request(`/purchase-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePurchaseRequest(id) {
  return request(`/purchase-requests/${id}`, { method: "DELETE" });
}

export async function createPurchaseRequest(payload) {
  const record = {
    department_id: payload.department_id || 1,
    total_amount: payload.estimated_cost || payload.total_amount || 0,
  };

  return request("/purchase-requests", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function advancePurchaseRequest(id) {
  return request(`/purchase-requests/${id}/advance`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function pendingApprovals() {
  const response = await request("/purchase-requests/pending/approvals");
  return response?.data || [];
}

export async function fetchOicReleaseQueue() {
  const [purchaseResponse, gatePassResponse] = await Promise.all([
    request("/purchase-requests?current_stage=property_custodian&per_page=200"),
    request("/gate-passes?deliverable=1&per_page=200"),
  ]);

  return {
    purchaseRequests: purchaseResponse?.data || [],
    gatePasses: gatePassResponse?.data || [],
  };
}

export async function oicRelease(type, id) {
  const path =
    type === "purchase"
      ? `/purchase-requests/${id}/release`
      : `/gate-passes/${id}/release`;

  return request(path, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function ppmoReleaseQueue() {
  const [purchaseResponse, requestResponse, gatePassResponse] =
    await Promise.all([
      request(
        "/purchase-requests?current_stage=property_custodian&per_page=200",
      ),
      request("/purchase-requests?current_stage=ppmo_staff&per_page=200"),
      request("/gate-passes?deliverable=1&per_page=200"),
    ]);

  return {
    purchaseRequests: [
      ...(purchaseResponse?.data || []),
      ...(requestResponse?.data || []),
    ],
    gatePasses: gatePassResponse?.data || [],
  };
}

export async function ppmoRelease(type, id) {
  return oicRelease(type, id);
}

export async function fetchReleasedRequests({ limit = 100 } = {}) {
  const response = await request(
    `/purchase-requests?status=released&per_page=${limit}`,
  );
  return response?.data || [];
}

export async function fetchReleaseReceipt(id) {
  const response = await request(`/purchase-requests/${id}/receipt`);
  return response?.data;
}

export function receiptDocumentUrl(id) {
  return `${API_BASE_URL}/purchase-requests/${id}/receipt/view`;
}

export async function fetchGatePasses({ limit = 200 } = {}) {
  const response = await request(`/gate-passes?per_page=${limit}`);
  return response?.data || [];
}

export async function createGatePass(payload) {
  const record = {
    asset_id: payload.asset_id,
    purpose: payload.purpose,
    valid_until: payload.valid_until,
  };

  return request("/gate-passes", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function approveGatePass(id) {
  return request(`/gate-passes/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function scanGatePass(id) {
  return request(`/gate-passes/${id}/scan`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function returnGatePass(id) {
  return request(`/gate-passes/${id}/return`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function requesterPurchaseRequests() {
  const response = await request(
    "/requester/purchase-requests?mine=1&per_page=200",
  );
  return response?.data || [];
}

export async function requesterGatePasses({ deliverable = false } = {}) {
  const suffix = deliverable ? "&deliverable=1" : "";
  const response = await request(
    `/requester/gate-passes?mine=1&per_page=200${suffix}`,
  );
  return response?.data || [];
}

export async function requesterTransfers() {
  const response = await request("/requester/transfers?mine=1&per_page=200");
  return response?.data || [];
}

export async function requesterDashboard() {
  return request("/requester/dashboard");
}

export async function requesterRecommendations(payload = {}) {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      );
  });
  const response = await request(
    `/requester/recommendations?${params.toString()}`,
  );
  return response?.data || [];
}

export async function requesterItemSearch(search, { limit = 12 } = {}) {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const response = await request(`/requester/item-search?${params.toString()}`);
  return response?.data || [];
}

export async function requesterCreatePurchaseRequest(payload) {
  // TEMP: log payload for debugging 422 validation issues
  try {
    // avoid logging potentially sensitive user tokens, only payload
    // eslint-disable-next-line no-console
    console.debug(
      "[pcms] requesterCreatePurchaseRequest payload:",
      JSON.parse(JSON.stringify(payload)),
    );
  } catch (e) {
    // ignore
  }

  return request("/requester/purchase-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Walk-in intake: System Administrator or PPMO Staff files a request on behalf
// of someone who came to the PPMO office in person (with or without an account).
// Skips Department Head review and enters directly at Recommending Approver.
export async function walkInRequesterOptions(search = "") {
  const params = new URLSearchParams({ search });
  const response = await request(
    `/purchase-requests/walk-in/requesters?${params.toString()}`,
  );
  return response?.data || [];
}

export async function walkInItemSearch(search = "", { limit = 12 } = {}) {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const response = await request(
    `/purchase-requests/walk-in/item-search?${params.toString()}`,
  );
  return response?.data || [];
}

export async function createWalkInPurchaseRequest(payload) {
  if (payload?.approval_document instanceof File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "line_items" && Array.isArray(value)) {
        value.forEach((line, index) => {
          Object.entries(line).forEach(([lineKey, lineValue]) => {
            if (lineValue !== undefined && lineValue !== null) {
              formData.append(`line_items[${index}][${lineKey}]`, lineValue);
            }
          });
        });
        return;
      }
      // FormData stringifies booleans as "true"/"false", which Laravel's
      // `boolean` rule rejects. Send 1/0 instead, which it accepts.
      if (typeof value === "boolean") {
        formData.append(key, value ? "1" : "0");
        return;
      }
      formData.append(key, value);
    });

    return request("/purchase-requests/walk-in", {
      method: "POST",
      body: formData,
    });
  }

  return request("/purchase-requests/walk-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyWalkInApproval(id, payload) {
  return request(`/purchase-requests/${id}/verify-walk-in-approval`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadWalkInApprovalDocument(id, file) {
  const formData = new FormData();
  formData.append("approval_document", file);

  return request(`/purchase-requests/${id}/walk-in-approval-document`, {
    method: "POST",
    body: formData,
  });
}

export async function updateWalkInDetails(id, payload) {
  return request(`/purchase-requests/${id}/walk-in-details`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createWalkInGatePass(payload) {
  return request("/gate-passes/walk-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requesterCreateGatePass(payload) {
  return request("/requester/gate-passes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requesterConfirmReceipt(id, payload = {}) {
  const hasPhoto = payload.photo instanceof File;
  const body = hasPhoto ? new FormData() : JSON.stringify(payload);

  if (hasPhoto) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        body.append(key, value);
    });
  }

  return request(`/requester/gate-passes/${id}/return`, {
    method: "PATCH",
    body,
  });
}

export function requesterExportUrl(type = "requests") {
  if (type === "assigned_assets") return assignmentExportUrl();
  if (type === "transfer_requests") return transferExportUrl();
  if (type === "gate_passes") return `${API_BASE_URL}/reports/gate-passes`;
  return `${API_BASE_URL}/reports/purchase-requests`;
}

export async function departmentHeadApprovalQueue() {
  const [purchaseResponse, gatePassResponse, transferResponse] =
    await Promise.all([
      request("/department-head/purchase-requests/pending?per_page=200"),
      request("/department-head/gate-passes/pending?per_page=200"),
      request("/department-head/transfers/pending?per_page=200"),
    ]);

  return {
    purchaseRequests: purchaseResponse?.data || [],
    gatePasses: gatePassResponse?.data || [],
    transfers: transferResponse?.data || [],
  };
}

export async function departmentHeadApprovalHistory() {
  const response = await request("/purchase-requests?per_page=200");
  return (response?.data || []).filter(
    (request) =>
      request.status === "rejected" ||
      request.current_stage !== "department_head",
  );
}

export async function departmentHeadDashboard() {
  const response = await request("/department-head/dashboard");
  return response || {};
}

export async function departmentHeadApprove(type, id) {
  const path =
    type === "purchase"
      ? `/department-head/purchase-requests/${id}/advance`
      : type === "gate_pass"
        ? `/department-head/gate-passes/${id}/approve`
        : `/department-head/transfers/${id}/approve`;

  return request(path, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function departmentHeadReject(type, id, reason = "") {
  const path =
    type === "purchase"
      ? `/department-head/purchase-requests/${id}/reject`
      : type === "gate_pass"
        ? `/department-head/gate-passes/${id}/reject`
        : `/department-head/transfers/${id}/reject`;

  return request(path, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAnomalies({ limit = 200 } = {}) {
  const response = await request(
    `/inventory-monitoring/anomalies?per_page=${limit}`,
  );
  return response?.data || [];
}

export async function fetchAnomalySummary() {
  return request("/inventory-monitoring/summary");
}

export async function analyzeAnomalies() {
  return request("/inventory-monitoring/analyze", { method: "POST" });
}

export async function generateReport(reportType) {
  return request(`/reports/${encodeURIComponent(reportType)}`);
}

export async function fetchSystemSettings() { return request("/system-settings"); }
export async function updateSystemSettings(payload) { return request("/system-settings", { method: "PATCH", body: JSON.stringify(payload) }); }

export async function fetchSupabaseDepartments() {
  const data = await request("/departments");
  return data || [];
}

export async function createSupabaseDepartment(payload) {
  const record = {
    code: payload.code,
    name: payload.name,
    location: payload.location || null,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
  };

  return request("/departments", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function fetchNotifications() {
  return request("/notifications");
}

export async function markAllNotificationsRead() {
  return request("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function markNotificationRead(source, id) {
  return request(`/notifications/${source}/${id}/read`, {
    method: "PATCH",
  });
}

export async function fetchOcrHistory({ limit = 20 } = {}) {
  const response = await request(`/ocr/history?per_page=${limit}`);
  return response?.data || [];
}

export function assignmentExportUrl() {
  return `${API_BASE_URL}/assignments/export`;
}

export async function fetchActivityLogs({ limit = 50 } = {}) {
  const response = await request(`/activity-logs?per_page=${limit}`);
  return response?.data || [];
}

export async function fetchUsers({ limit = 100, search = "" } = {}) {
  const q = search ? `&search=${encodeURIComponent(search)}` : "";
  const response = await request(`/users?per_page=${limit}${q}`);
  return response?.data || [];
}

export async function createUser(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUser(id) {
  return request(`/users/${id}`, { method: "DELETE" });
}

export const pcmsApi = {
  dashboard: () => request("/dashboard"),
  notifications: () => fetchNotifications(),
  activityLogs: (opts) => fetchActivityLogs(opts),
  assignmentDashboard: () => fetchAssignmentDashboard(),
  transferDashboard: () => fetchTransferDashboard(),
  assets: (opts) => fetchBackendAssets(opts),
  departments: () => fetchSupabaseDepartments(),
  createDepartment: (payload) => createSupabaseDepartment(payload),
  markAllNotificationsRead: () => markAllNotificationsRead(),
  markNotificationRead: (source, id) => markNotificationRead(source, id),
  asset: (id) => fetchBackendAsset(id),
  assetHistory: (id) => fetchAssetHistory(id),
  createAsset: (payload) => createBackendAsset(payload),
  updateAsset: (id, payload) => updateBackendAsset(id, payload),
  deleteAsset: (id) => deleteBackendAsset(id),
  assignments: (opts) => fetchAssignments(opts),
  assignment: (id) => fetchAssignment(id),
  fetchAssignment: (id) => fetchAssignment(id),
  assignmentRecommendations: (payload) =>
    fetchAssignmentRecommendations(payload),
  assignmentQrDetails: (id) => fetchAssignmentQrDetails(id),
  employeeAssetProfile: (userId) => fetchEmployeeAssetProfile(userId),
  assignmentUsers: () => fetchAssignmentUsers(),
  createAssignment: (payload) => createAssignment(payload),
  acceptAssignment: (id, employeeSignature) =>
    acceptAssignment(id, employeeSignature),
  cancelAssignment: (id, reason) => cancelAssignment(id, reason),
  returnAssignment: (id, notes, conditionAfter) =>
    returnAssignment(id, notes, conditionAfter),
  checkClearance: (userId) => checkClearance(userId),
  finalizeClearance: (userId, decision, notes) =>
    finalizeClearance(userId, decision, notes),
  assignmentExportUrl: () => assignmentExportUrl(),
  fetchSupplies: (opts) => fetchSupplies(opts),
  supplies: (opts) => fetchSupplies(opts),
  createSupply: (payload) => createSupply(payload),
  updateSupply: (id, payload) => updateSupply(id, payload),
  deleteSupply: (id) => deleteSupply(id),
  recordStockMovement: (payload) => recordStockMovement(payload),
  fetchStockMovements: (opts) => fetchStockMovements(opts),
  stockMovements: (opts) => fetchStockMovements(opts),
  fetchTransfers: (opts) => fetchTransfers(opts),
  transfers: (opts) => fetchTransfers(opts),
  transfer: (id) => fetchTransfer(id),
  transferRecommendations: (payload) => fetchTransferRecommendations(payload),
  createTransfer: (payload) => createTransfer(payload),
  approveTransfer: (id) => approveTransfer(id),
  rejectTransfer: (id, reason) => rejectTransfer(id, reason),
  holdTransfer: (id, reason) => holdTransfer(id, reason),
  requestTransferRevision: (id, reason) => requestTransferRevision(id, reason),
  executeTransfer: (id, payload) => executeTransfer(id, payload),
  transferExportUrl: () => transferExportUrl(),
  fetchMaintenanceRecords: (opts) => fetchMaintenanceRecords(opts),
  maintenanceRecords: (opts) => fetchMaintenanceRecords(opts),
  fetchMaintenancePredictions: (opts) => fetchMaintenancePredictions(opts),
  createMaintenanceRecord: (payload) => createMaintenanceRecord(payload),
  updateMaintenanceRecord: (id, payload) =>
    updateMaintenanceRecord(id, payload),
  fetchDamageReports: (opts) => fetchDamageReports(opts),
  damageReports: (opts) => fetchDamageReports(opts),
  createDamageReport: (payload) => createDamageReport(payload),
  updateDamageReport: (id, payload) => updateDamageReport(id, payload),
  fetchAudits: (opts) => fetchAudits(opts),
  audits: (opts) => fetchAudits(opts),
  createAudit: (payload) => createAudit(payload),
  scanAuditAsset: (auditId, payload) => scanAuditAsset(auditId, payload),
  completeAudit: (auditId) => completeAudit(auditId),
  fetchPurchaseRequests: (opts) => fetchPurchaseRequests(opts),
  fetchSupplyRequestQueue: (opts) => fetchSupplyRequestQueue(opts),
  purchaseRequests: (opts) => fetchPurchaseRequests(opts),
  fetchPurchaseRequest: (id) => fetchPurchaseRequest(id),
  releaseSupplyRequest: (id, payload) => releaseSupplyRequest(id, payload),
  createPurchaseRequest: (payload) => createPurchaseRequest(payload),
  advancePurchaseRequest: (id) => advancePurchaseRequest(id),
  rejectPurchaseRequest: (id, payload) => rejectPurchaseRequest(id, payload),
  requestPurchaseRevision: (id, reason) => requestPurchaseRevision(id, reason),
  resubmitPurchaseRequest: (id) => resubmitPurchaseRequest(id),
  updatePurchaseRequest: (id, payload) => updatePurchaseRequest(id, payload),
  deletePurchaseRequest: (id) => deletePurchaseRequest(id),
  pendingApprovals: () => pendingApprovals(),
  recommendingReviewQueue: () => pendingApprovals(),
  recommendingApproverDashboard: () =>
    request("/recommending-approver/dashboard"),
  recommendingApproverHistory: () => recommendingApproverHistory(),
  fetchOicReleaseQueue: () => fetchOicReleaseQueue(),
  oicReleaseQueue: () => fetchOicReleaseQueue(),
  oicRelease: (type, id) => oicRelease(type, id),
  ppmoReleaseQueue: () => ppmoReleaseQueue(),
  ppmoRelease: (type, id) => ppmoRelease(type, id),
  fetchReleasedRequests: (opts) => fetchReleasedRequests(opts),
  fetchReleaseReceipt: (id) => fetchReleaseReceipt(id),
  receiptDocumentUrl: (id) => receiptDocumentUrl(id),
  fetchGatePasses: (opts) => fetchGatePasses(opts),
  gatePasses: (opts) => fetchGatePasses(opts),
  createGatePass: (payload) => createGatePass(payload),
  approveGatePass: (id) => approveGatePass(id),
  returnGatePass: (id) => returnGatePass(id),
  requesterPurchaseRequests: () => requesterPurchaseRequests(),
  requesterDashboard: () => requesterDashboard(),
  requesterRecommendations: (payload) => requesterRecommendations(payload),
  requesterItemSearch: (search, opts) => requesterItemSearch(search, opts),
  requesterGatePasses: (opts) => requesterGatePasses(opts),
  requesterTransfers: () => requesterTransfers(),
  requesterCreatePurchaseRequest: (payload) =>
    requesterCreatePurchaseRequest(payload),
  createWalkInPurchaseRequest: (payload) =>
    createWalkInPurchaseRequest(payload),
  verifyWalkInApproval: (id, payload) => verifyWalkInApproval(id, payload),
  uploadWalkInApprovalDocument: (id, file) =>
    uploadWalkInApprovalDocument(id, file),
  updateWalkInDetails: (id, payload) => updateWalkInDetails(id, payload),
  createWalkInGatePass: (payload) => createWalkInGatePass(payload),
  walkInItemSearch: (search, opts) => walkInItemSearch(search, opts),
  walkInRequesterOptions: (search) => walkInRequesterOptions(search),
  requesterCreateGatePass: (payload) => requesterCreateGatePass(payload),
  requesterConfirmReceipt: (id, payload) =>
    requesterConfirmReceipt(id, payload),
  requesterExportUrl: (type) => requesterExportUrl(type),
  departmentHeadApprovalQueue: () => departmentHeadApprovalQueue(),
  departmentHeadApprovalHistory: () => departmentHeadApprovalHistory(),
  departmentHeadDashboard: () => departmentHeadDashboard(),
  departmentHeadApprove: (type, id) => departmentHeadApprove(type, id),
  departmentHeadReject: (type, id, reason) =>
    departmentHeadReject(type, id, reason),
  scanGatePass: (id) => scanGatePass(id),
  scanOcr: async (formData) => {
    const response = await request("/ocr/scan", {
      method: "POST",
      body: formData,
    });
    return normalizeOcrPayload(response);
  },
  ocrHistory: (opts) => fetchOcrHistory(opts),
  fetchAnomalies: (opts) => fetchAnomalies(opts),
  fetchAnomalySummary: () => fetchAnomalySummary(),
  anomalies: (opts) => fetchAnomalies(opts),
  resolveAnomaly: (id) => resolveAnomaly(id),
  explainAnomaly: (id) => explainAnomaly(id),
  analyzeAnomalies: () => analyzeAnomalies(),
  generateReport: (type) => generateReport(type),
  reports: (type) => generateReport(type),
  fetchUsers: (opts) => fetchUsers(opts),
  users: (opts) => fetchUsers(opts),
  createUser: (payload) => createUser(payload),
  updateUser: (id, payload) => updateUser(id, payload),
  deactivateUser: (id) => deactivateUser(id),
  systemSettings: () => fetchSystemSettings(),
  updateSystemSettings: (payload) => updateSystemSettings(payload),
};

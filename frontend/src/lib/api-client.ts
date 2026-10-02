import type { ClimateRiskReport, Verdict } from "@/types/risk";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/** Error carrying the HTTP status so callers can react to 401 (expired session). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiError(response: Response, fallback: string): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") detail = body.detail;
  } catch {
    // body was not JSON
  }
  if (response.status === 401) {
    return new ApiError("Your session has expired. Please sign in again.", 401);
  }
  return new ApiError(detail || fallback, response.status);
}

export interface SavedPropertyListItem {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  overall_risk_score: number | null;
  verdict: Verdict | null;
  updated_at: string;
}

async function authFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
}

/**
 * Ping the backend so an idle Cloud Run instance starts booting while the user
 * is still typing. Fire-and-forget: failures are ignored.
 */
export function warmUpBackend(): void {
  if (!API_BASE) return;
  fetch(`${API_BASE}/health`).catch(() => {});
}

export async function analyzeAddress(
  address: string,
  accessToken?: string,
): Promise<ClimateRiskReport> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers,
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw await apiError(response, "Risk analysis failed. Please try again.");
  }

  return (await response.json()) as ClimateRiskReport;
}

export async function saveProperty(
  report: ClimateRiskReport,
  accessToken: string,
): Promise<void> {
  const response = await authFetch("/properties", accessToken, {
    method: "POST",
    body: JSON.stringify({ report }),
  });

  if (!response.ok) {
    throw await apiError(response, "Failed to save property");
  }
}

export async function listProperties(accessToken: string): Promise<SavedPropertyListItem[]> {
  const response = await authFetch("/properties", accessToken);

  if (!response.ok) {
    throw await apiError(response, "Failed to load properties");
  }

  return (await response.json()) as SavedPropertyListItem[];
}

export async function deleteProperty(propertyId: number, accessToken: string): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}`, accessToken, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await apiError(response, "Failed to delete property");
  }
}

export async function generatePropertyPdf(
  propertyId: number,
  accessToken: string,
): Promise<string> {
  const response = await authFetch(`/properties/${propertyId}/pdf`, accessToken, {
    method: "POST",
  });

  if (!response.ok) {
    throw await apiError(response, "Failed to generate PDF");
  }

  const data = (await response.json()) as { pdf_url: string };
  return data.pdf_url;
}

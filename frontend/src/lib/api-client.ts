import type { ClimateRiskReport } from "@/types/risk";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface SavedPropertyListItem {
  id: number;
  address: string;
  latitude: number;
  longitude: number;
  overall_risk_score: number;
  verdict: string;
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
    let detail: string | undefined;
    try {
      const error = (await response.json()) as { detail?: string };
      detail = error.detail;
    } catch {
      // response body was not JSON; fall through to status-based error
    }
    throw new Error(detail || `API error: ${response.statusText}`);
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
    let detail: string | undefined;
    try {
      const error = (await response.json()) as { detail?: string };
      detail = error.detail;
    } catch {
      // ignore
    }
    throw new Error(detail || "Failed to save property");
  }
}

export async function listProperties(accessToken: string): Promise<SavedPropertyListItem[]> {
  const response = await authFetch("/properties", accessToken);

  if (!response.ok) {
    throw new Error("Failed to load properties");
  }

  return (await response.json()) as SavedPropertyListItem[];
}

export async function deleteProperty(propertyId: number, accessToken: string): Promise<void> {
  const response = await authFetch(`/properties/${propertyId}`, accessToken, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete property");
  }
}

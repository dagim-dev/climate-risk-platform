import type { ClimateRiskReport } from "@/types/risk";

export const REPORT_STORAGE_KEY = "climate-risk-report";

export function saveReport(report: ClimateRiskReport): void {
  sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
}

export function loadReportFromSession(): ClimateRiskReport | null {
  try {
    const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClimateRiskReport;
  } catch {
    return null;
  }
}

export function loadReportFromUrlParam(encoded: string): ClimateRiskReport | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as ClimateRiskReport;
  } catch {
    return null;
  }
}

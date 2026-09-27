import { useMemo, useSyncExternalStore } from "react";
import type { ClimateRiskReport } from "@/types/risk";

export const REPORT_STORAGE_KEY = "climate-risk-report";
const RESTORE_FLAG_KEY = "climate-risk-restore-dashboard";

export function saveReport(report: ClimateRiskReport): void {
  try {
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Storage full or blocked (private mode): the report page will show its empty state.
  }
}

function readStoredReport(): string | null {
  try {
    return sessionStorage.getItem(REPORT_STORAGE_KEY);
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

/**
 * The last analyzed report saved in this tab. Rendered as null on the server and during
 * hydration, then read from sessionStorage, so server and client markup always match.
 */
export function useStoredReport(): ClimateRiskReport | null {
  const raw = useSyncExternalStore(noSubscription, readStoredReport, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ClimateRiskReport;
    } catch {
      return null;
    }
  }, [raw]);
}

/** Ask the home page to reopen the stored report (set by "Back to Dashboard"). */
export function requestDashboardRestore(): void {
  try {
    sessionStorage.setItem(RESTORE_FLAG_KEY, "1");
  } catch {
    // ignore: the home page just opens empty
  }
}

export function isDashboardRestoreRequested(): boolean {
  try {
    return sessionStorage.getItem(RESTORE_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearDashboardRestore(): void {
  try {
    sessionStorage.removeItem(RESTORE_FLAG_KEY);
  } catch {
    // ignore
  }
}

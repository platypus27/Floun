import { registerBackgroundMessageHandler } from "./messageHandler";
import { repairReportDraftingStatusMetadata } from "../../components/reportgen/reportDraftingSettings";

const setStorageAccessLevel = chrome.storage?.local?.setAccessLevel;
if (setStorageAccessLevel) {
  try {
    setStorageAccessLevel.call(
      chrome.storage.local,
      { accessLevel: "TRUSTED_CONTEXTS" },
      () => { void chrome.runtime.lastError; }
    );
  } catch {
    // Floun has no content scripts, so registration remains safe on older Chrome versions.
  }
}
registerBackgroundMessageHandler();
void repairReportDraftingStatusMetadata().catch(() => {
  // A later service-worker start can retry metadata repair without blocking scans.
});

export { handleScanMessage } from "./messageHandler";
export { runWebsiteScan, isValidScanTarget } from "./orchestrator";
export { executePageScan } from "./pageScanAdapter";
export { buildScanMeta } from "./scanMeta";
export { fetchTransportScan } from "./transportScanAdapter";

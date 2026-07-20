import { registerBackgroundMessageHandler } from "./messageHandler";

registerBackgroundMessageHandler();

export { handleScanMessage } from "./messageHandler";
export { runWebsiteScan, isValidScanTarget } from "./orchestrator";
export { executePageScan } from "./pageScanAdapter";
export { buildScanMeta } from "./scanMeta";
export { fetchTransportScan } from "./transportScanAdapter";

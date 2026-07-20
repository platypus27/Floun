import { executePageScan } from "./pageScanAdapter";
import { buildScanMeta } from "./scanMeta";
import { fetchTransportScan } from "./transportScanAdapter";
import {
  INVALID_SCAN_TARGET_MESSAGE,
  isValidScanTarget,
} from "../scanProtocol";
import type {
  PageScanData,
  ScanAdapterResult,
  ScanPayload,
  ScanTarget,
} from "../scanTypes";
import type { TransportScanResult } from "./transportScanAdapter";

export interface ScanAdapters {
  page: (target: ScanTarget) => Promise<ScanAdapterResult<PageScanData>>;
  transport: (target: ScanTarget) => Promise<TransportScanResult>;
}

export const defaultScanAdapters: ScanAdapters = {
  page: (target) => executePageScan(target.tabId, target.pageOrigin),
  transport: fetchTransportScan,
};

export async function runWebsiteScan(
  target: ScanTarget,
  adapters: ScanAdapters = defaultScanAdapters
): Promise<ScanPayload> {
  if (!isValidScanTarget(target)) {
    throw new Error(INVALID_SCAN_TARGET_MESSAGE);
  }

  const [pageScan, transportScan] = await Promise.all([
    adapters.page(target),
    adapters.transport(target),
  ]);
  const tlsScan = transportScan.tls;
  const certificateScan = transportScan.certificate;
  const scanMeta = buildScanMeta(pageScan.meta, tlsScan.meta, certificateScan.meta);

  return {
    ...pageScan.data,
    TLS: tlsScan.data,
    certificates: certificateScan.data,
    scanMeta,
  };
}

export { isValidScanTarget };

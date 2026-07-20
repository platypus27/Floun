import { getErrorMessage } from "./errors";
import { completeMeta, partialMeta, unavailableMeta } from "./scanMeta";
import type {
  CertificateScanData,
  ScanAdapterResult,
  ScanTarget,
  TlsScanData,
} from "../scanTypes";

const TRANSPORT_SCAN = Object.freeze({
  maxAttempts: 15,
  pollDelayMs: 5000,
});

type FetchLike = typeof fetch;

interface TransportScanOptions {
  fetchImpl?: FetchLike;
  maxAttempts?: number;
  pollDelayMs?: number;
  delayFn?: (ms: number) => Promise<void>;
}

interface SslLabsResponse {
  status?: unknown;
  statusMessage?: unknown;
  endpoints?: unknown;
  certs?: unknown;
}

export interface TransportScanResult {
  tls: ScanAdapterResult<TlsScanData | null>;
  certificate: ScanAdapterResult<CertificateScanData | null>;
}

const delay = (ms: number): Promise<void> => (
  new Promise((resolve) => setTimeout(resolve, ms))
);

const asObject = (value: unknown): Record<string, unknown> => (
  value && typeof value === "object" ? value as Record<string, unknown> : {}
);

const normalizedString = (value: unknown): string | null => (
  typeof value === "string" && value.trim() ? value.trim() : null
);

const normalizedStrings = (
  values: unknown,
  selector: (value: Record<string, unknown>) => unknown
): string[] => (
  Array.isArray(values)
    ? values
      .map((value) => normalizedString(selector(asObject(value))))
      .filter((value): value is string => Boolean(value))
    : []
);

function normalizeTls(data: SslLabsResponse): TlsScanData {
  const endpoints = Array.isArray(data.endpoints) ? data.endpoints : [];

  return {
    provider: "ssl-labs",
    endpoints: endpoints.map((endpoint) => {
      const details = asObject(asObject(endpoint).details);
      const suites = Array.isArray(details.suites) ? details.suites : [];

      return {
        protocolVersions: normalizedStrings(details.protocols, (protocol) => protocol.version),
        cipherSuites: suites.flatMap((suite) => (
          normalizedStrings(asObject(suite).list, (cipher) => cipher.name)
        )),
      };
    }),
  };
}

function normalizeCertificate(data: SslLabsResponse): CertificateScanData | null {
  const leafCertificate = Array.isArray(data.certs) ? asObject(data.certs[0]) : {};
  const signatureAlgorithm = normalizedString(leafCertificate.sigAlg);

  return signatureAlgorithm
    ? { provider: "ssl-labs", signatureAlgorithm }
    : null;
}

const unavailableResult = (message: string): TransportScanResult => ({
  tls: { data: null, meta: unavailableMeta(message) },
  certificate: { data: null, meta: unavailableMeta(message) },
});

export async function fetchTransportScan(
  target: ScanTarget,
  {
    fetchImpl = fetch,
    maxAttempts = TRANSPORT_SCAN.maxAttempts,
    pollDelayMs = TRANSPORT_SCAN.pollDelayMs,
    delayFn = delay,
  }: TransportScanOptions = {}
): Promise<TransportScanResult> {
  const apiUrl = `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(target.hostname)}&fromCache=on&maxAge=24&all=done`;

  try {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await fetchImpl(apiUrl);

      if (!response.ok) {
        return unavailableResult(`SSL Labs returned HTTP ${response.status}.`);
      }

      const data = asObject(await response.json()) as SslLabsResponse;

      if (data.status === "READY") {
        const certificate = normalizeCertificate(data);

        return {
          tls: { data: normalizeTls(data), meta: completeMeta() },
          certificate: certificate
            ? { data: certificate, meta: completeMeta() }
            : {
              data: null,
              meta: unavailableMeta("SSL Labs returned no usable leaf-certificate signature algorithm."),
            },
        };
      }

      if (data.status === "ERROR") {
        return unavailableResult(
          normalizedString(data.statusMessage) || "SSL Labs reported an error."
        );
      }

      await delayFn(pollDelayMs);
    }

    const message = "SSL Labs did not finish the transport scan before the polling limit.";
    return {
      tls: { data: null, meta: partialMeta(message) },
      certificate: { data: null, meta: partialMeta(message) },
    };
  } catch (error) {
    return unavailableResult(getErrorMessage(error));
  }
}

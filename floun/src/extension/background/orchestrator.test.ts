import { buildScanMeta } from "./scanMeta";
import { runWebsiteScan } from "./orchestrator";
import type { ScanTarget } from "../scanTypes";
import { INVALID_SCAN_TARGET_MESSAGE } from "../scanProtocol";

const target: ScanTarget = {
  tabId: 7,
  protocol: "https:",
  hostname: "example.com",
  pageOrigin: "https://example.com",
  url: "https://example.com",
};

test("uses one transport assessment for both TLS and certificate results", async () => {
  const transport = vi.fn().mockResolvedValue({
    tls: {
      data: {
        provider: "ssl-labs",
        endpoints: [{ protocolVersions: ["1.3"], cipherSuites: ["TLS_AES_128_GCM_SHA256"] }],
      },
      meta: { status: "complete" },
    },
    certificate: {
      data: { provider: "ssl-labs", signatureAlgorithm: "SHA256withRSA" },
      meta: { status: "complete" },
    },
  });

  const payload = await runWebsiteScan(target, {
    page: vi.fn().mockResolvedValue({
      data: { tokens: [], headers: {}, jsScripts: [] },
      meta: { status: "complete" },
    }),
    transport,
  });

  expect(transport).toHaveBeenCalledTimes(1);
  expect(payload).toMatchObject({
    TLS: { provider: "ssl-labs" },
    certificates: { provider: "ssl-labs", signatureAlgorithm: "SHA256withRSA" },
    scanMeta: {
      tls: { status: "complete" },
      certificates: { status: "complete" },
      warnings: [],
    },
  });
});

test("combines adapter data and warnings into a scan payload", async () => {
  const payload = await runWebsiteScan(target, {
    page: vi.fn().mockResolvedValue({
      data: { tokens: ["token"], headers: {}, jsScripts: [] },
      meta: { status: "complete" },
    }),
    transport: vi.fn().mockResolvedValue({
      tls: {
        data: {
          provider: "ssl-labs",
          endpoints: [{ protocolVersions: ["1.3"], cipherSuites: ["TLS_KYBER768"] }],
        },
        meta: { status: "complete" },
      },
      certificate: {
        data: { provider: "ssl-labs", signatureAlgorithm: "sha256WithRSAEncryption" },
        meta: { status: "unavailable", message: "Certificate API unavailable" },
      },
    }),
  });

  expect(payload).toMatchObject({
    tokens: ["token"],
    TLS: {
      provider: "ssl-labs",
      endpoints: [{ protocolVersions: ["1.3"], cipherSuites: ["TLS_KYBER768"] }],
    },
    certificates: { provider: "ssl-labs", signatureAlgorithm: "sha256WithRSAEncryption" },
    scanMeta: {
      page: { status: "complete" },
      tls: { status: "complete" },
      certificates: { status: "unavailable", message: "Certificate API unavailable" },
      warnings: [
        "Certificate scan unavailable: Certificate API unavailable",
      ],
    },
  });
});

test("builds scan warnings for non-complete adapter statuses", () => {
  expect(buildScanMeta(
    { status: "complete" },
    { status: "partial", message: "TLS slow" },
    { status: "unavailable", message: "No certificate data" }
  ).warnings).toEqual([
    "TLS scan partial: TLS slow",
    "Certificate scan unavailable: No certificate data",
  ]);
});

test("rejects invalid scan targets before running adapters", async () => {
  await expect(runWebsiteScan({} as ScanTarget)).rejects.toThrow(INVALID_SCAN_TARGET_MESSAGE);
});

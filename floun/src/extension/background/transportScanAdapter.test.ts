import { fetchTransportScan } from "./transportScanAdapter";
import type { ScanTarget } from "../scanTypes";

const target: ScanTarget = {
  tabId: 7,
  protocol: "https:",
  hostname: "example.com",
  pageOrigin: "https://example.com",
  url: "https://example.com",
};

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

test("returns usable TLS and leaf-certificate evidence from one SSL Labs assessment", async () => {
  const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
    status: "READY",
    certs: [
      { id: "leaf", sigAlg: "SHA256withRSA" },
      { id: "intermediate", sigAlg: "SHA384withRSA" },
    ],
    endpoints: [{
      statusMessage: "Ready",
      details: {
        protocols: [{ name: "TLS", version: "1.3" }],
        suites: [{ list: [{ name: "TLS_AES_128_GCM_SHA256" }] }],
      },
    }],
  }));

  await expect(fetchTransportScan(target, {
    fetchImpl: fetchMock as unknown as typeof fetch,
  })).resolves.toMatchObject({
    tls: {
      data: {
        provider: "ssl-labs",
        endpoints: [{
          protocolVersions: ["1.3"],
          cipherSuites: ["TLS_AES_128_GCM_SHA256"],
        }],
      },
      meta: { status: "complete" },
    },
    certificate: {
      data: {
        provider: "ssl-labs",
        signatureAlgorithm: "SHA256withRSA",
      },
      meta: { status: "complete" },
    },
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.ssllabs.com/api/v3/analyze?host=example.com&fromCache=on&maxAge=24&all=done"
  );
});

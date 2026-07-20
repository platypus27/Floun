declare const process: { cwd: () => string };
declare function require(moduleName: string): any;

const { join } = require("path");
const { pathToFileURL } = require("url");

const chromeQaFlowCheckModuleUrl = pathToFileURL(
  join(process.cwd(), "scripts", "check-chrome-qa-flows.mjs")
).href;

async function loadChromeQaFlowCheckModule() {
  return await import(chromeQaFlowCheckModuleUrl);
}

const passingResults = [
  {
    id: "fixture",
    label: "Local fixture scan",
    passed: true,
    evidence: "20 findings and expected warning.",
  },
  {
    id: "https",
    label: "Known HTTPS scan",
    passed: true,
    evidence: "Scan completed.",
  },
  {
    id: "http",
    label: "HTTP certificate warning",
    passed: true,
    evidence: "Certificate warning visible.",
  },
  {
    id: "unsupported",
    label: "Unsupported page handling",
    passed: true,
    evidence: "Graceful error visible.",
  },
  {
    id: "pdf",
    label: "PDF redaction",
    passed: true,
    evidence: "No raw token values found.",
  },
  {
    id: "byok",
    label: "DeepSeek BYOK consent",
    passed: true,
    evidence: "Consent-gated redacted requests verified.",
  },
];

test("findRawTokenLeaks returns only token values present in PDF bytes", async () => {
  const { findRawTokenLeaks } = await loadChromeQaFlowCheckModule();
  const bytes = new TextEncoder().encode("redacted abc123 still-hidden");

  expect(findRawTokenLeaks(bytes, ["abc123", "missing-token"])).toEqual(["abc123"]);
});

test("assertRequiredScenarioResults accepts every required passing scenario", async () => {
  const { assertRequiredScenarioResults } = await loadChromeQaFlowCheckModule();

  expect(() => assertRequiredScenarioResults(passingResults)).not.toThrow();
});

test("assertRequiredScenarioResults rejects missing or failed scenarios", async () => {
  const { assertRequiredScenarioResults } = await loadChromeQaFlowCheckModule();

  expect(() => assertRequiredScenarioResults(passingResults.slice(1))).toThrow(/fixture/i);
  expect(() => assertRequiredScenarioResults(
    passingResults.filter(result => result.id !== "byok")
  )).toThrow(/byok/i);
  expect(() => assertRequiredScenarioResults([
    ...passingResults.map(result => result.id === "pdf" ? {
      ...result,
      passed: false,
      evidence: "Raw token value leaked.",
    } : result),
  ])).toThrow(/PDF redaction/);
});

test("known HTTPS QA requires usable certificate evidence", async () => {
  const { validateHttpsScan } = await loadChromeQaFlowCheckModule();
  const baseSnapshot = {
    generate: true,
    error: false,
    sections: ["TLS Results", "Certificates Results"],
    total: "8",
  };

  expect(validateHttpsScan({
    ...baseSnapshot,
    text: "Certificates Results No certificate signature algorithm found",
    warnings: ["Certificate scan unavailable: Certificate lookup returned HTTP 404."],
  }).passed).toBe(false);

  expect(validateHttpsScan({
    ...baseSnapshot,
    text: "Certificates Results Certificate uses SHA256withRSA",
    warnings: [],
  }).passed).toBe(true);
});

export {};

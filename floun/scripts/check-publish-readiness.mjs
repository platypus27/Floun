import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const repoRoot = dirname(projectRoot);
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));

export const requiredManualQaScenarios = [
  "Load `floun/build/` in Chrome extensions",
  "Scan `http://127.0.0.1:4174/crypto-readiness.html`",
  "Scan `https://www.cloudflare.com/`",
  "Scan `http://example.com/`",
  "Attempt unsupported page such as `chrome://extensions/`",
  "Generate PDF report",
  "Configure and clear DeepSeek BYOK with explicit consent",
  "Store package built without AI key",
];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

export function verifyPublishReadiness(evidencePath) {
  if (!existsSync(evidencePath)) {
    throw new Error(`Manual Chrome QA evidence is missing: ${evidencePath}`);
  }

  const content = readFileSync(evidencePath, "utf8");
  const manualQaSection = content.match(/## Manual Chrome QA(?<section>.*?)(?:\r?\n## |$)/s);

  if (!manualQaSection?.groups?.section) {
    throw new Error("Manual Chrome QA section is missing from QA evidence.");
  }

  const rows = [...manualQaSection.groups.section.matchAll(
    /^\| (?<scenario>[^|]+) \| (?<result>[^|]+) \| (?<evidence>[^|]+) \|$/gm
  )]
    .map((match) => ({
      scenario: match.groups.scenario.trim(),
      result: match.groups.result.trim(),
      evidence: match.groups.evidence.trim(),
    }))
    .filter((row) => row.scenario !== "Scenario" && row.scenario !== "---" && row.result !== "---");

  if (rows.length === 0) {
    throw new Error("Manual Chrome QA evidence table is missing or malformed.");
  }

  const scenarioCounts = new Map();
  for (const row of rows) {
    scenarioCounts.set(row.scenario, (scenarioCounts.get(row.scenario) || 0) + 1);
  }
  const duplicates = [...scenarioCounts]
    .filter(([, count]) => count > 1)
    .map(([scenario]) => scenario);

  if (duplicates.length) {
    throw new Error(`Manual Chrome QA has duplicate scenarios: ${duplicates.join("; ")}`);
  }

  const scenarios = new Set(rows.map((row) => row.scenario));
  const missing = requiredManualQaScenarios.filter((scenario) => !scenarios.has(scenario));

  if (missing.length) {
    throw new Error(`Manual Chrome QA is missing required Manual Chrome QA scenarios: ${missing.join("; ")}`);
  }

  const incomplete = rows.filter((row) => row.result !== "Pass");

  if (incomplete.length) {
    const details = incomplete.map((row) => `${row.scenario}=${row.result}`).join("; ");
    throw new Error(`Manual Chrome QA is not publish-ready. Complete or fix these rows first: ${details}`);
  }

  const placeholderEvidence = /\b(blocked|complete manually|requires loaded extension popup|automation cannot open|could not be completed|\bTBD\b)\b/i;
  const incompleteEvidence = rows.filter((row) => (
    !row.evidence || row.evidence === "-" || placeholderEvidence.test(row.evidence)
  ));

  if (incompleteEvidence.length) {
    throw new Error(
      `Manual Chrome QA has incomplete Manual Chrome QA evidence: ${incompleteEvidence.map((row) => row.scenario).join("; ")}`
    );
  }

  return rows;
}

function main() {
  const evidencePath = argumentValue("--qa-evidence") || join(
    repoRoot,
    "docs",
    "release",
    packageJson.version,
    "QA_EVIDENCE.md"
  );
  const rows = verifyPublishReadiness(evidencePath);

  console.log("Publish readiness verified.");
  console.log("Manual Chrome QA rows:");
  rows.forEach((row) => console.log(` - ${row.scenario}: ${row.result}`));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

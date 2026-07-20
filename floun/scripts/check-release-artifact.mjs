import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { strFromU8, unzipSync } from "fflate";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const repoRoot = dirname(projectRoot);
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
const version = packageJson.version;
const aliasVersion = version.split(".").slice(0, 2).join(".") || version;

const requiredEntries = [
  "manifest.json",
  "index.html",
  "background.js",
  "icons/icon_16.png",
  "icons/icon_48.png",
  "icons/icon_128.png",
];
const requiredPrefixes = ["assets/", "icons/"];
const forbiddenEntryPatterns = [
  /(^|\/)\.env($|[./])/, /(^|\/)fixtures?\//, /(^|\/)src\//,
  /(^|\/)node_modules\//, /(^|\/)docs\//, /(^|\/)scripts\//,
  /crypto-readiness\.html/, /\.map$/, /\.tsx?$/, /\.test\./,
  /package(?:-lock)?\.json$/, /tsconfig\.json$/, /vite\.config\./,
];
const forbiddenText = [
  "0123456789abcdef0123456789abcdef",
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL",
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmbG91biJ9.c2lnbmF0dXJl",
  "flounreleasecandidate20260605",
  "QABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890==",
  "secretRawToken",
  "secret-token-value",
  "VITE_DEEPSEEK_API_KEY=",
];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt"]);
const allowedEntryExtensions = new Set([".css", ".html", ".ico", ".js", ".json", ".png", ".txt"]);
const aiKeyPattern = /(?<![0-9A-Za-z_-])(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,})/;
const expectedPermissions = ["activeTab", "scripting", "storage"];
const expectedHostPermissions = ["https://api.ssllabs.com/*", "https://api.deepseek.com/*"];
const expectedExtensionPagesCsp = "script-src 'self'; object-src 'self';";
const expectedManifestTopLevelKeys = [
  "action", "background", "content_security_policy", "description", "host_permissions",
  "icons", "manifest_version", "name", "permissions", "version",
];
const expectedManifestBackgroundKeys = ["service_worker", "type"];
const expectedManifestActionKeys = ["default_icon", "default_popup"];
const expectedManifestCspKeys = ["extension_pages"];
const expectedManifestIconKeys = ["16", "48", "128"];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function assertStringSet(label, actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((value) => !actualSet.has(value));
  const unexpected = actual.filter((value) => !expectedSet.has(value));

  if (missing.length || unexpected.length || actual.length !== expected.length) {
    throw new Error(`${label} mismatch. Missing: ${missing.join(", ")}; unexpected: ${unexpected.join(", ")}`);
  }
}

function listZipEntryNames(bytes) {
  const names = [];

  for (let offset = 0; offset <= bytes.length - 46;) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50) {
      offset += 1;
      continue;
    }

    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    names.push(bytes.subarray(offset + 46, offset + 46 + nameLength).toString("utf8").replaceAll("\\", "/"));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return names;
}

function assertZipEntryNamesAreSafe(entries) {
  const seen = new Set();

  for (const entry of entries) {
    if (!entry || entry.startsWith("/") || /^[A-Za-z]:/.test(entry) || /(^|\/)(?:\.|\.\.)(\/|$)/.test(entry) || entry.includes("//")) {
      throw new Error(`Release artifact contains unsafe entry name: ${entry}`);
    }
    if (seen.has(entry)) {
      throw new Error(`Release artifact contains duplicate entry: ${entry}`);
    }
    seen.add(entry);
  }
}

function assertZipEntryFileTypesAreExpected(entries) {
  for (const entry of entries) {
    if (entry.endsWith("/")) continue;
    if (!allowedEntryExtensions.has(extname(entry).toLowerCase())) {
      throw new Error(`Release artifact contains unexpected file type: ${entry}`);
    }
  }
}

function zipReference(reference) {
  const path = reference.replace(/[?#].*$/, "").trim();
  if (/^(?:https?|data|chrome|mailto):/i.test(path)) {
    throw new Error(`Release artifact contains forbidden external or data reference: ${reference}`);
  }
  const normalized = path.replace(/^\/+/, "").replace(/^(?:\.\/)+/, "");
  if (normalized.startsWith("../")) {
    throw new Error(`Release artifact contains unsupported parent-relative reference: ${reference}`);
  }
  return normalized;
}

function assertReference(label, reference, entries) {
  const normalized = zipReference(reference);
  if (normalized && !entries.has(normalized)) {
    throw new Error(`${label} references missing release artifact entry: ${reference}`);
  }
}

function assertObjectKeys(label, object, expected, message) {
  if (!object || typeof object !== "object" || Array.isArray(object)) {
    throw new Error(`${label} must be an object.`);
  }
  assertStringSet(label, Object.keys(object), expected);
  for (const key of Object.keys(object)) {
    if (!expected.includes(key)) {
      throw new Error(`${message}: ${key}`);
    }
  }
}

function assertPackagedManifestKeysAreExpected(manifest) {
  assertObjectKeys("Packaged manifest", manifest, expectedManifestTopLevelKeys, "Packaged manifest contains unexpected top-level key");
  assertObjectKeys("Packaged manifest background", manifest.background, expectedManifestBackgroundKeys, "Packaged manifest background contains unexpected key");
  assertObjectKeys("Packaged manifest action", manifest.action, expectedManifestActionKeys, "Packaged manifest action contains unexpected key");
  assertObjectKeys("Packaged manifest content_security_policy", manifest.content_security_policy, expectedManifestCspKeys, "Packaged manifest content_security_policy contains unexpected key");
  assertObjectKeys("Packaged manifest icons", manifest.icons, expectedManifestIconKeys, "Packaged manifest icons contains unexpected key");
  assertObjectKeys("Packaged manifest action default_icon", manifest.action.default_icon, expectedManifestIconKeys, "Packaged manifest action default_icon contains unexpected key");
}

export function assertQaEvidenceMatchesArtifact(evidencePath, canonical, alias) {
  if (!existsSync(evidencePath)) {
    throw new Error(`QA evidence document is missing: ${evidencePath}`);
  }
  const content = readFileSync(evidencePath, "utf8");
  const requirements = [
    ["canonical package path", `- Package path: \`floun/release/floun-${version}.zip\``],
    ["alias package path", `- Alias package path: \`floun/release/floun-${aliasVersion}.zip\``],
    ["canonical SHA-256", `- SHA-256: \`${canonical.hash}\``],
    ["alias SHA-256", `- Alias SHA-256: \`${alias.hash}\``],
    ["artifact size", `- Size bytes: \`${canonical.size}\``],
    ["deterministic packaging SHA-256", `produced matching SHA-256: \`${canonical.hash}\``],
  ];
  for (const [label, expected] of requirements) {
    if (!content.includes(expected)) {
      throw new Error(`QA evidence mismatch: missing ${label} (${expected})`);
    }
  }

  const entrySection = content.match(/Required archive entries:\s*(?<entries>(?:\r?\n- `[^`]+`)+)/s);
  if (!entrySection?.groups?.entries) {
    throw new Error("QA evidence mismatch: required archive entries section is missing or malformed.");
  }
  const evidenceEntries = [...entrySection.groups.entries.matchAll(/- `(?<entry>[^`]+)`/g)]
    .map((match) => match.groups.entry);
  assertStringSet("QA evidence archive entries", evidenceEntries, canonical.entries);
}

export function containsAiApiKey(content) {
  return aiKeyPattern.test(content);
}

export function validateReleaseArtifact({ zipPath, expectedVersion = version }) {
  if (!existsSync(zipPath)) {
    throw new Error(`Release artifact is missing: ${zipPath}`);
  }
  const bytes = readFileSync(zipPath);
  const listedEntries = listZipEntryNames(bytes);
  assertZipEntryNamesAreSafe(listedEntries);
  assertZipEntryFileTypesAreExpected(listedEntries);
  const archive = unzipSync(new Uint8Array(bytes));
  const entries = new Set(Object.keys(archive)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => !entry.endsWith("/")));

  requiredEntries.forEach((entry) => {
    if (!entries.has(entry)) throw new Error(`Release artifact is missing required entry: ${entry}`);
  });
  requiredPrefixes.forEach((prefix) => {
    if (![...entries].some((entry) => entry.startsWith(prefix))) {
      throw new Error(`Release artifact is missing required directory: ${prefix}`);
    }
  });
  for (const entry of entries) {
    if (forbiddenEntryPatterns.some((pattern) => pattern.test(entry))) {
      throw new Error(`Release artifact contains forbidden entry: ${entry}`);
    }
  }

  const manifest = JSON.parse(strFromU8(archive["manifest.json"]));
  assertPackagedManifestKeysAreExpected(manifest);
  if (manifest.manifest_version !== 3) throw new Error("Packaged manifest must use manifest_version 3.");
  if (manifest.version !== expectedVersion) {
    throw new Error(`Packaged manifest version ${manifest.version} does not match package version ${expectedVersion}.`);
  }
  assertStringSet("Packaged manifest permissions", manifest.permissions, expectedPermissions);
  assertStringSet("Packaged manifest host_permissions", manifest.host_permissions, expectedHostPermissions);
  if (manifest.content_scripts !== undefined) throw new Error("Packaged manifest must not include always-on content_scripts.");
  if (manifest.background.service_worker !== "background.js") throw new Error("Packaged manifest background service worker must be background.js.");
  if (manifest.background.type !== "module") throw new Error("Packaged manifest background worker must be a module.");
  if (manifest.content_security_policy.extension_pages !== expectedExtensionPagesCsp) {
    throw new Error(`Packaged manifest extension_pages CSP must be ${expectedExtensionPagesCsp}.`);
  }

  assertReference("Packaged manifest default_popup", manifest.action.default_popup, entries);
  assertReference("Packaged manifest background service_worker", manifest.background.service_worker, entries);
  Object.values(manifest.icons).forEach((reference) => assertReference("Packaged manifest icons", reference, entries));
  Object.values(manifest.action.default_icon).forEach((reference) => assertReference("Packaged manifest action default_icon", reference, entries));

  const indexHtml = strFromU8(archive["index.html"]);
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/is.test(indexHtml)) throw new Error("Packaged index.html must not contain inline scripts.");
  if (/\s+on[a-z]+\s*=/i.test(indexHtml)) throw new Error("Packaged index.html must not contain inline event handlers.");
  [...indexHtml.matchAll(/(?:src|href)=["'](?<path>[^"']+)["']/g)]
    .forEach((match) => assertReference("Packaged index.html", match.groups.path, entries));

  const backgroundJs = strFromU8(archive["background.js"]);
  [...backgroundJs.matchAll(/["'](?<path>\.\/assets\/[^"']+)["']/g)]
    .forEach((match) => assertReference("Packaged background.js", match.groups.path, entries));

  for (const [entry, data] of Object.entries(archive)) {
    const extension = extname(entry).toLowerCase();
    if (!textExtensions.has(extension)) continue;
    const content = strFromU8(data);
    if (forbiddenText.some((value) => content.includes(value))) {
      throw new Error(`Release artifact contains forbidden fixture or secret marker in ${entry}`);
    }
    if (/(?:(?:\/\/)[#@]\s*sourceMappingURL\s*=|\/\*[#@]\s*sourceMappingURL\s*=)/im.test(content)) {
      throw new Error(`Release artifact contains forbidden source map reference in ${entry}`);
    }
    if (extension === ".css" && /(?:@import\s+(?:url\()?\s*["']?\s*(?:(?:https?|data|chrome|mailto):|\/\/)|url\(\s*["']?\s*(?:(?:https?|data|chrome|mailto):|\/\/))/i.test(content)) {
      throw new Error(`Release artifact contains forbidden external CSS reference in ${entry}`);
    }
    if (containsAiApiKey(content)) {
      throw new Error(`Release artifact contains an AI API-key-like value in ${entry}`);
    }
  }

  return {
    path: zipPath,
    hash: createHash("sha256").update(bytes).digest("hex"),
    size: statSync(zipPath).size,
    entries: [...entries].sort(),
  };
}

function main() {
  const canonicalPath = join(projectRoot, "release", `floun-${version}.zip`);
  const aliasPath = join(projectRoot, "release", `floun-${aliasVersion}.zip`);
  const evidencePath = argumentValue("--qa-evidence") || join(repoRoot, "docs", "release", version, "QA_EVIDENCE.md");
  const canonical = validateReleaseArtifact({ zipPath: canonicalPath });
  const alias = aliasPath === canonicalPath ? canonical : validateReleaseArtifact({ zipPath: aliasPath });

  if (alias.hash !== canonical.hash) throw new Error(`Release alias hash does not match canonical artifact: ${alias.path}`);
  assertQaEvidenceMatchesArtifact(evidencePath, canonical, alias);

  console.log(`Release artifact verified: ${resolve(canonical.path)}`);
  console.log(`Alias artifact verified: ${resolve(alias.path)}`);
  console.log(`Size bytes: ${canonical.size}`);
  console.log(`SHA-256: ${canonical.hash}`);
  console.log("Archive entries:");
  canonical.entries.forEach((entry) => console.log(` - ${entry}`));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

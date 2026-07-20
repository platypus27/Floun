declare const process: { cwd: () => string };
declare function require(moduleName: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");
const { pathToFileURL } = require("url");

const projectRoot = process.cwd();
const repoRoot = join(projectRoot, "..");
const artifactScript = join(
  projectRoot,
  "scripts",
  "check-release-artifact.mjs",
);
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const qaEvidencePath = join(
  repoRoot,
  "docs",
  "release",
  packageJson.version,
  "QA_EVIDENCE.md",
);

test("release artifact check rejects stale QA evidence", async () => {
  const artifactChecks = await import(pathToFileURL(artifactScript).href);
  const artifact = {
    hash: "current-hash",
    size: 123,
    entries: ["manifest.json"],
  };

  expect(() =>
    artifactChecks.assertQaEvidenceMatchesArtifact(
      qaEvidencePath,
      artifact,
      artifact,
    ),
  ).toThrow(/QA evidence/i);
});

test("AI key detection ignores CSS mask identifiers but rejects standalone keys", async () => {
  const artifactChecks = await import(pathToFileURL(artifactScript).href);

  expect(
    artifactChecks.containsAiApiKey("mask-image-linear-gradient-mask-image"),
  ).toBe(false);
  expect(
    artifactChecks.containsAiApiKey(`const key = 'sk-${"a".repeat(24)}'`),
  ).toBe(true);
});

test("release artifact check enforces packaged manifest CSP", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "const expectedExtensionPagesCsp = \"script-src 'self'; object-src 'self';\"",
  );
  expect(script).toContain("manifest.content_security_policy.extension_pages");
  expect(script).toContain("Packaged manifest extension_pages CSP");
});

test("release artifact check requires open-source license and notice entries", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain('"LICENSE.txt"');
  expect(script).toContain('"NOTICE.txt"');
  expect(script).toContain('"THIRD_PARTY_NOTICES.txt"');
  expect(script).toContain(
    "Release artifact must include the Apache-2.0 license text.",
  );
  expect(script).toContain(
    "Release artifact must include the Floun attribution notice.",
  );
});

test("release artifact check rejects remote or data packaged references", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Release artifact contains forbidden external or data reference",
  );
  expect(script).not.toContain("return $null");
});

test("release artifact check rejects inline HTML execution", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Packaged index.html must not contain inline scripts.",
  );
  expect(script).toContain(
    "Packaged index.html must not contain inline event handlers.",
  );
});

test("release artifact check rejects source map references", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Release artifact contains forbidden source map reference",
  );
  expect(script).toContain("sourceMappingURL");
});

test("release artifact check rejects external CSS references", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Release artifact contains forbidden external CSS reference",
  );
  expect(script).toContain("@import");
  expect(script).toContain("url\\(");
});

test("release artifact check rejects duplicate or unsafe zip entries", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain("Release artifact contains duplicate entry");
  expect(script).toContain("Release artifact contains unsafe entry name");
  expect(script).toContain("assertZipEntryNamesAreSafe");
});

test("release artifact check enforces packaged manifest key allowlist", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Packaged manifest contains unexpected top-level key",
  );
  expect(script).toContain("assertPackagedManifestKeysAreExpected");
  expect(script).toContain("expectedManifestTopLevelKeys");
});

test("release artifact check enforces nested manifest key allowlists", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain(
    "Packaged manifest background contains unexpected key",
  );
  expect(script).toContain("Packaged manifest action contains unexpected key");
  expect(script).toContain(
    "Packaged manifest content_security_policy contains unexpected key",
  );
  expect(script).toContain("Packaged manifest icons contains unexpected key");
  expect(script).toContain("expectedManifestBackgroundKeys");
});

test("release artifact check enforces packaged file extension allowlist", () => {
  const script = readFileSync(artifactScript, "utf8");

  expect(script).toContain("Release artifact contains unexpected file type");
  expect(script).toContain("allowedEntryExtensions");
  expect(script).toContain("assertZipEntryFileTypesAreExpected");
});

export {};

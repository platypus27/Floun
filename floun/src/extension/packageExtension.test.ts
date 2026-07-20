declare const process: { cwd: () => string };
declare function require(moduleName: string): any;

const { createHash } = require("crypto");
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { pathToFileURL } = require("url");

const packageModuleUrl = pathToFileURL(
  join(process.cwd(), "scripts", "package-extension.mjs")
).href;

test("packaging the same extension twice produces byte-identical versioned artifacts", async () => {
  const { packageExtension } = await import(packageModuleUrl);
  const tempDir = mkdtempSync(join(tmpdir(), "floun-package-"));
  const buildDir = join(tempDir, "build");
  const releaseDir = join(tempDir, "release");

  try {
    mkdirSync(join(buildDir, "assets"), { recursive: true });
    writeFileSync(join(buildDir, "manifest.json"), '{"version":"2.1.0"}');
    writeFileSync(join(buildDir, "index.html"), "<main>Floun</main>");
    writeFileSync(join(buildDir, "background.js"), "export {};");
    writeFileSync(join(buildDir, "assets", "app.js"), "console.info('floun');");

    const first = packageExtension({ buildDir, releaseDir, version: "2.1.0" });
    const firstHash = createHash("sha256").update(readFileSync(first.canonicalPath)).digest("hex");
    const second = packageExtension({ buildDir, releaseDir, version: "2.1.0" });
    const secondHash = createHash("sha256").update(readFileSync(second.canonicalPath)).digest("hex");

    expect(secondHash).toBe(firstHash);
    expect(readFileSync(second.aliasPath)).toEqual(readFileSync(second.canonicalPath));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

export {};

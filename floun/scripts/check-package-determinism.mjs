import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { packageExtension } from "./package-extension.mjs";
import { validateReleaseArtifact } from "./check-release-artifact.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));

export function verifyPackageDeterminism() {
  const options = {
    buildDir: join(projectRoot, "build"),
    releaseDir: join(projectRoot, "release"),
    version: packageJson.version,
  };
  const firstPaths = packageExtension(options);
  const first = validateReleaseArtifact({
    zipPath: firstPaths.canonicalPath,
    expectedVersion: packageJson.version,
  });
  const secondPaths = packageExtension(options);
  const second = validateReleaseArtifact({
    zipPath: secondPaths.canonicalPath,
    expectedVersion: packageJson.version,
  });

  if (first.hash !== second.hash) {
    throw new Error(`Release package is not deterministic. First SHA-256: ${first.hash}; second SHA-256: ${second.hash}`);
  }

  return second;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const artifact = verifyPackageDeterminism();
    console.log("Release package determinism verified.");
    console.log(`SHA-256: ${artifact.hash}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

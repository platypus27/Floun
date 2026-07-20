import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const licenseFilePattern = /^(?:licen[cs]e|copying)(?:\..+)?$/i;
const licenseOverrides = {
  "react-remove-scroll-bar@2.3.8": `MIT License

Copyright (c) 2017 Anton Korzunov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
};

function productionPackages(lockfile) {
  return Object.entries(lockfile.packages)
    .filter(
      ([packagePath, metadata]) =>
        packagePath.includes("node_modules/") && metadata.dev !== true,
    )
    .map(([packagePath]) => packagePath)
    .sort((left, right) => left.localeCompare(right));
}

function readLicense(packageDir, packageId) {
  const licenseFile = readdirSync(packageDir)
    .filter((entry) => licenseFilePattern.test(entry))
    .sort((left, right) => left.localeCompare(right))[0];

  if (!licenseFile) {
    const override = licenseOverrides[packageId];
    if (!override) {
      throw new Error(
        `Production dependency is missing a license file: ${packageId}`,
      );
    }
    return override;
  }

  return readFileSync(join(packageDir, licenseFile), "utf8").trim();
}

export function generateThirdPartyNotices({ projectRoot }) {
  const lockfilePath = join(projectRoot, "package-lock.json");
  if (!existsSync(lockfilePath)) {
    throw new Error(`Package lockfile is missing: ${lockfilePath}`);
  }

  const lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
  const notices = productionPackages(lockfile).map((packagePath) => {
    const packageDir = join(projectRoot, packagePath);
    const manifestPath = join(packageDir, "package.json");
    if (!existsSync(manifestPath)) {
      throw new Error(
        `Installed production dependency is missing: ${packagePath}`,
      );
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const packageId = `${manifest.name}@${manifest.version}`;
    const declaredLicense =
      typeof manifest.license === "string"
        ? manifest.license
        : "See included license text";

    return [
      "=".repeat(80),
      packageId,
      `Declared license: ${declaredLicense}`,
      "-".repeat(80),
      readLicense(packageDir, packageId),
    ].join("\n");
  });

  return [
    "THIRD-PARTY SOFTWARE NOTICES",
    "GENERATED FILE - DO NOT EDIT",
    "",
    "Floun includes the production dependencies listed below. Each dependency",
    "remains subject to its own license terms and copyright notices.",
    "",
    ...notices,
    "",
  ].join("\n");
}

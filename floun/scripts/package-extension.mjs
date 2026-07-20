import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { generateThirdPartyNotices } from "./generate-third-party-notices.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const repoRoot = dirname(projectRoot);
const fixedTimestamp = new Date("2026-01-01T00:00:00.000Z");
const defaultLegalFiles = [
  { sourcePath: join(repoRoot, "LICENSE"), entryName: "LICENSE.txt" },
  { sourcePath: join(repoRoot, "NOTICE"), entryName: "NOTICE.txt" },
];

function collectFiles(root, directory = root) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(root, path) : [path];
    })
    .sort((left, right) =>
      relative(root, left).localeCompare(relative(root, right)),
    );
}

export function packageExtension({
  buildDir,
  releaseDir,
  version,
  legalFiles = defaultLegalFiles,
  generatedEntries = {
    "THIRD_PARTY_NOTICES.txt": generateThirdPartyNotices({ projectRoot }),
  },
}) {
  for (const required of ["manifest.json", "index.html", "background.js"]) {
    const requiredPath = join(buildDir, required);
    if (!existsSync(requiredPath) || !statSync(requiredPath).isFile()) {
      throw new Error(`Required build artifact is missing: ${requiredPath}`);
    }
  }

  const aliasVersion = version.split(".").slice(0, 2).join(".") || version;
  const canonicalPath = join(releaseDir, `floun-${version}.zip`);
  const aliasPath = join(releaseDir, `floun-${aliasVersion}.zip`);
  const entries = Object.fromEntries(
    collectFiles(buildDir).map((path) => [
      relative(buildDir, path).split(sep).join("/"),
      [new Uint8Array(readFileSync(path)), { mtime: fixedTimestamp }],
    ]),
  );
  for (const { sourcePath, entryName } of legalFiles) {
    if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
      throw new Error(`Required legal file is missing: ${sourcePath}`);
    }
    if (entries[entryName]) {
      throw new Error(
        `Legal archive entry conflicts with build output: ${entryName}`,
      );
    }
    entries[entryName] = [
      new Uint8Array(readFileSync(sourcePath)),
      { mtime: fixedTimestamp },
    ];
  }
  for (const [entryName, content] of Object.entries(generatedEntries)) {
    if (entries[entryName]) {
      throw new Error(
        `Generated archive entry conflicts with build output: ${entryName}`,
      );
    }
    entries[entryName] = [
      new TextEncoder().encode(content),
      { mtime: fixedTimestamp },
    ];
  }
  const archive = zipSync(entries, { level: 9, mtime: fixedTimestamp });

  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(canonicalPath, archive);
  if (aliasPath !== canonicalPath) {
    copyFileSync(canonicalPath, aliasPath);
  }

  return { canonicalPath, aliasPath };
}

function main() {
  const packageJson = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf8"),
  );
  const result = packageExtension({
    buildDir: join(projectRoot, "build"),
    releaseDir: join(projectRoot, "release"),
    version: packageJson.version,
  });

  console.log(`Packaged Floun extension: ${resolve(result.canonicalPath)}`);
  if (result.aliasPath !== result.canonicalPath) {
    console.log(`Packaged Floun extension alias: ${resolve(result.aliasPath)}`);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

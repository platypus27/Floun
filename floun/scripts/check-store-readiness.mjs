import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDir);
const repoRoot = dirname(projectRoot);
const packageJson = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8"));
const storeDocsRoot = join(repoRoot, "docs", "store");
const storeAssetsRoot = join(storeDocsRoot, "assets");

const requiredDocs = [
  join(repoRoot, "docs", "release", packageJson.version, "QA_EVIDENCE.md"),
  join(storeDocsRoot, "CHROME_WEB_STORE_LISTING.md"),
  join(storeDocsRoot, "CHROME_WEB_STORE_PRIVACY.md"),
  join(storeDocsRoot, "PRIVACY_POLICY.md"),
];

const assets = [
  { label: "extension icon", path: join(projectRoot, "public", "icons", "icon_128.png"), width: 128, height: 128 },
  { label: "store screenshot", path: join(storeAssetsRoot, "floun-store-screenshot-1280x800.png"), width: 1280, height: 800, opaque: true },
  { label: "small promotional image", path: join(storeAssetsRoot, "floun-small-promo-440x280.png"), width: 440, height: 280, opaque: true },
];

function readPngDimensions(path) {
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`Store asset must be a valid PNG: ${path}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes.readUInt8(25),
  };
}

export function verifyStoreReadiness() {
  for (const path of requiredDocs) {
    if (!existsSync(path)) throw new Error(`Store readiness document is missing: ${path}`);
    if (statSync(path).size <= 0) throw new Error(`Store readiness document is empty: ${path}`);
  }

  for (const asset of assets) {
    if (!existsSync(asset.path)) throw new Error(`Required ${asset.label} asset is missing: ${asset.path}`);
    const dimensions = readPngDimensions(asset.path);
    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      throw new Error(`${asset.label} must be ${asset.width}x${asset.height}, found ${dimensions.width}x${dimensions.height}: ${asset.path}`);
    }
    if (asset.opaque && dimensions.colorType !== 2) {
      throw new Error(`${asset.label} must not contain an alpha channel: ${asset.path}`);
    }
  }

  return { requiredDocs, assets };
}

function main() {
  const result = verifyStoreReadiness();
  console.log("Chrome Web Store readiness verified.");
  console.log("Documents:");
  result.requiredDocs.forEach((path) => console.log(` - ${resolve(path)}`));
  console.log("Assets:");
  result.assets.forEach((asset) => console.log(` - ${asset.label}: ${resolve(asset.path)} (${asset.width}x${asset.height})`));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

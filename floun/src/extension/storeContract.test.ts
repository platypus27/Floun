declare const process: { cwd: () => string };
declare function require(moduleName: string): any;

const { readFileSync } = require("fs");
const { join } = require("path");

const projectRoot = process.cwd();
const repoRoot = join(projectRoot, "..");
const readRepoFile = (path: string) => readFileSync(join(repoRoot, path), "utf8");

test("the v2.1 store contract matches shipped BYOK behavior and permissions", () => {
  const listing = readRepoFile("docs/store/CHROME_WEB_STORE_LISTING.md");
  const privacyFields = readRepoFile("docs/store/CHROME_WEB_STORE_PRIVACY.md");
  const privacyPolicy = readRepoFile("docs/store/PRIVACY_POLICY.md");
  const releaseChecklist = readRepoFile("docs/RELEASE_CHECKLIST.md");
  const rootReadme = readRepoFile("README.md");
  const extensionReadme = readRepoFile("floun/README.md");
  const combined = [listing, privacyFields, privacyPolicy, releaseChecklist, rootReadme, extensionReadme].join("\n");

  expect(combined).not.toContain("floun-2.0.0.zip");
  expect(combined).not.toContain("floun-2.0.zip");
  expect(combined).not.toContain("VITE_DEEPSEEK_API_KEY");
  expect(combined).not.toContain("ssl-checker.io");
  expect(listing).toMatch(/user-supplied DeepSeek API key/i);
  expect(listing).toMatch(/explicit consent/i);
  expect(listing).toMatch(/saved on this device/i);
  expect(privacyFields).toMatch(/device-local extension storage/i);
  expect(privacyPolicy).toMatch(/extension is uninstalled/i);
  expect(privacyPolicy).toContain(
    "Floun's use and transfer of user data complies with the Chrome Web Store User Data Policy, including its Limited Use requirements."
  );
  expect(privacyPolicy).toMatch(/SSL Labs.*DeepSeek/s);
  expect(releaseChecklist).toContain("docs/release/2.1.0/QA_EVIDENCE.md");
});

export {};

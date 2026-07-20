import {
  clearReportDraftingSettings,
  loadReportDraftingStatus,
  loadReportDraftingSettings,
  saveReportDraftingSettings,
} from "./reportDraftingSettings";

const storageState: Record<string, unknown> = {};
const storageLocal = {
  get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
  set: vi.fn(async (items: Record<string, unknown>) => Object.assign(storageState, items)),
  remove: vi.fn(async (key: string) => { delete storageState[key]; }),
};

beforeEach(() => {
  Object.keys(storageState).forEach((key) => delete storageState[key]);
  vi.clearAllMocks();
  vi.stubGlobal("chrome", { storage: { local: storageLocal } });
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a user can persist, load, and remove consented DeepSeek BYOK settings", async () => {
  await saveReportDraftingSettings({
    apiKey: "  sk-user-owned-key  ",
    consented: true,
  });

  expect(storageLocal.set).toHaveBeenCalledWith({
    "floun.reportDrafting.deepseek.v2": {
      apiKey: "sk-user-owned-key",
      consented: true,
    },
  });
  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "sk-user-owned-key",
    consented: true,
  });

  await clearReportDraftingSettings();

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "",
    consented: false,
  });
  expect(storageLocal.remove).toHaveBeenCalledWith("floun.reportDrafting.deepseek.v2");
});

test("migrates legacy popup settings once and removes the legacy copy after persistence", async () => {
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", JSON.stringify({
    apiKey: "sk-legacy-key",
    consented: true,
  }));

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "sk-legacy-key",
    consented: true,
  });

  expect(storageLocal.set).toHaveBeenCalledWith({
    "floun.reportDrafting.deepseek.v2": {
      apiKey: "sk-legacy-key",
      consented: true,
    },
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBeNull();
});

test("keeps legacy settings usable when the migration write fails", async () => {
  const legacyValue = JSON.stringify({ apiKey: "sk-legacy-key", consented: true });
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", legacyValue);
  storageLocal.set.mockRejectedValueOnce(new Error("storage unavailable"));

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "sk-legacy-key",
    consented: true,
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBe(legacyValue);
});

test("keeps legacy settings usable when extension storage cannot be read", async () => {
  const legacyValue = JSON.stringify({ apiKey: "sk-legacy-key", consented: true });
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", legacyValue);
  storageLocal.get.mockRejectedValueOnce(new Error("storage unavailable"));

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "sk-legacy-key",
    consented: true,
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBe(legacyValue);
});

test("returns saved-key status without exposing the complete credential", async () => {
  await saveReportDraftingSettings({ apiKey: "sk-private-credential-7x9z", consented: true });

  const status = await loadReportDraftingStatus();

  expect(status).toEqual({ configured: true, consented: true, keySuffix: "7x9z" });
  expect(JSON.stringify(status)).not.toContain("sk-private-credential");
});

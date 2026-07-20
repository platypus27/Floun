import {
  clearReportDraftingSettings,
  loadReportDraftingStatus,
  loadReportDraftingSettings,
  repairReportDraftingStatusMetadata,
  saveReportDraftingSettings,
} from "./reportDraftingSettings";

const storageState: Record<string, unknown> = {};
const storageLocal = {
  get: vi.fn(async (key: string | string[]) => Object.fromEntries(
    (Array.isArray(key) ? key : [key]).map((entry) => [entry, storageState[entry]])
  )),
  set: vi.fn(async (items: Record<string, unknown>) => Object.assign(storageState, items)),
  remove: vi.fn(async (keys: string | string[]) => {
    (Array.isArray(keys) ? keys : [keys]).forEach((key) => delete storageState[key]);
  }),
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
    "floun.reportDrafting.deepseek.status.v2": {
      configured: true,
      consented: true,
      keySuffix: "-key",
    },
    "floun.reportDrafting.deepseek.deleted.v2": false,
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
  expect(storageLocal.remove).toHaveBeenCalledWith([
    "floun.reportDrafting.deepseek.v2",
    "floun.reportDrafting.deepseek.status.v2",
  ]);
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
    "floun.reportDrafting.deepseek.status.v2": {
      configured: true,
      consented: true,
      keySuffix: "-key",
    },
    "floun.reportDrafting.deepseek.deleted.v2": false,
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBeNull();
});

test("uses local fallback and retains legacy settings when the migration write fails", async () => {
  const legacyValue = JSON.stringify({ apiKey: "sk-legacy-key", consented: true });
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", legacyValue);
  storageLocal.set.mockRejectedValueOnce(new Error("storage unavailable"));

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "",
    consented: false,
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBe(legacyValue);
});

test("uses local fallback and retains legacy settings when extension storage cannot be read", async () => {
  const legacyValue = JSON.stringify({ apiKey: "sk-legacy-key", consented: true });
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", legacyValue);
  storageLocal.get.mockRejectedValueOnce(new Error("storage unavailable"));

  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "",
    consented: false,
  });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBe(legacyValue);
});

test("returns saved-key status without exposing the complete credential", async () => {
  storageState["floun.reportDrafting.deepseek.status.v2"] = {
    configured: true,
    consented: true,
    keySuffix: "7x9z",
  };

  const status = await loadReportDraftingStatus();

  expect(status).toEqual({ configured: true, consented: true, keySuffix: "7x9z" });
  expect(JSON.stringify(status)).not.toContain("sk-private-credential");
  expect(storageLocal.get).toHaveBeenCalledWith([
    "floun.reportDrafting.deepseek.status.v2",
    "floun.reportDrafting.deepseek.deleted.v2",
  ]);
  expect(storageLocal.get).not.toHaveBeenCalledWith("floun.reportDrafting.deepseek.v2");
});

test("background repair restores missing status metadata for a persisted v2 credential", async () => {
  storageState["floun.reportDrafting.deepseek.v2"] = {
    apiKey: "sk-existing-v2-key",
    consented: true,
  };

  await expect(repairReportDraftingStatusMetadata()).resolves.toBeUndefined();
  await expect(loadReportDraftingStatus()).resolves.toEqual({
    configured: true,
    consented: true,
    keySuffix: "-key",
  });
  expect(storageLocal.set).toHaveBeenCalledWith({
    "floun.reportDrafting.deepseek.v2": {
      apiKey: "sk-existing-v2-key",
      consented: true,
    },
    "floun.reportDrafting.deepseek.status.v2": {
      configured: true,
      consented: true,
      keySuffix: "-key",
    },
    "floun.reportDrafting.deepseek.deleted.v2": false,
  });
});

test("popup status loading does not read a v2 credential when metadata is absent", async () => {
  storageState["floun.reportDrafting.deepseek.v2"] = {
    apiKey: "sk-existing-v2-key",
    consented: true,
  };

  await expect(loadReportDraftingStatus()).resolves.toEqual({
    configured: false,
    consented: false,
    keySuffix: "",
  });
  expect(storageLocal.get).toHaveBeenCalledTimes(1);
  expect(storageLocal.get).not.toHaveBeenCalledWith(expect.arrayContaining([
    "floun.reportDrafting.deepseek.v2",
  ]));
});

test("removal clears current metadata and any retained legacy credential", async () => {
  storageState["floun.reportDrafting.deepseek.v2"] = {
    apiKey: "sk-current-key",
    consented: true,
  };
  storageState["floun.reportDrafting.deepseek.status.v2"] = {
    configured: true,
    consented: true,
    keySuffix: "-key",
  };
  window.localStorage.setItem("floun.reportDrafting.deepseek.v1", JSON.stringify({
    apiKey: "sk-legacy-key",
    consented: true,
  }));

  await clearReportDraftingSettings();

  await expect(loadReportDraftingSettings()).resolves.toEqual({ apiKey: "", consented: false });
  expect(window.localStorage.getItem("floun.reportDrafting.deepseek.v1")).toBeNull();
  expect(storageState).toEqual({
    "floun.reportDrafting.deepseek.deleted.v2": true,
  });
});

test("removal still clears extension storage when legacy cleanup throws", async () => {
  storageState["floun.reportDrafting.deepseek.v2"] = {
    apiKey: "sk-current-key",
    consented: true,
  };
  storageState["floun.reportDrafting.deepseek.status.v2"] = {
    configured: true,
    consented: true,
    keySuffix: "-key",
  };
  const removeLegacy = vi
    .spyOn(Storage.prototype, "removeItem")
    .mockImplementationOnce(() => {
      throw new Error("legacy storage unavailable");
    });

  await expect(clearReportDraftingSettings()).resolves.toBeUndefined();

  expect(storageState).toEqual({
    "floun.reportDrafting.deepseek.deleted.v2": true,
  });
  expect(storageLocal.remove).toHaveBeenCalledWith([
    "floun.reportDrafting.deepseek.v2",
    "floun.reportDrafting.deepseek.status.v2",
  ]);
  await expect(loadReportDraftingSettings()).resolves.toEqual({
    apiKey: "",
    consented: false,
  });
  removeLegacy.mockRestore();
});

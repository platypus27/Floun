export interface ReportDraftingSettings {
  apiKey: string;
  consented: boolean;
}

export interface ReportDraftingStatus {
  configured: boolean;
  consented: boolean;
  keySuffix: string;
}

const SETTINGS_KEY = "floun.reportDrafting.deepseek.v2";
const LEGACY_SETTINGS_KEY = "floun.reportDrafting.deepseek.v1";

const emptySettings = (): ReportDraftingSettings => ({
  apiKey: "",
  consented: false,
});

const normalizeSettings = (value: unknown): ReportDraftingSettings => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptySettings();
  }

  const stored = value as Record<string, unknown>;
  const apiKey = typeof stored.apiKey === "string" ? stored.apiKey.trim() : "";

  return {
    apiKey,
    consented: apiKey.length > 0 && stored.consented === true,
  };
};

const statusFromSettings = (settings: ReportDraftingSettings): ReportDraftingStatus => ({
  configured: settings.apiKey.length > 0,
  consented: settings.consented,
  keySuffix: settings.apiKey.length > 4 ? settings.apiKey.slice(-4) : "••••",
});

const loadLegacySettings = (): ReportDraftingSettings => {
  try {
    const legacyValue = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    return legacyValue ? normalizeSettings(JSON.parse(legacyValue)) : emptySettings();
  } catch {
    return emptySettings();
  }
};

export async function loadReportDraftingSettings(): Promise<ReportDraftingSettings> {
  let stored: Record<string, unknown>;

  try {
    stored = await chrome.storage.local.get(SETTINGS_KEY);
  } catch {
    return loadLegacySettings();
  }

  const currentSettings = normalizeSettings(stored[SETTINGS_KEY]);

  if (currentSettings.apiKey) {
    return currentSettings;
  }

  const legacySettings = loadLegacySettings();
  if (!legacySettings.apiKey) {
    return currentSettings;
  }

  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: legacySettings });
    window.localStorage.removeItem(LEGACY_SETTINGS_KEY);
  } catch {
    return legacySettings;
  }
  return legacySettings;
}

export async function saveReportDraftingSettings(
  settings: ReportDraftingSettings
): Promise<ReportDraftingStatus> {
  const normalized = normalizeSettings(settings);

  await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
  return statusFromSettings(normalized);
}

export async function clearReportDraftingSettings(): Promise<void> {
  await chrome.storage.local.remove(SETTINGS_KEY);
}

export async function loadReportDraftingStatus(): Promise<ReportDraftingStatus> {
  return statusFromSettings(await loadReportDraftingSettings());
}

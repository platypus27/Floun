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
const STATUS_KEY = "floun.reportDrafting.deepseek.status.v2";
const DELETED_KEY = "floun.reportDrafting.deepseek.deleted.v2";
const LEGACY_SETTINGS_KEY = "floun.reportDrafting.deepseek.v1";

const emptySettings = (): ReportDraftingSettings => ({
  apiKey: "",
  consented: false,
});

const emptyStatus = (): ReportDraftingStatus => ({
  configured: false,
  consented: false,
  keySuffix: "",
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
  keySuffix: settings.apiKey.slice(-4),
});

const normalizeStatus = (value: unknown): ReportDraftingStatus => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyStatus();
  }

  const stored = value as Record<string, unknown>;
  const keySuffix = typeof stored.keySuffix === "string" ? stored.keySuffix.slice(-4) : "";
  const configured = stored.configured === true && keySuffix.length > 0;

  return {
    configured,
    consented: configured && stored.consented === true,
    keySuffix: configured ? keySuffix : "",
  };
};

const loadLegacySettings = (): ReportDraftingSettings => {
  try {
    const legacyValue = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    return legacyValue ? normalizeSettings(JSON.parse(legacyValue)) : emptySettings();
  } catch {
    return emptySettings();
  }
};

const removeLegacySettings = (): void => {
  try {
    window.localStorage.removeItem(LEGACY_SETTINGS_KEY);
  } catch {
    // Extension storage remains authoritative if legacy cleanup is unavailable.
  }
};

const persistSettings = async (
  settings: ReportDraftingSettings
): Promise<ReportDraftingStatus> => {
  const status = statusFromSettings(settings);
  await chrome.storage.local.set({
    [SETTINGS_KEY]: settings,
    [STATUS_KEY]: status,
    [DELETED_KEY]: false,
  });
  removeLegacySettings();
  return status;
};

const migrateLegacySettings = async (): Promise<ReportDraftingSettings | null> => {
  const legacySettings = loadLegacySettings();
  if (!legacySettings.apiKey) {
    return null;
  }

  try {
    await persistSettings(legacySettings);
    return legacySettings;
  } catch {
    return null;
  }
};

export async function loadReportDraftingSettings(): Promise<ReportDraftingSettings> {
  let stored: Record<string, unknown>;

  try {
    stored = await chrome.storage.local.get([SETTINGS_KEY, DELETED_KEY]);
  } catch {
    return emptySettings();
  }

  if (stored[DELETED_KEY] === true) {
    removeLegacySettings();
    return emptySettings();
  }

  const currentSettings = normalizeSettings(stored[SETTINGS_KEY]);
  if (currentSettings.apiKey) {
    removeLegacySettings();
    return currentSettings;
  }

  return (await migrateLegacySettings()) ?? emptySettings();
}

export async function saveReportDraftingSettings(
  settings: ReportDraftingSettings
): Promise<ReportDraftingStatus> {
  return persistSettings(normalizeSettings(settings));
}

export async function clearReportDraftingSettings(): Promise<void> {
  await chrome.storage.local.set({ [DELETED_KEY]: true });
  removeLegacySettings();
  await chrome.storage.local.remove([SETTINGS_KEY, STATUS_KEY]);
}

export async function loadReportDraftingStatus(): Promise<ReportDraftingStatus> {
  let stored: Record<string, unknown>;

  try {
    stored = await chrome.storage.local.get([STATUS_KEY, DELETED_KEY]);
  } catch {
    return emptyStatus();
  }

  if (stored[DELETED_KEY] === true) {
    removeLegacySettings();
    return emptyStatus();
  }

  const currentStatus = normalizeStatus(stored[STATUS_KEY]);
  if (currentStatus.configured) {
    return currentStatus;
  }

  const migratedSettings = await migrateLegacySettings();
  return migratedSettings ? statusFromSettings(migratedSettings) : emptyStatus();
}

export async function repairReportDraftingStatusMetadata(): Promise<void> {
  const stored = await chrome.storage.local.get([SETTINGS_KEY, STATUS_KEY, DELETED_KEY]);
  if (stored[DELETED_KEY] === true || normalizeStatus(stored[STATUS_KEY]).configured) {
    return;
  }

  const settings = normalizeSettings(stored[SETTINGS_KEY]);
  if (!settings.apiKey) {
    return;
  }

  await chrome.storage.local.set({
    [SETTINGS_KEY]: settings,
    [STATUS_KEY]: statusFromSettings(settings),
    [DELETED_KEY]: false,
  });
}

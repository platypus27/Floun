export interface ReportDraftingSettings {
  apiKey: string;
  consented: boolean;
}

const SETTINGS_KEY = "floun.reportDrafting.deepseek.v1";

const emptySettings = (): ReportDraftingSettings => ({
  apiKey: "",
  consented: false,
});

export function loadReportDraftingSettings(): ReportDraftingSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_KEY);

    if (!stored) {
      return emptySettings();
    }

    const value = JSON.parse(stored) as Record<string, unknown>;
    const apiKey = typeof value.apiKey === "string" ? value.apiKey.trim() : "";

    return {
      apiKey,
      consented: apiKey.length > 0 && value.consented === true,
    };
  } catch {
    return emptySettings();
  }
}

export function saveReportDraftingSettings(
  settings: ReportDraftingSettings
): ReportDraftingSettings {
  const normalized = {
    apiKey: settings.apiKey.trim(),
    consented: settings.apiKey.trim().length > 0 && settings.consented,
  };

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearReportDraftingSettings(): void {
  window.localStorage.removeItem(SETTINGS_KEY);
}

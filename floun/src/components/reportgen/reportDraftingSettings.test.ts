import {
  clearReportDraftingSettings,
  loadReportDraftingSettings,
  saveReportDraftingSettings,
} from "./reportDraftingSettings";

beforeEach(() => {
  window.localStorage.clear();
});

test("a user can save, load, and remove consented DeepSeek BYOK settings", () => {
  saveReportDraftingSettings({
    apiKey: "  sk-user-owned-key  ",
    consented: true,
  });

  expect(loadReportDraftingSettings()).toEqual({
    apiKey: "sk-user-owned-key",
    consented: true,
  });

  clearReportDraftingSettings();

  expect(loadReportDraftingSettings()).toEqual({
    apiKey: "",
    consented: false,
  });
});

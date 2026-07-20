import type { ReportDraftingSettings } from "./reportDraftingSettings";

const API_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-v4-flash";

interface DeepseekResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

export function hasDeepseekApiKey(settings: ReportDraftingSettings): boolean {
  return settings.apiKey.trim().length > 0 && settings.consented;
}

export async function generateChatMessage(
  prompt: string,
  settings: ReportDraftingSettings
): Promise<string> {
  const apiKey = settings.apiKey.trim();

  if (!apiKey) {
    throw new Error("A user-owned DeepSeek API key is not configured.");
  }

  if (!settings.consented) {
    throw new Error("Consent is required before sending redacted report content to DeepSeek.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to generate AI content: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as DeepseekResponse;
  return data.choices?.[0]?.message?.content || "No content generated.";
}

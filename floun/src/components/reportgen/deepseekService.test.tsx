import { afterEach, describe, expect, test, vi } from "vitest";
import { generateChatMessage, hasDeepseekApiKey } from "./deepseekService";

const configuredSettings = {
  apiKey: ["sk", "test-key-1234567890abcdef"].join("-"),
  consented: true,
};

describe("deepseekService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("hasDeepseekApiKey returns true when key is set", () => {
    expect(hasDeepseekApiKey(configuredSettings)).toBe(true);
  });

  test("does not contact DeepSeek until the user explicitly consents", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateChatMessage("hello", {
      apiKey: "sk-user-owned-key",
      consented: false,
    })).rejects.toThrow(/consent/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("hasDeepseekApiKey returns false when key is empty or unset", () => {
    expect(hasDeepseekApiKey({ apiKey: "", consented: true })).toBe(false);
    expect(hasDeepseekApiKey({ apiKey: "sk-key", consented: false })).toBe(false);
  });

  test("generateChatMessage throws when key is not configured", async () => {
    await expect(generateChatMessage("hello", { apiKey: "", consented: false })).rejects.toThrow(
      "A user-owned DeepSeek API key is not configured."
    );
  });

  test("generateChatMessage posts OpenAI-shape body to deepseek and returns content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "scanned report" } }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateChatMessage("summarize findings", configuredSettings);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.deepseek.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      model: "deepseek-v4-flash",
      messages: [{ role: "user", content: "summarize findings" }],
    });
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Authorization"]).toBe("Bearer sk-test-key-1234567890abcdef");
    expect(result).toBe("scanned report");
  });

  test("generateChatMessage throws on non-2xx with status and body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      })
    );
    await expect(generateChatMessage("ping", configuredSettings)).rejects.toThrow(
      /Failed to generate AI content: 401 unauthorized/
    );
  });

  test("generateChatMessage returns fallback when response has no content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{}] }),
      })
    );
    await expect(generateChatMessage("ping", configuredSettings)).resolves.toBe("No content generated.");
  });
});

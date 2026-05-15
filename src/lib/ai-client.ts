import { loadEnvConfig } from "@next/env";

type AIProvider = "anthropic" | "openai";

interface AIClientConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function getConfig(): AIClientConfig | null {
  const read = (key: string) => process.env[key]?.trim() || "";
  const loadLocalEnv = () => loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", console, true);

  let apiKey = read("AI_API_KEY");
  let legacyKey = read("ANTHROPIC_API_KEY");

  if (!apiKey && !legacyKey) {
    loadLocalEnv();
    apiKey = read("AI_API_KEY");
    legacyKey = read("ANTHROPIC_API_KEY");
  }

  const provider = (read("AI_API_PROVIDER") || read("AI_PROVIDER")) as AIProvider | undefined;
  const baseUrl = read("AI_API_BASE_URL") || read("AI_BASE_URL");
  const model = read("AI_MODEL");

  if (!apiKey) {
    if (legacyKey) {
      return {
        provider: "anthropic",
        apiKey: legacyKey,
        baseUrl: "",
        model: model || "claude-sonnet-4-20250514",
      };
    }
    return null;
  }

  const resolvedProvider: AIProvider = provider || "openai";
  const defaultModel =
    resolvedProvider === "anthropic" ? "claude-sonnet-4-20250514" : "deepseek-chat";

  return {
    provider: resolvedProvider,
    apiKey,
    baseUrl,
    model: model || defaultModel,
  };
}

interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function callAI(request: AIRequest): Promise<string | null> {
  const config = getConfig();
  if (!config) {
    console.error("[ai-client] No API key configured");
    return null;
  }

  const { provider, apiKey, baseUrl, model } = config;
  const maxTokens = request.maxTokens ?? 4096;

  if (provider === "anthropic") {
    return callAnthropic(apiKey, model, request.systemPrompt, request.userPrompt, maxTokens);
  }

  return callOpenAICompatible(apiKey, baseUrl, model, request.systemPrompt, request.userPrompt, maxTokens);
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string | null> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    console.error("[ai-client] Anthropic error:", response.status);
    return null;
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? null;
}

async function callOpenAICompatible(
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string | null> {
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[ai-client] OpenAI error:", response.status, errText.substring(0, 200));
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? null;
}

export function getAIErrorMessage(): string | null {
  const config = getConfig();
  if (!config) {
    return "API Key 未配置。请在 .env.local 中设置 AI_API_KEY（OpenAI 兼容）或 ANTHROPIC_API_KEY（Claude）。";
  }
  return null;
}

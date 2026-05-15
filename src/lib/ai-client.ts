import fs from "node:fs";
import path from "node:path";

type AIProvider = "anthropic" | "openai";

interface AIClientConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

let _cached: AIClientConfig | null | undefined;

function getConfig(): AIClientConfig | null {
  if (_cached !== undefined) return _cached;

  function parseEnvFile(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, "utf-8");
    const result: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
    return result;
  }

  // Merge .env.local + .env into a flat env object
  const cwd = process.cwd();
  const env: Record<string, string> = { ...process.env as Record<string, string> };
  const localEnv = parseEnvFile(path.join(cwd, ".env.local"));
  const defaultEnv = parseEnvFile(path.join(cwd, ".env"));
  Object.assign(env, defaultEnv, localEnv); // .env.local wins

  const read = (key: string) => (env[key] ?? "").trim();

  const apiKey = read("AI_API_KEY");
  const legacyKey = read("ANTHROPIC_API_KEY");
  const provider = (read("AI_API_PROVIDER") || read("AI_PROVIDER")) as AIProvider | undefined;
  const baseUrl = read("AI_API_BASE_URL") || read("AI_BASE_URL");
  const model = read("AI_MODEL");

  if (!apiKey) {
    if (legacyKey) {
      _cached = {
        provider: "anthropic",
        apiKey: legacyKey,
        baseUrl: "",
        model: model || "claude-sonnet-4-20250514",
      };
      return _cached;
    }
    _cached = null;
    console.error("[ai-client] No AI_API_KEY found in .env.local or process.env");
    return null;
  }

  const resolvedProvider: AIProvider = provider || "openai";
  const defaultModel =
    resolvedProvider === "anthropic" ? "claude-sonnet-4-20250514" : "deepseek-chat";

  _cached = {
    provider: resolvedProvider,
    apiKey,
    baseUrl,
    model: model || defaultModel,
  };
  return _cached;
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

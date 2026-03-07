import { AgentDefinition, AgentResult } from "../types/index.js";
import { estimateTokens } from "../lib/metrics.js";

// ─── Ollama config (read once at startup) ────────────────────────────────────

export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1";

// ─── Types matching Ollama's chat API ────────────────────────────────────────

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  model: string;
  message: OllamaMessage;
  done: boolean;
  // Ollama optionally returns native token counts (available in newer builds)
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaTagEntry {
  name: string;
  modified_at: string;
  size: number;
}

interface OllamaTagsResponse {
  models: OllamaTagEntry[];
}

// ─── Return type enriched with timing & token data ───────────────────────────

export interface AgentRunResult {
  result: AgentResult;
  durationMs: number;
  promptTokensEst: number;
  outputTokensEst: number;
  /** True when native Ollama token counts were available (not estimated). */
  tokenCountNative: boolean;
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function pingOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── List available models ────────────────────────────────────────────────────

export async function listOllamaModels(): Promise<OllamaTagEntry[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama /api/tags failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as OllamaTagsResponse;
  return json.models ?? [];
}

// ─── Agent runner ─────────────────────────────────────────────────────────────

/**
 * Calls a single AI agent via Ollama's /api/chat and returns the parsed JSON
 * result along with timing and token-usage data.
 */
export async function runAgent(
  agent: AgentDefinition,
  userContent: string,
  model: string = OLLAMA_MODEL,
): Promise<AgentRunResult> {
  const promptText = agent.systemPrompt + "\n" + userContent;

  const body = {
    model,
    stream: false,
    format: "json",
    messages: [
      { role: "system", content: agent.systemPrompt } satisfies OllamaMessage,
      { role: "user", content: userContent } satisfies OllamaMessage,
    ],
  };

  const t0 = Date.now();

  let res: globalThis.Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(
      `Cannot reach Ollama at ${OLLAMA_BASE_URL}. Is it running? (${msg})`,
    );
  }

  const durationMs = Date.now() - t0;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ollama returned ${res.status} for agent "${agent.name}": ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as OllamaChatResponse;
  const raw = data.message?.content ?? "";

  // Prefer native counts if Ollama provides them; fall back to char estimate
  const tokenCountNative =
    typeof data.prompt_eval_count === "number" &&
    typeof data.eval_count === "number";

  const promptTokensEst = tokenCountNative
    ? data.prompt_eval_count!
    : estimateTokens(promptText);

  const outputTokensEst = tokenCountNative
    ? data.eval_count!
    : estimateTokens(raw);

  let parsed: AgentResult;
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()) as AgentResult;
  } catch {
    throw new Error(
      `Agent "${agent.name}" returned unparseable JSON: ${raw.slice(0, 200)}`,
    );
  }

  return {
    result: parsed,
    durationMs,
    promptTokensEst,
    outputTokensEst,
    tokenCountNative,
  };
}

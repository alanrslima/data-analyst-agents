import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { runPipeline } from "../agents/pipeline.js";
import { AGENTS } from "../agents/definitions.js";
import { listOllamaModels, pingOllama, OLLAMA_BASE_URL, OLLAMA_MODEL } from "../agents/runner.js";

const router = Router();

const RunPipelineSchema = z.object({
  data: z
    .string()
    .min(10, "Data must be at least 10 characters")
    .max(50_000, "Data must be under 50,000 characters"),
  model: z.string().optional(), // optional model override
});

/**
 * GET /api/agents
 * Returns all agent definitions (without system prompts).
 */
router.get("/agents", (_req: Request, res: Response) => {
  const safeAgents = Object.values(AGENTS).map(({ systemPrompt: _, ...rest }) => rest);
  res.json({ success: true, agents: safeAgents });
});

/**
 * GET /api/models
 * Returns all locally available Ollama models.
 */
router.get("/models", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await listOllamaModels();
    res.json({
      success: true,
      activeModel: OLLAMA_MODEL,
      models: models.map((m) => ({
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pipeline/run
 * Streams SSE events as each agent in the pipeline runs.
 * Optionally accepts { model: "mistral" } to override the default model.
 */
router.post(
  "/pipeline/run",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = RunPipelineSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const model = parsed.data.model ?? OLLAMA_MODEL;
      const clientIp = (req.headers["x-forwarded-for"] as string | undefined)
        ?? req.ip
        ?? "unknown";
      await runPipeline(parsed.data.data, res, model, clientIp);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/health
 * Health check — also verifies Ollama connectivity.
 */
router.get("/health", async (_req: Request, res: Response) => {
  const ollamaReachable = await pingOllama();
  res.status(ollamaReachable ? 200 : 503).json({
    success: ollamaReachable,
    status: ollamaReachable ? "ok" : "ollama_unreachable",
    ollama: {
      url: OLLAMA_BASE_URL,
      reachable: ollamaReachable,
      model: OLLAMA_MODEL,
    },
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

export default router;

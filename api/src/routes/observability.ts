import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getLogs, clearLogs } from "../lib/logger.js";
import { getRuns, getRun, getUsageStats } from "../lib/metrics.js";
import { LogLevel } from "../types/metrics.js";

const router = Router();

// ─── GET /api/logs ────────────────────────────────────────────────────────────

const LogQuerySchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).optional(),
  limit: z.coerce.number().min(1).max(500).optional(),
  since: z.string().datetime({ offset: true }).optional(),
});

/**
 * GET /api/logs
 * Returns buffered log entries (newest-last).
 *
 * Query params:
 *   level  = debug | info | warn | error   (min level filter)
 *   limit  = 1–500                          (default 100)
 *   since  = ISO datetime                   (entries at or after this time)
 */
router.get("/logs", (req: Request, res: Response) => {
  const parsed = LogQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors.map((e) => e.message).join(", ") });
    return;
  }

  const entries = getLogs({
    level: parsed.data.level as LogLevel | undefined,
    limit: parsed.data.limit ?? 100,
    since: parsed.data.since,
  });

  res.json({ success: true, count: entries.length, logs: entries });
});

/**
 * DELETE /api/logs
 * Clears the in-memory log buffer.
 */
router.delete("/logs", (_req: Request, res: Response) => {
  clearLogs();
  res.json({ success: true, message: "Log buffer cleared" });
});

// ─── GET /api/metrics ─────────────────────────────────────────────────────────

/**
 * GET /api/metrics
 * Returns aggregated usage statistics across all pipeline runs.
 */
router.get("/metrics", (_req: Request, res: Response) => {
  const stats = getUsageStats();
  res.json({ success: true, metrics: stats });
});

// ─── GET /api/runs ────────────────────────────────────────────────────────────

const RunsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(200).optional(),
});

/**
 * GET /api/runs
 * Returns recent pipeline run records (newest-last).
 *
 * Query params:
 *   limit = 1–200  (default 20)
 */
router.get("/runs", (req: Request, res: Response) => {
  const parsed = RunsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors.map((e) => e.message).join(", ") });
    return;
  }

  const runs = getRuns(parsed.data.limit ?? 20);
  res.json({ success: true, count: runs.length, runs });
});

// ─── GET /api/runs/:runId ─────────────────────────────────────────────────────

/**
 * GET /api/runs/:runId
 * Returns a single pipeline run record by ID.
 */
router.get("/runs/:runId", (req: Request, res: Response, next: NextFunction) => {
  const run = getRun(req.params.runId);
  if (!run) {
    res.status(404).json({ success: false, error: `Run "${req.params.runId}" not found` });
    return;
  }
  res.json({ success: true, run });
});

export default router;

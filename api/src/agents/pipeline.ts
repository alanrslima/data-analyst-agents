import { Response } from "express";
import { AGENTS, AGENT_ORDER } from "./definitions.js";
import { runAgent, OLLAMA_MODEL } from "./runner.js";
import { PipelineResults, AgentRunEvent } from "../types/index.js";
import { logger } from "../lib/logger.js";
import {
  startRun,
  recordAgentMetrics,
  finishRun,
} from "../lib/metrics.js";

/**
 * Runs the full 4-agent pipeline sequentially.
 * Streams SSE events to the client, and records structured logs + metrics
 * for every agent invocation and the overall run.
 */
export async function runPipeline(
  rawData: string,
  res: Response,
  model: string = OLLAMA_MODEL,
  clientIp = "unknown"
): Promise<void> {
  const results: PipelineResults = {};

  // ── Start tracking ──────────────────────────────────────────────────────────
  const runId = startRun({
    model,
    inputBytes: Buffer.byteLength(rawData, "utf8"),
    clientIp,
  });

  logger.info("Pipeline started", { runId, model, inputBytes: Buffer.byteLength(rawData, "utf8"), clientIp });

  const sendEvent = (event: AgentRunEvent | Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Send runId to client so it can query /api/runs/:id later
  sendEvent({ type: "run_started", runId, model, timestamp: new Date().toISOString() });

  for (const agentKey of AGENT_ORDER) {
    const agent = AGENTS[agentKey];

    sendEvent({
      agentId: agent.id,
      status: "running",
      message: `${agent.name} started`,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Agent starting`, { runId, agentId: agent.id, model });

    try {
      let prompt = "";
      switch (agentKey) {
        case "parser":
          prompt = `Analyze this dataset:\n\n${rawData}`;
          break;
        case "statistician":
          prompt = `Dataset:\n${rawData}\n\nParser findings:\n${JSON.stringify(results.parser)}`;
          break;
        case "analyst":
          prompt = `Dataset:\n${rawData}\n\nStatistics:\n${JSON.stringify(results.statistician)}`;
          break;
        case "reporter":
          prompt = [
            `Parser output:\n${JSON.stringify(results.parser)}`,
            `Stats output:\n${JSON.stringify(results.statistician)}`,
            `Analyst output:\n${JSON.stringify(results.analyst)}`,
          ].join("\n\n");
          break;
      }

      const { result, durationMs, promptTokensEst, outputTokensEst, tokenCountNative } =
        await runAgent(agent, prompt, model);

      (results as Record<string, unknown>)[agentKey] = result;

      // ── Record agent metrics ───────────────────────────────────────────────
      recordAgentMetrics(runId, {
        agentId: agent.id,
        model,
        status: "success",
        durationMs,
        promptTokensEst,
        outputTokensEst,
      });

      logger.info(`Agent completed`, {
        runId,
        agentId: agent.id,
        durationMs,
        promptTokensEst,
        outputTokensEst,
        tokenCountNative,
      });

      sendEvent({
        agentId: agent.id,
        status: "done",
        result,
        message: `${agent.name} completed in ${durationMs}ms`,
        durationMs,
        promptTokensEst,
        outputTokensEst,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      recordAgentMetrics(runId, {
        agentId: agent.id,
        model,
        status: "error",
        durationMs: 0,
        promptTokensEst: 0,
        outputTokensEst: 0,
        errorMessage: message,
      });

      logger.error(`Agent failed`, { runId, agentId: agent.id, error: message });
      finishRun(runId, "failed", message);

      sendEvent({ agentId: agent.id, status: "error", message, timestamp: new Date().toISOString() });
      sendEvent({ type: "pipeline_error", runId, message });
      res.end();
      return;
    }
  }

  finishRun(runId, "completed");
  logger.info("Pipeline completed", { runId, model });

  sendEvent({ type: "pipeline_complete", runId, results, timestamp: new Date().toISOString() });
  res.end();
}

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pipelineRouter from "./routes/pipeline.js";
import observabilityRouter from "./routes/observability.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { logger } from "./lib/logger.js";
import { pingOllama, OLLAMA_BASE_URL, OLLAMA_MODEL } from "./agents/runner.js";

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.set("trust proxy", 1); // trust first proxy for accurate req.ip

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));

// HTTP request logger
app.use(requestLogger);

// Rate limiting: 30 pipeline runs per 15 minutes per IP
app.use(
  "/api/pipeline",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: "Too many requests. Please wait a moment." },
  })
);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", pipelineRouter);
app.use("/api", observabilityRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  logger.info("API server started", {
    port: PORT,
    frontendUrl: FRONTEND_URL,
    ollamaUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
    nodeEnv: process.env.NODE_ENV ?? "development",
  });

  const alive = await pingOllama();
  if (alive) {
    logger.info("Ollama reachable", { url: OLLAMA_BASE_URL, model: OLLAMA_MODEL });
    console.log(`✅  API → http://localhost:${PORT}`);
    console.log(`   Ollama  ✅  ${OLLAMA_BASE_URL}  (model: ${OLLAMA_MODEL})`);
  } else {
    logger.warn("Ollama not reachable at startup", { url: OLLAMA_BASE_URL });
    console.log(`✅  API → http://localhost:${PORT}`);
    console.warn(`   Ollama  ⚠️   not reachable at ${OLLAMA_BASE_URL}`);
    console.warn(`   Run: ollama pull ${OLLAMA_MODEL}`);
  }

  console.log(`\n   Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/agents`);
  console.log(`   GET  /api/models`);
  console.log(`   POST /api/pipeline/run`);
  console.log(`   GET  /api/metrics`);
  console.log(`   GET  /api/runs`);
  console.log(`   GET  /api/runs/:id`);
  console.log(`   GET  /api/logs`);
  console.log(`   DELETE /api/logs\n`);
});

export default app;

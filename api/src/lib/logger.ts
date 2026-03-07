import { randomUUID } from "crypto";
import { LogEntry, LogLevel } from "../types/metrics.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_LOG_ENTRIES = 500; // ring buffer size
const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const ACTIVE_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

// ─── ANSI colours for console output ─────────────────────────────────────────

const COLOUR: Record<LogLevel, string> = {
  debug: "\x1b[90m",   // grey
  info:  "\x1b[36m",   // cyan
  warn:  "\x1b[33m",   // yellow
  error: "\x1b[31m",   // red
};
const RESET = "\x1b[0m";

// ─── In-memory ring buffer ────────────────────────────────────────────────────

const buffer: LogEntry[] = [];

function push(entry: LogEntry): void {
  buffer.push(entry);
  if (buffer.length > MAX_LOG_ENTRIES) buffer.shift();
}

// ─── Core write ───────────────────────────────────────────────────────────────

function write(
  level: LogLevel,
  msg: string,
  ctx?: Record<string, unknown>
): void {
  if (LOG_LEVEL_RANK[level] < LOG_LEVEL_RANK[ACTIVE_LEVEL]) return;

  const entry: LogEntry = {
    id: randomUUID(),
    ts: new Date().toISOString(),
    level,
    msg,
    ...(ctx && Object.keys(ctx).length > 0 ? { ctx } : {}),
  };

  push(entry);

  // Pretty console line
  const colour = COLOUR[level];
  const prefix = `${colour}[${entry.level.toUpperCase().padEnd(5)}]${RESET}`;
  const ctxStr = ctx ? " " + JSON.stringify(ctx) : "";
  console.log(`${prefix} ${entry.ts} ${msg}${ctxStr}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => write("debug", msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => write("info",  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => write("warn",  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
};

/** Returns a copy of all buffered log entries, newest-last. */
export function getLogs(opts?: {
  level?: LogLevel;
  limit?: number;
  since?: string; // ISO date string
}): LogEntry[] {
  let entries = [...buffer];

  if (opts?.level) {
    const minRank = LOG_LEVEL_RANK[opts.level];
    entries = entries.filter((e) => LOG_LEVEL_RANK[e.level] >= minRank);
  }

  if (opts?.since) {
    const sinceMs = new Date(opts.since).getTime();
    entries = entries.filter((e) => new Date(e.ts).getTime() >= sinceMs);
  }

  const limit = opts?.limit ?? 200;
  return entries.slice(-limit);
}

/** Clears the log buffer. */
export function clearLogs(): void {
  buffer.length = 0;
}

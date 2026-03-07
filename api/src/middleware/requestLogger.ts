import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

/**
 * Middleware that logs every incoming HTTP request with method, path,
 * status code, and response time.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    logger[level](`${method} ${originalUrl} ${status}`, {
      method,
      path: originalUrl,
      status,
      durationMs: ms,
      ip: req.ip ?? "unknown",
    });
  });

  next();
}

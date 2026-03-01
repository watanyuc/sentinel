import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — catches all unhandled errors in Express routes.
 * Must be registered AFTER all routes (4-arg signature tells Express it's an error handler).
 */
export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err.status ?? 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  // Log full error for 5xx only (avoid noise from client errors)
  if (status >= 500) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  }

  res.status(status).json({ error: message });
};

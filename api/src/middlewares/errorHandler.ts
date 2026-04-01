import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { env } from '../config/env';
import type { ApiResponse } from '../types';

/**
 * Error handler global de Express (4 parámetros obligatorios).
 * Captura cualquier error pasado via next(err).
 *
 * - Loguea método, path, status, mensaje y stack via pino-http (req.log)
 * - Producción: mensaje genérico, nunca expone stack ni detalle interno
 * - Desarrollo: mensaje real del error para facilitar debug
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (
  err:  Error,
  req:  Request,
  res:  Response,
  _next: NextFunction,
): void => {
  const status = (err as { status?: number }).status ?? 500;

  // pino-http agrega req.log automáticamente en app.ts
  (req as Request & { log?: { error: (obj: object) => void } }).log?.error({
    method:  req.method,
    path:    req.path,
    status,
    message: err.message,
    stack:   err.stack,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message;

  const response: ApiResponse = {
    success:   false,
    message,
    data:      null,
    timestamp: new Date().toISOString(),
  };

  res.status(status).json(response);
};

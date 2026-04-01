import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import type { ApiResponse } from '../types';

/**
 * Factory de middleware de validación.
 * Recibe un schema Zod y retorna un middleware Express.
 *
 * - Error → 400 con errors[] en formato ApiError (field + detail)
 * - OK    → req.body reemplazado con el valor parseado por Zod, next()
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const response: ApiResponse = {
        success:   false,
        message:   'Error de validación',
        data:      null,
        errors:    result.error.issues.map((issue) => ({
          field:  issue.path.join('.') || 'body',
          detail: issue.message,
        })),
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
      return;
    }

    req.body = result.data;
    next();
  };
}

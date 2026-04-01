import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { callSP } from './callSP';
import type { ApiResponse } from '../types';

interface SPRouterOptions<T> {
  /** Nombre del stored procedure en PostgreSQL (ej: 'sp_marcas'). */
  spName: string;
  /** Schema Zod para validar el body de POST / PUT / DELETE. */
  schema: ZodSchema<T>;
  /**
   * true  → tabla/catálogo global. GET no requiere filtro de contexto.
   * false → tabla con contexto. GET requiere ?{contextField}=N en query param.
   * @default false
   */
  global?: boolean;
  /**
   * Nombre del campo de contexto para el GET cuando global=false.
   * Se usa como query param (?{contextField}=N) y como clave en el body al SP.
   * @default 'id_empresa'
   */
  contextField?: string;
}

/**
 * Factory que genera un router Express con los 5 endpoints REST estándar.
 * La opcion del SP la determina el servidor según el método HTTP — nunca el cliente.
 *
 *   GET    /          → opcion 1 (listar)
 *   GET    /:id       → opcion 2 (obtener por id)
 *   POST   /          → opcion 3 (insertar)    — todo en body
 *   PUT    /          → opcion 4 (actualizar)  — todo en body (inc. id)
 *   DELETE /          → opcion 5 (eliminar)    — todo en body (inc. id)
 *
 * El body validado por Zod se pasa íntegro como JSONB al SP.
 * El SP extrae solo los campos que necesita — campos extra se ignoran.
 *
 * Para endpoints adicionales (opcion 6+), agregar rutas al router retornado:
 *   const router = createSPRouter({ ... });
 *   router.get('/search/:anio', authMiddleware, async (req, res, next) => {
 *     const { message, data } = await callSP('sp_marcas', 6, req.params);
 *     res.json({ success: true, message, data, timestamp: new Date().toISOString() });
 *   });
 */
export function createSPRouter<T>(options: SPRouterOptions<T>): Router {
  const { spName, schema, global: isGlobal = false, contextField = 'id_empresa' } = options;
  const router = Router();

  /**
   * Middleware exclusivo para GET.
   * Convierte URL params e id a un objeto plano en req.body para que
   * makeHandler siempre lea de req.body sin importar el método HTTP.
   *
   * global = true:  no requiere empresa_id
   *   GET /         → req.body = {}
   *   GET /:id      → req.body = { id: N }
   *
   * global = false: requiere ?{contextField}=N
   *   GET /         → req.body = { [contextField]: N }
   *   GET /:id      → req.body = { [contextField]: N, id: N }
   */
  const parseGetParams: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    if (isGlobal) {
      req.body = req.params.id ? { id: Number(req.params.id) } : {};
      return next();
    }

    const contextValue = Number(req.query[contextField]);
    if (!contextValue || isNaN(contextValue)) {
      const response: ApiResponse = {
        success:   false,
        message:   'Error de validación',
        data:      null,
        errors:    [{ field: contextField, detail: `${contextField} requerido como query param (?${contextField}=1)` }],
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    req.body = {
      [contextField]: contextValue,
      ...(req.params.id ? { id: Number(req.params.id) } : {}),
    };
    next();
  };

  /**
   * Handler genérico. Siempre lee de req.body:
   *   - GET:              parseGetParams armó req.body con query/URL params
   *   - POST/PUT/DELETE:  validate(schema) armó req.body con el body validado
   *
   * Pasa el body completo como JSONB al SP — el SP decide qué usar.
   */
  const makeHandler = (opcion: number): RequestHandler =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { message, data } = await callSP(spName, opcion, req.body as Record<string, unknown>);

        const response: ApiResponse = {
          success:   true,
          message,
          data,
          timestamp: new Date().toISOString(),
        };

        res.json(response);
      } catch (err) {
        next(err);
      }
    };

  // ── Rutas estándar ──────────────────────────────────────────────────────────
  router.get('/',    authMiddleware, parseGetParams,   makeHandler(1));
  router.get('/:id', authMiddleware, parseGetParams,   makeHandler(2));
  router.post('/',   authMiddleware, validate(schema), makeHandler(3));
  router.put('/',    authMiddleware, validate(schema), makeHandler(4));
  router.delete('/', authMiddleware, validate(schema), makeHandler(5));

  return router;
}

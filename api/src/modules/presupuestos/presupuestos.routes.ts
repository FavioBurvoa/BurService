import { Router, type Request, type Response, type NextFunction } from 'express';
import { sql } from '../../config/db';
import { authMiddleware } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { callSP } from '../../lib/callSP';
import { PresupuestoSchema, type PresupuestoInput, type DetalleInput, type SubtotalInput } from './presupuestos.schema';
import type { ApiResponse, SpResult } from '../../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Aplana el payload nested → objeto plano para el SP.
 * id_marca NO se envía (el SP lo deriva desde id_modelo).
 */
function flattenPayload(input: PresupuestoInput): Record<string, unknown> {
  const enc = input.encabezado ?? {};
  const v   = enc.vehiculo      ?? {};
  const cli = enc.cliente       ?? {};
  const con = enc.contribuyente ?? {};

  return {
    ...(enc.id             !== undefined && { id:                    enc.id             }),
    ...(enc.id_empresa     !== undefined && { id_empresa:            enc.id_empresa     }),
    ...(enc.folio          !== undefined && { folio:                 enc.folio          }),
    ...(enc.fecha_registro !== undefined && { fecha_registro:        enc.fecha_registro }),
    ...(enc.fecha_presupuesto !== undefined && { fecha_presupuesto:  enc.fecha_presupuesto }),
    ...(enc.fecha_vencimiento !== undefined && { fecha_vencimiento:  enc.fecha_vencimiento }),
    ...(enc.fecha_recepcion   !== undefined && { fecha_recepcion:    enc.fecha_recepcion   }),
    ...(enc.fecha_entrega     !== undefined && { fecha_entrega:      enc.fecha_entrega     }),
    ...(enc.estado              !== undefined && { estado:              enc.estado              }),
    ...(enc.id_tipo_presupuesto !== undefined && { id_tipo_presupuesto: enc.id_tipo_presupuesto }),
    // Vehículo
    ...(v.patente   !== undefined && { patente:    v.patente   }),
    ...(v.id_modelo !== undefined && { id_modelo:  v.id_modelo }),
    ...(v.anio      !== undefined && { anio:       v.anio      }),
    ...(v.color     !== undefined && { color:      v.color     }),
    // Cliente
    ...(cli.rut       !== undefined && { cliente_rut:       cli.rut       }),
    ...(cli.nombre    !== undefined && { cliente_nombre:    cli.nombre    }),
    ...(cli.giro      !== undefined && { cliente_giro:      cli.giro      }),
    ...(cli.id_comuna !== undefined && { cliente_id_comuna: cli.id_comuna }),
    ...(cli.direccion !== undefined && { cliente_direccion: cli.direccion }),
    ...(cli.email     !== undefined && { cliente_email:     cli.email     }),
    ...(cli.telefono  !== undefined && { cliente_telefono:  cli.telefono  }),
    // Contribuyente
    ...(con.rut       !== undefined && { contribuyente_rut:       con.rut       }),
    ...(con.nombre    !== undefined && { contribuyente_nombre:    con.nombre    }),
    ...(con.giro      !== undefined && { contribuyente_giro:      con.giro      }),
    ...(con.id_comuna !== undefined && { contribuyente_id_comuna: con.id_comuna }),
    ...(con.direccion !== undefined && { contribuyente_direccion: con.direccion }),
    // Totales
    ...(enc.neto           !== undefined && { neto:           enc.neto           }),
    ...(enc.exento         !== undefined && { exento:         enc.exento         }),
    ...(enc.porcentaje_iva !== undefined && { porcentaje_iva: enc.porcentaje_iva }),
    ...(enc.iva            !== undefined && { iva:            enc.iva            }),
    ...(enc.bruto          !== undefined && { bruto:          enc.bruto          }),
    ...(enc.sw_facturar    !== undefined && { sw_facturar:    enc.sw_facturar    }),
    ...(enc.sw_mismo_cliente !== undefined && { sw_mismo_cliente: enc.sw_mismo_cliente }),
    ...(enc.observacion    !== undefined && { observacion:    enc.observacion    }),
  };
}

/**
 * Reconstruye el payload nested desde la fila plana que devuelve el SP opcion 2.
 * DB columna 'monto' → campo app 'subtotal'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reconstructPayload(flat: any): object {
  return {
    encabezado: {
      id:                  flat.id,
      id_empresa:          flat.id_empresa,
      numero:              flat.numero,
      folio:               flat.folio,
      fecha_registro:      flat.fecha_registro,
      fecha_presupuesto:   flat.fecha_presupuesto,
      fecha_vencimiento:   flat.fecha_vencimiento,
      fecha_recepcion:     flat.fecha_recepcion,
      fecha_entrega:       flat.fecha_entrega,
      estado:              flat.estado,
      id_tipo_presupuesto: flat.id_tipo_presupuesto,
      porcentaje_iva:      flat.porcentaje_iva,
      neto:                flat.neto,
      exento:              flat.exento,
      iva:                 flat.iva,
      bruto:               flat.bruto,
      sw_facturar:         flat.sw_facturar,
      sw_mismo_cliente:    flat.sw_mismo_cliente,
      observacion:         flat.observacion ?? null,
      vehiculo: {
        patente:   flat.patente,
        id_marca:  flat.id_marca,
        marca:     flat.marca,
        id_modelo: flat.id_modelo,
        modelo:    flat.modelo,
        anio:      flat.anio,
        color:     flat.color,
      },
      cliente: {
        rut:       flat.cliente_rut,
        nombre:    flat.cliente_nombre,
        giro:      flat.cliente_giro,
        id_region: flat.cliente_id_region,
        id_comuna: flat.cliente_id_comuna,
        direccion: flat.cliente_direccion,
        email:     flat.cliente_email,
        telefono:  flat.cliente_telefono,
      },
      contribuyente: flat.contribuyente_rut ? {
        rut:       flat.contribuyente_rut,
        nombre:    flat.contribuyente_nombre,
        giro:      flat.contribuyente_giro,
        id_region: flat.contribuyente_id_region,
        id_comuna: flat.contribuyente_id_comuna,
        direccion: flat.contribuyente_direccion,
      } : null,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detalles: (flat.detalles ?? []) as any[],
    subtotales: (flat.subtotales ?? []).map((s: { monto: number; [k: string]: unknown }) => ({
      ...s,
      subtotal: s.monto,
    })),
  };
}

/** Respuesta estándar exitosa. */
function ok(res: Response, message: string, data: unknown): void {
  const response: ApiResponse = {
    success:   true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
}

// ─── Router ─────────────────────────────────────────────────────────────────

export const presupuestosRouter = Router();

// ── GET / — Lista por empresa ──────────────────────────────────────────────
presupuestosRouter.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idEmpresa = Number(req.query['id_empresa']);
      if (!idEmpresa || isNaN(idEmpresa)) {
        res.status(400).json({ success: false, message: 'id_empresa requerido', data: null, timestamp: new Date().toISOString() });
        return;
      }
      const { message, data } = await callSP('sp_presupuestos', 1, {
        id_empresa:   idEmpresa,
        estado:       req.query['estado']       ?? null,
        fecha_desde:  req.query['fecha_desde']  ?? null,
        fecha_hasta:  req.query['fecha_hasta']  ?? null,
      });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /lookup/patente/:patente ───────────────────────────────────────────
presupuestosRouter.get(
  '/lookup/patente/:patente',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, data } = await callSP('sp_presupuestos', 6, { patente: req.params['patente'] });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /lookup/rut/:rut ───────────────────────────────────────────────────
presupuestosRouter.get(
  '/lookup/rut/:rut',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, data } = await callSP('sp_presupuestos', 7, { rut: req.params['rut'] });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /config/:id_tipo ───────────────────────────────────────────────────
presupuestosRouter.get(
  '/config/:id_tipo',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, data } = await callSP('sp_presupuestos', 8, {
        id_tipo_presupuesto: Number(req.params['id_tipo']),
      });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /:id/documento — Datos completos para generación de PDF ────────────
presupuestosRouter.get(
  '/:id/documento',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, data } = await callSP('sp_presupuestos', 9, {
        id: Number(req.params['id']),
      });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /lookup/numero — Lookup por código de empresa + número presupuesto ─
presupuestosRouter.get(
  '/lookup/numero',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const codigoEmpresa = String(req.query['codigo_empresa'] ?? '').trim();
      const numero = Number(req.query['numero']);
      if (!codigoEmpresa || !numero || isNaN(numero)) {
        res.status(400).json({ success: false, message: 'codigo_empresa y numero requeridos', data: null, timestamp: new Date().toISOString() });
        return;
      }
      const { message, data } = await callSP('sp_presupuestos', 10, { codigo_empresa: codigoEmpresa, numero });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /:id ───────────────────────────────────────────────────────────────
presupuestosRouter.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, data } = await callSP<Record<string, unknown>>('sp_presupuestos', 2, {
        id: Number(req.params['id']),
      });
      ok(res, message, reconstructPayload(data));
    } catch (err) {
      next(err);
    }
  },
);

// ── POST / — Crear ─────────────────────────────────────────────────────────
presupuestosRouter.post(
  '/',
  authMiddleware,
  validate(PresupuestoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input    = req.body as PresupuestoInput;
      const flatData = flattenPayload(input);
      const detalles: DetalleInput[]   = input.detalles   ?? [];
      const subtotales: SubtotalInput[] = input.subtotales ?? [];

      let idNuevo!: number;

      await sql.begin(async (tx) => {
        // 1. Insertar cabecera + upsert vehículo/cliente/contribuyente
        const rows = await tx`
          SELECT sp_presupuestos(3::integer, ${tx.json(flatData)}::jsonb) AS result
        `;
        const spResult = rows[0]?.result as SpResult<{ id: number }>;
        idNuevo = spResult.data.id;

        // 2. Insertar detalles
        for (const d of detalles) {
          await tx`
            INSERT INTO presupuesto_detalles
              (id_presupuesto, id_tipo_detalle, orden, descripcion, sw_exento, cantidad, valor, total)
            VALUES (
              ${idNuevo},
              ${d.id_tipo_detalle ?? null},
              ${d.orden           ?? 1},
              ${d.descripcion     ?? ''},
              ${d.sw_exento       ?? false},
              ${d.cantidad        ?? 1},
              ${d.valor           ?? 0},
              ${d.total           ?? 0}
            )
          `;
        }

        // 3. Insertar subtotales
        for (const s of subtotales) {
          await tx`
            INSERT INTO presupuesto_subtotales
              (id_presupuesto, orden, codigo_subtotal, nombre_subtotal, monto)
            VALUES (
              ${idNuevo},
              ${s.orden           ?? 1},
              ${s.codigo_subtotal ?? ''},
              ${s.nombre_subtotal ?? ''},
              ${s.subtotal        ?? 0}
            )
          `;
        }
      });

      // 4. Retornar registro completo
      const { message, data } = await callSP<Record<string, unknown>>('sp_presupuestos', 2, { id: idNuevo });
      ok(res, message, reconstructPayload(data));
    } catch (err) {
      next(err);
    }
  },
);

// ── PUT / — Actualizar ─────────────────────────────────────────────────────
presupuestosRouter.put(
  '/',
  authMiddleware,
  validate(PresupuestoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input    = req.body as PresupuestoInput;
      const flatData = flattenPayload(input);
      const idPres   = input.encabezado?.id;
      const detalles: DetalleInput[]   = input.detalles   ?? [];
      const subtotales: SubtotalInput[] = input.subtotales ?? [];

      if (!idPres) {
        res.status(400).json({ success: false, message: 'id requerido en encabezado', data: null, timestamp: new Date().toISOString() });
        return;
      }

      await sql.begin(async (tx) => {
        // 1. Actualizar cabecera
        await tx`
          SELECT sp_presupuestos(4::integer, ${tx.json(flatData)}::jsonb) AS result
        `;

        // 2. Reemplazar detalles
        await tx`DELETE FROM presupuesto_detalles WHERE id_presupuesto = ${idPres}`;
        for (const d of detalles) {
          await tx`
            INSERT INTO presupuesto_detalles
              (id_presupuesto, id_tipo_detalle, orden, descripcion, sw_exento, cantidad, valor, total)
            VALUES (
              ${idPres},
              ${d.id_tipo_detalle ?? null},
              ${d.orden           ?? 1},
              ${d.descripcion     ?? ''},
              ${d.sw_exento       ?? false},
              ${d.cantidad        ?? 1},
              ${d.valor           ?? 0},
              ${d.total           ?? 0}
            )
          `;
        }

        // 3. Reemplazar subtotales
        await tx`DELETE FROM presupuesto_subtotales WHERE id_presupuesto = ${idPres}`;
        for (const s of subtotales) {
          await tx`
            INSERT INTO presupuesto_subtotales
              (id_presupuesto, orden, codigo_subtotal, nombre_subtotal, monto)
            VALUES (
              ${idPres},
              ${s.orden           ?? 1},
              ${s.codigo_subtotal ?? ''},
              ${s.nombre_subtotal ?? ''},
              ${s.subtotal        ?? 0}
            )
          `;
        }
      });

      // 4. Retornar registro actualizado
      const { message, data } = await callSP<Record<string, unknown>>('sp_presupuestos', 2, { id: idPres });
      ok(res, message, reconstructPayload(data));
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE / — Eliminar ────────────────────────────────────────────────────
presupuestosRouter.delete(
  '/',
  authMiddleware,
  validate(PresupuestoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as PresupuestoInput;
      const id        = input.encabezado?.id;
      const idEmpresa = input.encabezado?.id_empresa;
      if (!id || !idEmpresa) {
        res.status(400).json({ success: false, message: 'id e id_empresa requeridos', data: null, timestamp: new Date().toISOString() });
        return;
      }
      const { message, data } = await callSP('sp_presupuestos', 5, { id, id_empresa: idEmpresa });
      ok(res, message, data);
    } catch (err) {
      next(err);
    }
  },
);

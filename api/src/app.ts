import express from 'express';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import { marcasRouter } from './modules/vehiculos/marcas/marcas.routes';
import { modelosRouter } from './modules/vehiculos/modelos/modelos.routes';
import { tiposVehiculoRouter } from './modules/vehiculos/tipos-vehiculo/tipos-vehiculo.routes';
import { vehiculosRouter } from './modules/vehiculos/vehiculos/vehiculos.routes';
import { regionesRouter } from './modules/clientes/regiones/regiones.routes';
import { comunasRouter } from './modules/clientes/comunas/comunas.routes';
import { tiposContribuyenteRouter } from './modules/clientes/tipos-contribuyente/tipos-contribuyente.routes';
import { contribuyentesRouter } from './modules/clientes/contribuyentes/contribuyentes.routes';
import { empresasRouter } from './modules/empresas/empresas/empresas.routes';
import { tiposDteRouter } from './modules/empresas/tipos-dte/tipos-dte.routes';
import { certificadosDteRouter } from './modules/empresas/certificados-dte/certificados-dte.routes';
import { foliosCafRouter } from './modules/empresas/folios-caf/folios-caf.routes';
import { tiposPresupuestoRouter } from './modules/empresas/tipos-presupuesto/tipos-presupuesto.routes';
import { tiposPresupuestoDetallesRouter } from './modules/empresas/tipos-presupuesto-detalles/tipos-presupuesto-detalles.routes';
import { empresaLogoRouter } from './modules/empresas/empresa-logo/empresa-logo.routes';
import { presupuestosRouter } from './modules/presupuestos/presupuestos.routes';
import type { ApiResponse } from './types';

export const app = express();

// ─── 1. Logging ─────────────────────────────────────────────────────────────
// pino-http registra cada request automáticamente y agrega req.log
app.use(pinoHttp({ logger }));

// ─── 2. Security headers ─────────────────────────────────────────────────────
app.use(helmet());

// ─── 3. CORS ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ─── 4. Rate limiting ────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs:       15 * 60 * 1000, // ventana de 15 minutos
    max:            100,             // máximo 100 requests por IP
    standardHeaders: true,
    legacyHeaders:  false,
  }),
);

// ─── 5. Body parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));

// ─── Health check (sin auth) ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const response: ApiResponse = {
    success:   true,
    message:   'API funcionando correctamente',
    data:      { status: 'ok' },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// ─── Rutas ───────────────────────────────────────────────────────────────────
// URLs consistentes con la app Next.js para facilitar la migración del mock
// Vehiculos
app.use('/api/marcas',                        marcasRouter);
app.use('/api/modelos',                       modelosRouter);
app.use('/api/tipos-vehiculo',                tiposVehiculoRouter);
app.use('/api/vehiculos',                     vehiculosRouter);
// Clientes
app.use('/api/regiones',                      regionesRouter);
app.use('/api/comunas',                       comunasRouter);
app.use('/api/tipos-contribuyente',           tiposContribuyenteRouter);
app.use('/api/contribuyentes',                contribuyentesRouter);
// Empresas
app.use('/api/empresas',                      empresasRouter);
app.use('/api/tipos-dte',                     tiposDteRouter);
app.use('/api/certificados-dte',              certificadosDteRouter);
app.use('/api/folios-caf',                    foliosCafRouter);
app.use('/api/tipos-presupuesto',             tiposPresupuestoRouter);
app.use('/api/tipos-presupuesto-detalles',    tiposPresupuestoDetallesRouter);
app.use('/api/empresa-logo',                  empresaLogoRouter);
// Presupuestos
app.use('/api/presupuestos',                  presupuestosRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  const response: ApiResponse = {
    success:   false,
    message:   'Ruta no encontrada',
    data:      null,
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
});

// ─── Error handler global ────────────────────────────────────────────────────
// Debe ir al final, después de todas las rutas
app.use(errorHandler);

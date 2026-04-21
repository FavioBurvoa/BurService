// ============================================================================
// BULK HANDLER — Factories para rutas Next.js de export / import (preview)
//
// Un route.ts de mantenedor simple queda como una sola línea:
//
//   // src/app/api/marcas/export/route.ts
//   export const GET = makeExportHandler({ nodePath: '/marcas', template: 'marcas-lista', filename: 'marcas.xlsx' });
//
//   // src/app/api/marcas/import/preview/route.ts
//   export const POST = makeImportPreviewHandler({ nodePath: '/marcas' });
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

const REPORTE_SVC_URL = process.env.REPORTE_SVC_URL;

// ─── EXPORT ──────────────────────────────────────────────────────────────────
//
// Flujo:
//   1. Node API GET {nodePath}/export  → ApiResponse<T[]>  (respeta contextField si aplica)
//   2. reporte-svc POST /render con { template, formato: 'xlsx', data }
//   3. stream xlsx al cliente
//
// Query params soportados:
//   ?formato=xlsx|pdf   (default xlsx)
//   ?empty=true         → envía data=[] (template vacío para import)
//   + cualquier contextField (ej: ?id_empresa=1)
// ─────────────────────────────────────────────────────────────────────────────

interface ExportConfig {
  /** Ruta base del entity en Node API, ej: '/marcas'. Se agrega '/export'. */
  nodePath: string;
  /** Nombre del template registrado en reporte-svc. */
  template: string;
  /** Nombre del archivo descargado (sin extensión — se agrega según formato). */
  filename: string;
  /** Campo de contexto que se reenvía al Node API si viene en query params. */
  contextField?: string;
}

export function makeExportHandler(cfg: ExportConfig) {
  return async function GET(req: NextRequest): Promise<NextResponse> {
    if (!REPORTE_SVC_URL) {
      return NextResponse.json(
        { success: false, message: 'REPORTE_SVC_URL no está configurada' },
        { status: 500 },
      );
    }

    const sp      = req.nextUrl.searchParams;
    const formato = sp.get('formato') ?? 'xlsx';
    const empty   = sp.get('empty') === 'true';

    let rows: unknown[] = [];

    if (!empty) {
      const params: Record<string, string> = {};
      if (cfg.contextField) {
        const v = sp.get(cfg.contextField);
        if (v) params[cfg.contextField] = v;
      }

      const apiResp = await apiFetch<unknown[]>(`${cfg.nodePath}/export`, { params }).catch(
        (e: unknown) => ({
          success:   false,
          message:   e instanceof Error ? e.message : 'Error al obtener datos',
          data:      null,
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse<unknown[]>),
      );

      if (!apiResp.success) {
        return NextResponse.json(
          { success: false, message: apiResp.message },
          { status: 502 },
        );
      }

      rows = Array.isArray(apiResp.data) ? apiResp.data : [];
    }

    const renderRes = await fetch(`${REPORTE_SVC_URL}/render`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ template: cfg.template, formato, data: rows }),
    });

    if (!renderRes.ok) {
      const err = await renderRes.json().catch(() => ({ message: 'Error en reporte-svc' }));
      return NextResponse.json(
        { success: false, message: err.message ?? 'Error al generar archivo' },
        { status: 502 },
      );
    }

    const buffer      = await renderRes.arrayBuffer();
    const ext         = formato === 'pdf' ? 'pdf' : 'xlsx';
    const contentType = formato === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': `attachment; filename="${cfg.filename}${empty ? '-plantilla' : ''}.${ext}"`,
      },
    });
  };
}

// ─── IMPORT PREVIEW ──────────────────────────────────────────────────────────
//
// Flujo:
//   1. Cliente envía FormData { file: File }
//   2. File → base64 → reporte-svc POST /render/parse → { sheets }
//   3. Primera hoja → rows → inyectar contextField si aplica → Node API POST {nodePath}/resolve
//   4. Retornar rows resueltas al cliente
//
// Form fields soportados:
//   file            — xlsx (requerido)
//   <contextField>  — valor del contexto a inyectar en cada fila (opcional)
// ─────────────────────────────────────────────────────────────────────────────

interface ImportPreviewConfig {
  nodePath:      string;
  contextField?: string;
  /**
   * Mapeo de header xlsx (normalizado: lowercase sin acentos) → nombre de campo
   * que espera el resolver. Si un header no está en el mapa, se pasa tal cual
   * (ya normalizado). Ej: { 'tipo contribuyente': 'id_tipo_contribuyente' }.
   */
  headerMap?: Record<string, string>;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function remapRow(
  row: Record<string, unknown>,
  headerMap?: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const normalized = normalizeHeader(k);
    const field      = headerMap?.[normalized] ?? normalized;
    out[field] = v;
  }
  return out;
}

export function makeImportPreviewHandler(cfg: ImportPreviewConfig) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    if (!REPORTE_SVC_URL) {
      return NextResponse.json(
        { success: false, message: 'REPORTE_SVC_URL no está configurada' },
        { status: 500 },
      );
    }

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { success: false, message: 'FormData inválido' },
        { status: 400 },
      );
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Archivo requerido en campo "file"' },
        { status: 400 },
      );
    }

    const contextValue = cfg.contextField ? form.get(cfg.contextField) : null;
    if (cfg.contextField && (!contextValue || typeof contextValue !== 'string')) {
      return NextResponse.json(
        { success: false, message: `${cfg.contextField} requerido para import con contexto` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64      = Buffer.from(arrayBuffer).toString('base64');

    const parseRes = await fetch(`${REPORTE_SVC_URL}/render/parse`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ file: base64 }),
    });

    if (!parseRes.ok) {
      const err = await parseRes.json().catch(() => ({ message: 'Error parseando archivo' }));
      return NextResponse.json(
        { success: false, message: err.message ?? 'Error parseando archivo' },
        { status: 502 },
      );
    }

    const parseData = await parseRes.json() as { success: boolean; data?: { sheets: Array<{ name: string; headers: string[]; rows: Record<string, unknown>[] }> }; message?: string };
    if (!parseData.success || !parseData.data?.sheets?.length) {
      return NextResponse.json(
        { success: false, message: parseData.message ?? 'Archivo sin contenido' },
        { status: 400 },
      );
    }

    const sheet = parseData.data.sheets[0];
    const mapped = sheet.rows.map((r) => remapRow(r, cfg.headerMap));
    const rows   = cfg.contextField
      ? mapped.map((r) => ({ ...r, [cfg.contextField!]: Number(contextValue) }))
      : mapped;

    const resolveResp = await apiFetch(`${cfg.nodePath}/resolve`, {
      method: 'POST',
      body:   { rows },
    }).catch((e: unknown) => ({
      success:   false,
      message:   e instanceof Error ? e.message : 'Error al resolver',
      data:      null,
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse<unknown>));

    return NextResponse.json(resolveResp, {
      status: resolveResp.success ? 200 : 502,
    });
  };
}

// ============================================================================
// API ROUTE — PROXY DE REPORTES
// GET /api/reportes/[nombre]?...params
//
// Flujo general (reportes tabulares):
//   1. Obtiene datos del Node API (apiFetch — autenticado)
//   2. Transforma datos según el reporte (buildRequest)
//   3. Envía data + options al reporte-svc → xlsx o pdf
//   4. Retorna buffer al cliente
//
// Flujo especial (presupuesto-documento):
//   1. Llama a Node API GET /presupuestos/:id/documento (una sola llamada)
//      → retorna empresa + encabezado + cliente + vehiculo + grupos + subtotales
//   2. Envía ese objeto al reporte-svc (template=presupuesto-documento)
//      → reporte-svc genera HTML y llama a Gotenberg Chromium internamente
//   3. Retorna PDF al cliente
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

const REPORTE_SVC_URL = process.env.REPORTE_SVC_URL;

// ─── Tipos (reportes tabulares) ───────────────────────────────────────────────

interface RenderPayload {
  data:     unknown[];
  options?: Record<string, unknown>;
}

interface ReporteConfig {
  fetchData:    (p: URLSearchParams) => Promise<ApiResponse<unknown>>;
  template:     string;
  buildRequest: (rawData: unknown) => RenderPayload;
  filename:     (p: URLSearchParams) => string;
}

function pickParams(sp: URLSearchParams, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = sp.get(k);
    if (v) out[k] = v;
  }
  return out;
}

// ─── Config reportes tabulares ────────────────────────────────────────────────

const REPORTES: Record<string, ReporteConfig> = {

  'presupuestos-lista': {
    fetchData:    (p) => apiFetch('/presupuestos', {
      params: pickParams(p, ['id_empresa', 'estado', 'fecha_desde', 'fecha_hasta']),
    }),
    template:     'presupuestos-lista',
    buildRequest: (d) => ({ data: Array.isArray(d) ? d : [] }),
    filename:     () => 'lista-presupuestos.pdf',
  },

  'seguimiento-cliente': {
    fetchData:    (p) => apiFetch('/presupuestos', {
      params: pickParams(p, ['id_empresa', 'estado', 'fecha_desde', 'fecha_hasta']),
    }),
    template:     'seguimiento-cliente',
    buildRequest: (d) => ({ data: Array.isArray(d) ? d : [] }),
    filename:     () => 'seguimiento-clientes.pdf',
  },

  'hoja-vida-vehiculo': {
    fetchData:    (p) => apiFetch('/presupuestos', {
      params: pickParams(p, ['id_empresa', 'patente', 'fecha_desde', 'fecha_hasta']),
    }),
    template:     'hoja-vida-vehiculo',
    buildRequest: (d) => ({ data: Array.isArray(d) ? d : [] }),
    filename:     (p) => `hoja-vida-${p.get('patente') ?? 'vehiculo'}.pdf`,
  },

};

// ─── Handler especial: presupuesto-documento ──────────────────────────────────

async function handlePresupuestoDocumento(
  sp: URLSearchParams,
): Promise<NextResponse> {
  if (!REPORTE_SVC_URL) {
    return NextResponse.json(
      { success: false, message: 'REPORTE_SVC_URL no está configurada' },
      { status: 500 },
    );
  }

  const id = sp.get('id');
  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Parámetro id requerido' },
      { status: 400 },
    );
  }

  const formato = sp.get('formato') ?? 'pdf';

  try {
    // 1. Una sola llamada al Node API — retorna todo lo necesario para el documento
    const docResp = await apiFetch(`/presupuestos/${id}/documento`);
    if (!docResp.success || !docResp.data) {
      return NextResponse.json(
        { success: false, message: docResp.message ?? 'Error al obtener documento' },
        { status: 502 },
      );
    }

    // 2. Enviar al reporte-svc → genera HTML → Gotenberg → PDF (o HTML directo)
    const renderRes = await fetch(`${REPORTE_SVC_URL}/render`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ template: 'presupuesto-documento-v3', formato, data: docResp.data }),
    });

    if (!renderRes.ok) {
      const err = await renderRes.json().catch(() => ({ message: 'Error en reporte-svc' }));
      return NextResponse.json(
        { success: false, message: err.message ?? 'Error al generar PDF' },
        { status: 502 },
      );
    }

    const buffer = await renderRes.arrayBuffer();
    const isHtml = formato === 'html';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        isHtml ? 'text/html; charset=utf-8' : 'application/pdf',
        'Content-Disposition': `attachment; filename="presupuesto-${id}.${isHtml ? 'html' : 'pdf'}"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 502 },
    );
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nombre: string }> },
) {
  const { nombre } = await params;

  // Caso especial: presupuesto individual → Node API (opcion 9) → reporte-svc → PDF
  if (nombre === 'presupuesto-documento') {
    return handlePresupuestoDocumento(req.nextUrl.searchParams);
  }

  // Reportes tabulares → reporte-svc → xlsx / pdf
  if (!REPORTE_SVC_URL) {
    return NextResponse.json(
      { success: false, message: 'REPORTE_SVC_URL no está configurada' },
      { status: 500 },
    );
  }

  const config = REPORTES[nombre];
  if (!config) {
    return NextResponse.json(
      { success: false, message: `Reporte '${nombre}' no encontrado` },
      { status: 404 },
    );
  }

  const sp = req.nextUrl.searchParams;

  // 1. Obtener datos desde Node API
  const apiResp = await config.fetchData(sp).catch((e: unknown) => {
    throw new Error(e instanceof Error ? e.message : 'Error al obtener datos');
  });

  if (!apiResp.success) {
    return NextResponse.json(
      { success: false, message: apiResp.message },
      { status: 502 },
    );
  }

  // 2. Transformar datos
  const { data, options } = config.buildRequest(apiResp.data);
  const formato           = sp.get('formato') ?? 'pdf';

  // 3. Enviar a reporte-svc
  const renderRes = await fetch(`${REPORTE_SVC_URL}/render`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ template: config.template, formato, data, options }),
  });

  if (!renderRes.ok) {
    const err = await renderRes.json().catch(() => ({ message: 'Error en reporte-svc' }));
    return NextResponse.json(
      { success: false, message: err.message ?? 'Error al generar reporte' },
      { status: 502 },
    );
  }

  // 4. Retornar buffer al cliente
  const buffer      = await renderRes.arrayBuffer();
  const contentType = formato === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${config.filename(sp)}"`,
    },
  });
}

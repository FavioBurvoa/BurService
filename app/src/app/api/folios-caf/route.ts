// ============================================================================
// API ROUTE — FOLIOS CAF
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface FolioCaf {
  id: number;
  id_empresa: number;
  id_tipo_dte: number;
  folio_desde: number;
  folio_hasta: number;
  nombre_archivo: string;
  mime_type: string;
  fecha_vencimiento: string | null;
  archivo_caf: string;
  activo: boolean;
}

// ── GET — Listar por empresa ──────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idEmpresa = searchParams.get('id_empresa');
    const url = idEmpresa ? `/folios-caf?id_empresa=${idEmpresa}` : '/folios-caf';
    const data = await apiFetch<FolioCaf[]>(url);
    return NextResponse.json(data);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al conectar con el servidor',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: FolioCaf = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<FolioCaf>('/folios-caf', { method, body });
    return NextResponse.json(data);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al procesar la solicitud',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: FolioCaf[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/folios-caf', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} folio${items.length > 1 ? 's' : ''} CAF eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar folios CAF',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

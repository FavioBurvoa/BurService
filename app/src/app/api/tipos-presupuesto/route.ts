// ============================================================================
// API ROUTE — TIPOS PRESUPUESTO
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface TipoPresupuesto {
  id: number;
  id_empresa: number;
  codigo: string;
  descripcion: string;
  id_tipo_dte: number | null;
  activo: boolean;
}

// ── GET — Listar por empresa ──────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idEmpresa = searchParams.get('id_empresa');
    const url = idEmpresa ? `/tipos-presupuesto?id_empresa=${idEmpresa}` : '/tipos-presupuesto';
    const data = await apiFetch<TipoPresupuesto[]>(url);
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
    const body: TipoPresupuesto = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<TipoPresupuesto>('/tipos-presupuesto', { method, body });
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
    const items: TipoPresupuesto[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/tipos-presupuesto', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} tipo${items.length > 1 ? 's' : ''} de presupuesto eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar tipos de presupuesto',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

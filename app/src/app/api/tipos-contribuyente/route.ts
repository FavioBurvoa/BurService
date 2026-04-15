// ============================================================================
// API ROUTE — TIPOS CONTRIBUYENTE
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface TipoContribuyente {
  id: number;
  codigo: string;
  descripcion: string;
  sw_factura: boolean;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<TipoContribuyente[]>('/tipos-contribuyente');
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: TipoContribuyente = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<TipoContribuyente>('/tipos-contribuyente', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: TipoContribuyente[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/tipos-contribuyente', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} tipo${items.length > 1 ? 's' : ''} contribuyente eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

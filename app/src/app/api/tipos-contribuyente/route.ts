// ============================================================================
// API ROUTE — TIPOS CONTRIBUYENTE
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
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
    const body: TipoContribuyente = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<TipoContribuyente>('/tipos-contribuyente', { method, body });
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
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar tipos contribuyente',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

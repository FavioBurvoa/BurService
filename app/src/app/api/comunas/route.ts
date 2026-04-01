// ============================================================================
// API ROUTE — COMUNAS
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface Comuna {
  id: number;
  id_region: number;
  codigo: string;
  descripcion: string;
  orden: number;
  codigo_sii: string | null;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<Comuna[]>('/comunas');
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
    const body: Comuna = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<Comuna>('/comunas', { method, body });
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
    const items: Comuna[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/comunas', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} comuna${items.length > 1 ? 's' : ''} eliminada${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar comunas',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

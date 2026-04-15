// ============================================================================
// API ROUTE — EMPRESAS
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface Empresa {
  id: number;
  codigo: string;
  rut: string;
  razon_social: string;
  nombre_fantasia: string | null;
  giro: string | null;
  act_eco: string | null;
  id_region: number;
  id_comuna: number | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  numero_resolucion_sii: number | null;
  fecha_resolucion_sii: string | null;
  ambiente: number;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<Empresa[]>('/empresas');
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: Empresa = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<Empresa>('/empresas', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: Empresa[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/empresas', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} empresa${items.length > 1 ? 's' : ''} eliminada${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

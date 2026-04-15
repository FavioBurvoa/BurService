// ============================================================================
// API ROUTE — CONTRIBUYENTES
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface Contribuyente {
  id: number;
  rut: string;
  nombre: string;
  apellidos: string;
  id_tipo_contribuyente: number[];
  giro: string | null;
  id_region: number;
  id_comuna: number | null;
  direccion: string | null;
  email: string | null;
  telefono: string | null;
  telefono2: string | null;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<Contribuyente[]>('/contribuyentes');
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: Contribuyente = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<Contribuyente>('/contribuyentes', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: Contribuyente[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/contribuyentes', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} contribuyente${items.length > 1 ? 's' : ''} eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

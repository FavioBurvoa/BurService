// ============================================================================
// API ROUTE — VEHÍCULOS
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface Vehiculo {
  id: number;
  ppu: string;
  id_marca: number;
  id_modelo: number;
  anio: number | null;
  color: string;
  id_tipo_vehiculo: number | null;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<Vehiculo[]>('/vehiculos');
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── POST — Crear o actualizar ─────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body: Vehiculo = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<Vehiculo>('/vehiculos', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

// ── DELETE — Eliminar uno o varios ───────────────────────────────────────────

export async function DELETE(request: Request) {
  try {
    const items: Vehiculo[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/vehiculos', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} vehículo${items.length > 1 ? 's' : ''} eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

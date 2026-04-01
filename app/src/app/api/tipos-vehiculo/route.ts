// ============================================================================
// API ROUTE — TIPOS DE VEHÍCULO
// Proxy autenticado hacia el Node API (bur-service-api).
// Tabla global — no requiere empresa_id.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface TipoVehiculo {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

// ── GET — Listar todos ────────────────────────────────────────────────────────

export async function GET() {
  try {
    const data = await apiFetch<TipoVehiculo[]>('/tipos-vehiculo');
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
// Si el body trae id → PUT (actualizar), si no → POST (insertar)

export async function POST(request: Request) {
  try {
    const body: TipoVehiculo = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<TipoVehiculo>('/tipos-vehiculo', { method, body });
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
// El mantenedor envía un array de registros completos.
// El Node API elimina de a uno — se itera y se retorna el resultado final.

export async function DELETE(request: Request) {
  try {
    const items: TipoVehiculo[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/tipos-vehiculo', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      // Si uno falla, detener y retornar el error
      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} tipo${items.length > 1 ? 's' : ''} de vehículo eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar tipos de vehículo',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

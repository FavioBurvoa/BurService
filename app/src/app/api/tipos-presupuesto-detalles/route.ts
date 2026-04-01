// ============================================================================
// API ROUTE — TIPOS PRESUPUESTO DETALLES
// Proxy autenticado hacia el Node API.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface TipoPresupuestoDetalle {
  id: number;
  id_tipo_presupuesto: number;
  codigo: string;
  descripcion: string;
  orden: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  ver_cantidad: boolean;
  ver_valor: boolean;
  ver_total: boolean;
  activo: boolean;
}

// ── GET — Listar por tipo de presupuesto ──────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idTipo = searchParams.get('id_tipo_presupuesto');
    const url = idTipo
      ? `/tipos-presupuesto-detalles?id_tipo_presupuesto=${idTipo}`
      : '/tipos-presupuesto-detalles';
    const data = await apiFetch<TipoPresupuestoDetalle[]>(url);
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
    const body: TipoPresupuestoDetalle = await request.json();
    const method = body.id ? 'PUT' : 'POST';

    const data = await apiFetch<TipoPresupuestoDetalle>('/tipos-presupuesto-detalles', { method, body });
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
    const items: TipoPresupuestoDetalle[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/tipos-presupuesto-detalles', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} detalle${items.length > 1 ? 's' : ''} eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al eliminar detalles',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

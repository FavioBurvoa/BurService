// ============================================================================
// API ROUTE — PRESUPUESTO POR ID
// Proxy autenticado hacia el Node API.
// GET: obtener presupuesto completo (encabezado + detalles + subtotales)
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await apiFetch(`/presupuestos/${id}`);
    return NextResponse.json(data);
  } catch {
    const response: ApiResponse = {
      success:   false,
      message:   'Error al obtener el presupuesto',
      data:      null,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ============================================================================
// API ROUTE — PRESUPUESTO POR ID
// Proxy autenticado hacia el Node API.
// GET: obtener presupuesto completo (encabezado + detalles + subtotales)
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await apiFetch(`/presupuestos/${id}`);
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

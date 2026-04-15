// ============================================================================
// API ROUTE — CONFIG TIPO PRESUPUESTO
// Combina detalles del tipo (endpoint existente) con porcentaje_iva de empresa.
// No depende del nuevo presupuestosRouter — usa infraestructura ya disponible.
// ============================================================================

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';
import type { TipoPresupuestoConfig, TipoDetalleConfig } from '@/components/transaccion/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const idEmpresa = searchParams.get('id_empresa');

    // 1. Obtener detalles del tipo de presupuesto (endpoint existente)
    const detallesRes = await apiFetch<TipoDetalleConfig[]>(
      `/tipos-presupuesto-detalles?id_tipo_presupuesto=${id}`
    );

    if (!detallesRes.success) {
      return NextResponse.json(detallesRes, { status: 400 });
    }

    const detalles = (detallesRes.data ?? []).filter((d) => (d as TipoDetalleConfig & { activo?: boolean }).activo !== false);

    let porcentajeIva = 19;

    // 2. Si se envía id_empresa, obtener porcentaje_iva real
    if (idEmpresa) {
      const empresaRes = await apiFetch<{ porcentaje_iva?: number }>(`/empresas/${idEmpresa}`);
      if (empresaRes.success && empresaRes.data?.porcentaje_iva != null) {
        porcentajeIva = empresaRes.data.porcentaje_iva;
      }
    }

    const response: ApiResponse<TipoPresupuestoConfig> = {
      success:   true,
      message:   'Configuración obtenida correctamente',
      data:      { porcentaje_iva: porcentajeIva, detalles },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response);
  } catch (err) {
    return handleRouteError(err);
  }
}

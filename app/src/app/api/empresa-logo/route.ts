// TODO: GET/POST/DELETE ${process.env.API_URL}/empresa-logo

import { NextResponse } from 'next/server';
import { apiFetch, handleRouteError } from '@/lib/apiClient';
import type { ApiResponse } from '@/components/mantenedor/types';

interface EmpresaLogo {
  id?:            number;
  id_empresa?:    number;
  tipo?:          string;
  nombre_archivo?: string;
  mime_type?:     string;
  archivo?:       string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id_empresa = searchParams.get('id_empresa');
    const id         = searchParams.get('id');

    const path = id
      ? `/empresa-logo/${id}`
      : `/empresa-logo${id_empresa ? `?id_empresa=${id_empresa}` : ''}`;

    const data = await apiFetch<EmpresaLogo[]>(path);
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body: EmpresaLogo = await request.json();
    const method = body.id ? 'PUT' : 'POST';
    const data = await apiFetch<EmpresaLogo>('/empresa-logo', { method, body });
    return NextResponse.json(data);
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const items: EmpresaLogo[] = await request.json();

    let lastResult: ApiResponse<unknown> = {
      success:   true,
      message:   '',
      data:      null,
      timestamp: new Date().toISOString(),
    };

    for (const item of items) {
      lastResult = await apiFetch('/empresa-logo', {
        method: 'DELETE',
        body:   { id: item.id },
      });

      if (!lastResult.success) {
        return NextResponse.json(lastResult, { status: 400 });
      }
    }

    return NextResponse.json({
      ...lastResult,
      message: `${items.length} logo${items.length > 1 ? 's' : ''} eliminado${items.length > 1 ? 's' : ''} correctamente`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

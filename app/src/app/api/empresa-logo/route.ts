// TODO: GET/POST/DELETE ${process.env.API_URL}/empresa-logo

import { NextResponse } from 'next/server';
import { apiFetch }     from '@/lib/apiClient';

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: EmpresaLogo = await request.json();
    const method = body.id ? 'PUT' : 'POST';
    const data = await apiFetch<EmpresaLogo>('/empresa-logo', { method, body });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const data = await apiFetch<EmpresaLogo>(`/empresa-logo?ids=${ids}`, { method: 'DELETE' });
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: msg, data: null }, { status: 500 });
  }
}

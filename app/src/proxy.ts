// ============================================================================
// PROXY — AUTH GUARD + RATE LIMITING
// (Next.js 16 renombró middleware → proxy)
//
// Rate limit:
//   - Anónimos (no llegan a /api/* porque NextAuth.authorized retorna 401
//     antes; queda como defensa en profundidad): 100 req/min por IP.
//   - Autenticados: 10.000 req/min por usuario (clave = email).
//     El bucket por usuario aísla a un eventual abusador del resto.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const WINDOW_MS         = 60_000;
const MAX_REQUESTS_ANON = 100;
const MAX_REQUESTS_AUTH = 10_000;

const hits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

function cleanup(now: number) {
  for (const [key, timestamps] of hits.entries()) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

function applyRateLimit(key: string, max: number): NextResponse {
  const now = Date.now();

  if (hits.size > 1000) cleanup(now);

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= max) {
    const oldest     = timestamps[0];
    const retryAfter = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Demasiadas solicitudes. Intenta nuevamente en unos segundos.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type':          'application/json',
          'Retry-After':           String(retryAfter),
          'X-RateLimit-Limit':     String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Math.ceil((oldest + WINDOW_MS) / 1000)),
        },
      },
    );
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit',     String(max));
  res.headers.set('X-RateLimit-Remaining', String(max - timestamps.length));
  return res;
}

export default auth((req) => {
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  // NextAuth.authorized ya bloqueó anónimos en /api/* con 401.
  // El bucket anónimo queda como defensa en profundidad.
  const email = req.auth?.user?.email;
  const key   = email ? `u:${email}` : `ip:${getClientIp(req)}`;
  const max   = email ? MAX_REQUESTS_AUTH : MAX_REQUESTS_ANON;

  return applyRateLimit(key, max);
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

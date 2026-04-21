// TODO: POST /api/auth/logout
//
// Logout federado: limpia la sesión NextAuth server-side y retorna la URL
// de logout de Keycloak para que el cliente haga el redirect final.
// El id_token nunca viaja al cliente — se usa solo server-side como hint.

import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';

export async function POST(request: Request) {
  // ── CSRF: verificar que la solicitud viene del propio frontend ─────────────
  const origin      = request.headers.get('origin');
  const baseUrl     = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  if (!origin || !origin.startsWith(baseUrl)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Obtener idToken del JWT encriptado (server-side) ──────────────────────
  const headersList = await headers();
  const rawToken = await getToken({
    req: { headers: headersList },
    secret:       process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const idToken = rawToken?.idToken as string | undefined;

  // ── Limpiar cookies de sesión de NextAuth ──────────────────────────────────
  // Auth.js v5 parte la cookie en chunks (.0, .1, ...) cuando el JWT excede
  // el límite de 4 KB — típico con tokens de Keycloak.
  const cookieStore  = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  const prefix       = isProduction
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  for (const c of cookieStore.getAll()) {
    if (c.name === prefix || c.name.startsWith(`${prefix}.`)) {
      cookieStore.delete(c.name);
    }
  }

  // ── Construir URL de logout de Keycloak (si aplica) ───────────────────────
  const callbackUrl = `${baseUrl}/login`;
  const issuer      = process.env.KEYCLOAK_ISSUER;

  if (idToken && issuer) {
    const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set('id_token_hint',          idToken);
    logoutUrl.searchParams.set('post_logout_redirect_uri', callbackUrl);

    return Response.json({ logoutUrl: logoutUrl.toString() });
  }

  // Fallback: mock auth o sin idToken — redirigir solo al login local
  return Response.json({ logoutUrl: callbackUrl });
}

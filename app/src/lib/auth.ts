import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import KeycloakProvider from "next-auth/providers/keycloak"

// Map para evitar refreshes concurrentes del mismo usuario (best-effort, proceso único)
const refreshingTokens = new Map<string, Promise<JWT>>()

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), 5000)

  try {
    const issuer   = process.env.KEYCLOAK_ISSUER!
    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     process.env.KEYCLOAK_ID!,
        client_secret: process.env.KEYCLOAK_SECRET!,
        refresh_token: token.refreshToken!,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error('Refresh token inválido o revocado')
    }

    const tokens = await response.json()

    return {
      ...token,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      idToken:      tokens.id_token      ?? token.idToken,
      expiresAt:    Date.now() + tokens.expires_in * 1000,
      error:        undefined,
    }
  } catch (err) {
    clearTimeout(timeoutId)
    return {
      ...token,
      accessToken:  undefined,
      refreshToken: undefined,
      idToken:      undefined,
      error:        'RefreshAccessTokenError',
    }
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      clientId:     process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer:       process.env.KEYCLOAK_ISSUER,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge:   30 * 60,
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      // Login inicial — persistir todos los tokens
      if (account && user) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          idToken:      account.id_token,
          expiresAt:    Date.now() + ((account.expires_in ?? 300) as number) * 1000,
        }
      }

      // Token aún válido (margen de 60 segundos)
      if (typeof token.expiresAt === 'number' && Date.now() < token.expiresAt - 60 * 1000) {
        return token
      }

      // Sin refresh token: no se puede renovar
      if (!token.refreshToken) {
        return { ...token, error: 'RefreshAccessTokenError' as const }
      }

      // Renovar — deduplicar requests concurrentes del mismo usuario
      const userId = token.sub ?? 'unknown'

      if (!refreshingTokens.has(userId)) {
        const refreshPromise = refreshAccessToken(token).finally(() => {
          refreshingTokens.delete(userId)
        })
        refreshingTokens.set(userId, refreshPromise)
      }

      return refreshingTokens.get(userId)!
    },

    async session({ session, token }) {
      // accessToken NO se expone al cliente — vive solo en el JWT encriptado (server-side)
      return {
        ...session,
        error: token.error,
      }
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn    = !!auth?.user
      const hasError      = auth?.error === 'RefreshAccessTokenError'
      const isOnLoginPage = nextUrl.pathname === '/login'
      const isApiRoute    = nextUrl.pathname.startsWith('/api/')

      if (isOnLoginPage) {
        if (isLoggedIn && !hasError) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      if (hasError || !isLoggedIn) {
        if (isApiRoute) {
          return Response.json(
            { success: false, message: 'Sesión expirada', data: null },
            { status: 401 },
          )
        }
        return Response.redirect(new URL('/login', nextUrl))
      }

      return true
    },
  },

  trustHost: true,
  debug:     false,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

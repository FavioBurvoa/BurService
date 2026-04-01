import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import CredentialsProvider from "next-auth/providers/credentials"

const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true';

console.log('[Auth] USE_MOCK_AUTH:', USE_MOCK_AUTH);
console.log('[Auth] KEYCLOAK_ISSUER:', process.env.KEYCLOAK_ISSUER);
console.log('[Auth] KEYCLOAK_ID:', process.env.KEYCLOAK_ID);

export const authConfig: NextAuthConfig = {
  providers: USE_MOCK_AUTH
    ? [
        CredentialsProvider({
          id: 'credentials',
          name: 'Desarrollo (Mock)',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
          },
          async authorize(credentials) {
            console.log('[Auth] Mock login attempt for:', credentials?.email);
            if (credentials?.email === 'demo@bur-service.com' && credentials?.password === 'demo123') {
              return {
                id: '1',
                name: 'Usuario Demo',
                email: 'demo@bur-service.com',
              }
            }
            return null
          },
        }),
      ]
    : [
        KeycloakProvider({
          clientId: process.env.KEYCLOAK_ID!,
          clientSecret: process.env.KEYCLOAK_SECRET!,
          issuer: process.env.KEYCLOAK_ISSUER,
        }),
      ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60,
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        console.log('[JWT] New sign in for user:', user.email);
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        }
      }
      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        error: token.error,
      }
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname === '/login'
      
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }

      if (isLoggedIn) return true
      
      return false
    },
  },

  trustHost: true,
  debug: false,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

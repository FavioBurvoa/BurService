# Configuración de Keycloak - Guía de Resolución

## ✅ Estado Actual

- ✅ Keycloak está respondiendo correctamente
- ✅ Variables de entorno están configuradas
- ✅ Configuración de Auth.js actualizada

## 🔧 Pasos para Resolver el Error 500

El error `500 Internal Server Error` en `/api/auth/session` y `/api/auth/providers` se debe a que el servidor Next.js tiene cacheadas las variables de entorno antiguas.

### Solución: Reinicio Completo

1. **Detener el servidor actual:**
   - Presiona `Ctrl+C` en la terminal donde está corriendo `npm run dev`

2. **Limpiar cache de Next.js:**
   ```bash
   rm -rf .next
   ```

   O en Windows:
   ```bash
   rmdir /s /q .next
   ```

3. **Verificar variables de entorno:**
   Asegúrate que en `.env.local` tengas:
   ```bash
   USE_MOCK_AUTH=false
   NEXT_PUBLIC_USE_MOCK_AUTH=false
   KEYCLOAK_ID=cloudfruit
   KEYCLOAK_SECRET=D5hWMZoxGT0e8C0iTlMhF6xXt1VqXpVm
   KEYCLOAK_ISSUER=https://authtest.cloudfruit.cl/auth/realms/TEST
   NEXTAUTH_SECRET=q7J9F3pR2kN8M0bCwYHc0E0xv7d6nPp4r1uLQ5ZkXcA=
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Iniciar el servidor nuevamente:**
   ```bash
   npm run dev
   ```

5. **Verificar en la consola del servidor:**
   Deberías ver estos logs:
   ```
   [Auth Config] USE_MOCK_AUTH: false
   [Auth Config] KEYCLOAK_ISSUER: https://authtest.cloudfruit.cl/auth/realms/TEST
   [Auth Config] KEYCLOAK_ID: cloudfruit
   [Auth Config] Usando autenticación KEYCLOAK
   ```

6. **Abrir la aplicación:**
   - Ir a `http://localhost:3000`
   - Serás redirigido a `/login`
   - Click en "Iniciar Sesión con Keycloak"
   - Serás redirigido a Keycloak para autenticación

## 🐛 Diagnóstico de Errores

### Si sigues viendo error 500:

1. **Verificar que Keycloak responde:**
   ```bash
   node verify-keycloak.js
   ```
   Deberías ver: ✅ ¡Keycloak responde correctamente!

2. **Revisar logs del servidor:**
   Busca errores en la terminal donde corre `npm run dev`
   Los logs mostrarán exactamente qué está fallando

3. **Verificar el navegador:**
   - Abre las Dev Tools (F12)
   - Ve a la pestaña "Network"
   - Actualiza la página
   - Busca las requests a `/api/auth/*`
   - Click en cada una para ver detalles del error

### Si ves "Variables de Keycloak no configuradas":

Verifica que `.env.local` exista y tenga las variables correctas:
```bash
cat .env.local | grep KEYCLOAK
```

Deberías ver las 3 variables:
```
KEYCLOAK_ID=cloudfruit
KEYCLOAK_SECRET=D5hWMZoxGT0e8C0iTlMhF6xXt1VqXpVm
KEYCLOAK_ISSUER=https://authtest.cloudfruit.cl/auth/realms/TEST
```

## 📊 Flujo de Autenticación con Keycloak

1. Usuario visita `http://localhost:3000`
2. Middleware detecta que no hay sesión
3. Redirige a `/login`
4. Usuario click en "Iniciar Sesión con Keycloak"
5. App redirige a Keycloak:
   ```
   https://authtest.cloudfruit.cl/auth/realms/TEST/protocol/openid-connect/auth
   ```
6. Usuario ingresa credenciales en Keycloak
7. Keycloak redirige de vuelta con código de autorización
8. NextAuth intercambia código por tokens
9. Crea sesión JWT
10. Redirige a `/clientes/lista`

## 🔍 Verificación Exitosa

Cuando todo funcione correctamente, verás:
1. No hay errores 500 en Network tab
2. `/api/auth/session` responde con 200 OK
3. `/api/auth/providers` responde con lista de providers
4. Al hacer click en login, redirige a Keycloak
5. Después de autenticar en Keycloak, redirige a la app
6. Puedes ver `/clientes/lista` sin problemas

## ⚡ Script Rápido de Reinicio

Si quieres reiniciar rápidamente:

```bash
# En una sola línea (Git Bash o Linux/Mac):
rm -rf .next && npm run dev

# En Windows CMD:
rmdir /s /q .next && npm run dev

# En PowerShell:
Remove-Item -Recurse -Force .next; npm run dev
```

## 🆘 Si Nada Funciona

Como último recurso, cambiar a modo mock temporalmente:

1. En `.env.local`:
   ```bash
   USE_MOCK_AUTH=true
   NEXT_PUBLIC_USE_MOCK_AUTH=true
   ```

2. Reiniciar servidor
3. Probar con credenciales mock: `demo@bur-service.com` / `demo123`

Esto confirmará que el problema es específico de Keycloak y no de la app.

---

**IMPORTANTE:** Después de cualquier cambio en `.env.local`, siempre reiniciar el servidor completamente (Ctrl+C y luego `npm run dev`). Next.js no detecta automáticamente cambios en variables de entorno.

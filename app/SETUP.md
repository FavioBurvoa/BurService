# Guía de Configuración Rápida - BUR-SERVICE

## ✅ Problema Resuelto

El error que experimentabas era debido a que Auth.js intentaba conectarse a Keycloak pero el servidor no estaba disponible o configurado correctamente.

**Solución implementada:** Modo de desarrollo con autenticación mock.

## 🚀 Inicio Rápido (Modo Desarrollo - SIN Keycloak)

1. **Las variables de entorno ya están configuradas** en `.env.local`:
   ```bash
   USE_MOCK_AUTH=true
   NEXT_PUBLIC_USE_MOCK_AUTH=true
   ```

2. **Reiniciar el servidor de desarrollo:**
   ```bash
   # Detener el servidor actual (Ctrl+C)
   # Iniciar nuevamente
   npm run dev
   ```

3. **Acceder a la aplicación:**
   - Abrir [http://localhost:3000](http://localhost:3000)
   - Serás redirigido a `/login`

4. **Iniciar sesión con credenciales de prueba:**
   - **Email:** `demo@bur-service.com`
   - **Contraseña:** `demo123`

5. **¡Listo!** Ahora puedes usar toda la aplicación:
   - Crear clientes
   - Ver lista de clientes
   - Editar y eliminar clientes
   - Búsqueda con paginación

## 🔐 Cambiar a Modo Producción (con Keycloak)

Cuando tu servidor Keycloak esté listo:

1. **Editar `.env.local`:**
   ```bash
   # Desactivar modo mock
   USE_MOCK_AUTH=false
   NEXT_PUBLIC_USE_MOCK_AUTH=false

   # Verificar que las credenciales de Keycloak estén correctas
   KEYCLOAK_ID=cloudfruit
   KEYCLOAK_SECRET=D5hWMZoxGT0e8C0iTlMhF6xXt1VqXpVm
   KEYCLOAK_ISSUER=https://authtest.cloudfruit.cl/auth/realms/TEST
   ```

2. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

3. **La aplicación usará Keycloak** para autenticación real.

## 📝 Diferencias entre Modo Mock y Keycloak

### Modo Mock (Desarrollo)
- ✅ No requiere Keycloak configurado
- ✅ Inicio rápido para desarrollo
- ✅ Credenciales fijas: demo@bur-service.com / demo123
- ❌ No es seguro para producción
- ❌ Un solo usuario disponible

### Modo Keycloak (Producción)
- ✅ Autenticación real y segura
- ✅ Múltiples usuarios
- ✅ Gestión de permisos y roles
- ✅ PKCE flow para máxima seguridad
- ✅ Refresh token automático
- ❌ Requiere servidor Keycloak configurado

## 🐛 Solución de Problemas

### Error: "Failed to execute 'json' on 'Response'"
**Causa:** Keycloak no está disponible pero `USE_MOCK_AUTH=false`

**Solución:** Activar modo mock en `.env.local`:
```bash
USE_MOCK_AUTH=true
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

### La página de login no muestra el formulario
**Causa:** La variable `NEXT_PUBLIC_USE_MOCK_AUTH` no está configurada

**Solución:** Asegurarse que `.env.local` tenga:
```bash
NEXT_PUBLIC_USE_MOCK_AUTH=true
```
Y reiniciar el servidor.

### Credenciales incorrectas en modo mock
**Solución:** Usar exactamente:
- Email: `demo@bur-service.com`
- Contraseña: `demo123`

## 📊 Funcionalidades Disponibles

Una vez autenticado, puedes:

1. **Registrar Clientes** (`/clientes/registro`)
   - RUT con validación chilena
   - Formato automático de RUT y teléfono
   - Validación en tiempo real

2. **Ver Lista de Clientes** (`/clientes/lista`)
   - Búsqueda por nombre, apellido o RUT
   - Paginación (10 por página)
   - Editar y eliminar clientes

3. **Datos Mock Incluidos**
   - 4 clientes de ejemplo pre-cargados
   - Datos persisten solo en memoria (se pierden al reiniciar)

## 🔄 Próximos Pasos

1. **Desarrollo con datos mock:**
   - Usa `USE_MOCK_AUTH=true`
   - Todos los datos están en memoria (mock)
   - Ideal para desarrollo UI/UX

2. **Conectar API Externa:**
   - En `src/app/api/clientes/route.ts`
   - Descomentar secciones `// Request a API externa`
   - Eliminar secciones `// MOCK DATA`
   - Configurar `API_EXTERNAL_URL` en `.env.local`

3. **Producción con Keycloak:**
   - Configurar servidor Keycloak
   - Cambiar `USE_MOCK_AUTH=false`
   - Verificar credenciales en `.env.local`

## 📞 Soporte

Si tienes problemas:
1. Verifica que `.env.local` tenga las variables correctas
2. Reinicia el servidor después de cambiar `.env.local`
3. Revisa la consola del navegador para errores
4. Revisa la terminal del servidor para logs

---

**¡Tu aplicación está lista para usar en modo desarrollo!** 🎉

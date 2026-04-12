- formateador rut
- formateador patente
- ver como mejorar usabilidad con enter
- preview mantenedor logo empresa

---

## Keycloak local — configuración pendiente

El servicio `keycloak` ya está en `docker-compose.yml` pero requiere los siguientes pasos antes de funcionar.

---

### PASO 1 — api/.env

El archivo debe quedar exactamente así (reemplaza el contenido actual):

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=burservice
DB_USER=postgres
DB_PASSWORD=postgres

KEYCLOAK_JWKS_URL=http://localhost:3005/realms/saga-ops/protocol/openid-connect/certs
KEYCLOAK_ISSUER=http://localhost:3005/realms/saga-ops

CORS_ORIGIN=http://localhost:3000

# Keycloak — admin
KC_ADMIN=admin
KC_ADMIN_PASSWORD=admin

# Keycloak — base de datos exclusiva
KC_DB_NAME=keycloak
KC_DB_USER=keycloak
KC_DB_PASSWORD=keycloak
```

---

### PASO 2 — api/.env.example

El archivo debe quedar exactamente así:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=burservice
DB_USER=postgres
DB_PASSWORD=postgres

KEYCLOAK_JWKS_URL=http://localhost:3005/realms/saga-ops/protocol/openid-connect/certs
KEYCLOAK_ISSUER=http://localhost:3005/realms/saga-ops

CORS_ORIGIN=http://localhost:3000

# Keycloak — admin
KC_ADMIN=admin
KC_ADMIN_PASSWORD=admin

# Keycloak — base de datos exclusiva
KC_DB_NAME=keycloak
KC_DB_USER=keycloak
KC_DB_PASSWORD=keycloak
```

---

### PASO 3 — Levantar Docker y configurar Keycloak

1. Ejecutar `docker compose up -d`
2. Esperar ~30-60 segundos a que Keycloak inicie (es lento la primera vez)
3. Abrir <http://localhost:3005>
4. Ingresar con `admin` / `admin`

#### Crear realm

- Menú superior izquierdo → "Create realm"
- Realm name: `saga-ops`
- Enabled: ON
- Guardar

#### Crear client

- En realm `saga-ops` → Clients → "Create client"
- Client type: `OpenID Connect`
- Client ID: `burservice`
- Next
- Client authentication: **ON** (esto lo hace confidential, habilita el client secret)
- Authentication flow: marcar solo `Standard flow`
- Next
- Valid redirect URIs: agregar las dos siguientes
  - `http://localhost:3000/*`
  - `https://app.burservice.cl/*`
- Web origins: agregar las dos siguientes
  - `http://localhost:3000`
  - `https://app.burservice.cl`
- Save

#### Obtener el client secret

- Ir a Clients → burservice → pestaña **Credentials**
- Copiar el valor de "Client secret"
- Ese valor va en `KEYCLOAK_SECRET` del paso 4

#### Crear usuario de prueba

- En realm `saga-ops` → Users → "Create new user"
- Username: el que quieras (ej: `admin`)
- Email: el que quieras
- Email verified: ON
- Save
- Pestaña **Credentials** → Set password → ingresar contraseña → Temporary: OFF → Save

---

### PASO 4 — app/.env.local

Una vez obtenido el client secret del paso 3, el archivo debe quedar exactamente así:

```env
# ----------------------------------------------------------------------------
# MODO DE DESARROLLO
# ----------------------------------------------------------------------------
USE_MOCK_AUTH=false
NEXT_PUBLIC_USE_MOCK_AUTH=false

# ----------------------------------------------------------------------------
# NEXTAUTH (Auth.js v5)
# ----------------------------------------------------------------------------
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=q7J9F3pR2kN8M0bCwYHc0E0xv7d6nPp4r1uLQ5ZkXcA=

# ----------------------------------------------------------------------------
# KEYCLOAK
# ----------------------------------------------------------------------------
KEYCLOAK_ID=burservice
KEYCLOAK_SECRET=<PEGAR_EL_SECRET_DEL_PASO_3>
KEYCLOAK_ISSUER=http://localhost:3005/realms/saga-ops

# ----------------------------------------------------------------------------
# API EXTERNA
# ----------------------------------------------------------------------------
API_EXTERNAL_URL=https://api-externa.example.com

# ----------------------------------------------------------------------------
# NODE API
# ----------------------------------------------------------------------------
API_URL=http://localhost:3001/api
REPORTE_SVC_URL=http://localhost:3003
GOTENBERG_URL=http://localhost:3002

# ----------------------------------------------------------------------------
# CONFIGURACIÓN ADICIONAL
# ----------------------------------------------------------------------------
NODE_ENV=development
```

---

### PASO 5 — app/.env.local.example

Mismo contenido que el paso 4 pero con `KEYCLOAK_SECRET=REEMPLAZAR_CON_SECRET_DE_KEYCLOAK`.

---

### PASO 6 — DNS local Windows

Editar `C:\Windows\System32\drivers\etc\hosts` como administrador y agregar:

```text
127.0.0.1   app.burservice.cl
127.0.0.1   auth.burservice.cl
```

---

### PASO 7 — Pendientes para producción

Cuando se despliegue a producción, los siguientes valores cambian:

**api/.env (producción):**

```env
KEYCLOAK_JWKS_URL=https://auth.burservice.cl/realms/saga-ops/protocol/openid-connect/certs
KEYCLOAK_ISSUER=https://auth.burservice.cl/realms/saga-ops
```

**app/.env.local (producción):**

```env
NEXTAUTH_URL=https://app.burservice.cl
KEYCLOAK_ISSUER=https://auth.burservice.cl/realms/saga-ops
```

**docker-compose (producción):** el comando de Keycloak cambia de `start-dev` a:

```yaml
command: start --proxy=edge --hostname=https://auth.burservice.cl --http-enabled=true
```

Requiere un reverse proxy (nginx o traefik) que termine TLS y pase tráfico al puerto 3005.

---

### PASO 8 — Mejoras de seguridad pendientes (post-producción)

- **Refresh token rotation**: el callback `jwt` en `app/src/lib/auth.ts` no renueva el access token cuando expira. Sin esto la sesión muere cada 5 minutos sin posibilidad de renovarse.
- **Logout federado**: al hacer signOut solo se destruye la sesión de NextAuth, la sesión en Keycloak sigue activa. Hay que llamar al endpoint de logout de Keycloak en el signOut.


0.13
Favio
saga-ops
fbur
799442
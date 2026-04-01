# BUR-SERVICE

Sistema profesional de gestión para taller automotriz desarrollado con Next.js 15, TypeScript y Mantine UI v7.

## Características

- **Autenticación segura** con Keycloak (PKCE flow)
- **CRUD completo de Clientes** con validación de datos
- **Interfaz moderna y responsive** con Mantine UI v7
- **Gestión de estado** con React Query v5
- **Validación de formularios** con Zod
- **Sidebar colapsable** con persistencia de estado
- **Dark/Light mode** ready
- **TypeScript strict mode** para máxima seguridad de tipos

## Stack Tecnológico

### Frontend
- **Next.js 15** (App Router)
- **TypeScript 5**
- **Mantine UI v7** (componentes + hooks + form + notifications)
- **@tanstack/react-query v5** (gestión de estado API)
- **@tabler/icons-react** (iconos)
- **Zod** (validación de schemas)

### Autenticación
- **Auth.js v5 (next-auth)** con Keycloak provider
- PKCE Flow
- JWT sessions (sin database)
- Refresh token strategy

### Backend (API Intermedia)
- Next.js API Routes (`/app/api`)
- Middleware de autenticación JWT
- Validación de datos con Zod
- Proxy a API externa

## Requisitos Previos

- Node.js 20 LTS o superior
- npm 10 o superior
- Servidor Keycloak configurado
- API externa del taller (o usar datos mock incluidos)

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd bur-service
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```

   Editar `.env.local` y completar:
   - `NEXTAUTH_URL`: URL de la aplicación (http://localhost:3000 en desarrollo)
   - `NEXTAUTH_SECRET`: Secret para JWT (generar con `openssl rand -base64 32`)
   - `KEYCLOAK_ID`: Client ID de Keycloak
   - `KEYCLOAK_SECRET`: Client Secret de Keycloak
   - `KEYCLOAK_ISSUER`: URL del realm de Keycloak
   - `API_EXTERNAL_URL`: URL de la API externa

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm start            # Iniciar servidor de producción
npm run lint         # Ejecutar linter
npm run type-check   # Verificar tipos de TypeScript
```

## Estructura del Proyecto

```
bur-service/
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── (auth)/                   # Rutas protegidas
│   │   │   ├── clientes/
│   │   │   │   ├── registro/         # Formulario de registro
│   │   │   │   └── lista/            # Lista y búsqueda
│   │   │   └── layout.tsx            # Layout con AppShell
│   │   ├── (public)/                 # Rutas públicas
│   │   │   └── login/                # Página de login
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/[...nextauth]/   # Endpoints NextAuth
│   │   │   └── clientes/             # CRUD Clientes
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Página de inicio
│   ├── components/                   # Componentes React
│   │   ├── layout/                   # AppShell, Navbar, Header
│   │   ├── clientes/                 # ClienteForm, ClienteTable
│   │   └── ui/                       # ErrorBoundary, LoadingOverlay
│   ├── lib/                          # Librerías y utilidades
│   │   ├── auth/                     # Configuración Auth.js
│   │   ├── api/                      # Cliente API
│   │   └── validations/              # Schemas Zod
│   ├── hooks/                        # Custom hooks
│   │   ├── useClientes.ts            # React Query hooks
│   │   └── useAuth.ts                # Hook de autenticación
│   ├── config/                       # Archivos de configuración
│   │   ├── menu.json                 # Configuración del menú
│   │   └── api.config.ts             # URLs API externa
│   ├── types/                        # Tipos TypeScript
│   │   └── index.ts                  # Tipos globales
│   └── styles/                       # Estilos y tema
│       └── theme.ts                  # Configuración Mantine
├── middleware.ts                      # Middleware de protección
├── .env.local.example                 # Ejemplo de variables de entorno
└── package.json
```

## Módulo de Clientes

### Funcionalidades

1. **Registro de Clientes**
   - Formulario con validación en tiempo real
   - Formato automático de RUT y teléfono
   - Validación de RUT chileno
   - Campos: RUT, Nombre, Apellido, Email, Teléfono, Dirección

2. **Lista de Clientes**
   - Tabla con paginación
   - Búsqueda en tiempo real (nombre, apellido, RUT)
   - Acciones: Editar y Eliminar
   - Confirmación antes de eliminar
   - Responsive (scroll horizontal en mobile)

### Validaciones

- **RUT**: Formato `12.345.678-9` con dígito verificador válido
- **Teléfono**: Formato `+56912345678` (celular chileno)
- **Email**: Validación estándar RFC 5322
- **Nombre/Apellido**: Solo letras y espacios, 2-50 caracteres

## API Routes

### Clientes

#### GET `/api/clientes`
Obtener lista de clientes con búsqueda opcional

**Query Parameters:**
- `search` (opcional): Término de búsqueda

**Response:**
```json
{
  "success": true,
  "message": "Clientes obtenidos correctamente",
  "data": [
    {
      "id": 1,
      "rut": "12.345.678-9",
      "nombre": "Juan",
      "apellido": "Pérez",
      "email": "juan@example.com",
      "telefono": "+56912345678",
      "direccion": "Av. Principal 123",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

#### POST `/api/clientes`
Crear un nuevo cliente

**Body:**
```json
{
  "rut": "12.345.678-9",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "direccion": "Av. Principal 123"
}
```

#### GET `/api/clientes/[id]`
Obtener un cliente por ID

#### PUT `/api/clientes/[id]`
Actualizar un cliente

#### DELETE `/api/clientes/[id]`
Eliminar un cliente

## Autenticación

### Flujo PKCE con Keycloak

1. Usuario accede a ruta protegida
2. Middleware verifica token JWT
3. Si no hay token, redirige a `/login`
4. Usuario hace click en "Iniciar Sesión"
5. Redirige a Keycloak para autenticación
6. Keycloak autentica y retorna código
7. Auth.js intercambia código por tokens (PKCE)
8. JWT almacenado en cookie httpOnly
9. Usuario redirigido a aplicación

### Refresh Token Strategy

- Refresh automático en background cada 5 minutos si el token expira en <10 min
- Refresh ante actividad del usuario (navegación, clicks)
- Logout automático tras 30 minutos de inactividad

## Datos Mock

La aplicación incluye datos mock para desarrollo. Los endpoints API están comentados con instrucciones para conectar a la API externa real.

**Para usar la API externa:**
1. Descomentar las secciones marcadas con `// Request a API externa`
2. Eliminar las secciones marcadas con `// MOCK DATA`
3. Configurar `API_EXTERNAL_URL` en `.env.local`

## Diseño UI

### Paleta de Colores

- **Primary**: `#2563eb` (Azul principal)
- **Sidebar Background**: `#1e293b` (Fondo oscuro)
- **Table Header**: `#dbeafe` (Azul claro)
- **Success**: `#10b981`
- **Error**: `#ef4444`
- **Warning**: `#f59e0b`

### Sidebar

- **Expandido**: 240px
- **Colapsado**: 60px
- **Responsive**: Drawer en mobile (<768px)
- **Persistencia**: Estado guardado en localStorage

## Extensibilidad

El proyecto está estructurado para agregar fácilmente nuevos módulos:

1. **Agregar nuevo módulo al menú**
   - Editar `src/config/menu.json`
   - Agregar icono a `iconMap` en `Navbar.tsx`

2. **Crear nuevas páginas**
   - Crear carpeta en `src/app/(auth)/`
   - Usar el mismo layout con AppShell

3. **Agregar API routes**
   - Crear en `src/app/api/`
   - Seguir estructura estándar `ApiResponse<T>`

## Próximos Módulos

- [ ] Presupuestos
- [ ] Inventario
- [ ] Facturación
- [ ] Reportes
- [ ] Dashboard

## Seguridad

- TypeScript strict mode
- Validación de datos con Zod
- Sanitización de inputs
- CSRF protection (Auth.js)
- HTTP-only cookies
- Middleware de autenticación

## Performance

- Lazy loading de rutas
- Optimistic updates (React Query)
- Debounce en búsquedas
- Memoización en componentes críticos
- Server-side rendering (Next.js)

## Soporte de Navegadores

- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)

## Licencia

Privado - Todos los derechos reservados

## Contacto

Para soporte o consultas, contactar al equipo de desarrollo.

---

**Versión:** 1.0.0
**Última actualización:** Enero 2025

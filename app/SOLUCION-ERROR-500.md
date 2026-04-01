# 🔧 Solución al Error 500 - Auth con Keycloak

## ❌ Error Actual

```
GET http://localhost:3000/api/auth/session 500 (Internal Server Error)
GET http://localhost:3000/api/auth/providers 500 (Internal Server Error)
```

## ✅ Solución Implementada

He actualizado la configuración de NextAuth para que funcione correctamente con tu servidor Keycloak. Los cambios incluyen:

1. ✅ Validación de variables de entorno
2. ✅ Configuración explícita del `wellKnown` endpoint
3. ✅ Mejor manejo de errores
4. ✅ Logs de diagnóstico
5. ✅ Profile mapping para Keycloak

## 🚀 Pasos para Resolver (EN ORDEN)

### 1. Detener el Servidor Actual

Presiona `Ctrl+C` en la terminal donde está corriendo el servidor.

### 2. Limpiar Cache y Reiniciar

**Opción A - Script automático (RECOMENDADO):**
```bash
npm run dev:clean
```

**Opción B - Manual:**
```bash
# Windows (PowerShell):
Remove-Item -Recurse -Force .next
npm run dev

# Windows (CMD):
rmdir /s /q .next
npm run dev

# Git Bash / Linux / Mac:
rm -rf .next && npm run dev
```

### 3. Verificar los Logs

Cuando el servidor inicie, deberías ver en la terminal:

```
[Auth Config] USE_MOCK_AUTH: false
[Auth Config] KEYCLOAK_ISSUER: https://authtest.cloudfruit.cl/auth/realms/TEST
[Auth Config] KEYCLOAK_ID: cloudfruit
[Auth Config] Usando autenticación KEYCLOAK
```

Si ves estos logs, **la configuración es correcta**.

### 4. Probar la Aplicación

1. Abre `http://localhost:3000`
2. Serás redirigido a `/login`
3. Click en **"Iniciar Sesión con Keycloak"**
4. Serás redirigido a tu servidor Keycloak
5. Ingresa tus credenciales de Keycloak
6. Deberías ser redirigido de vuelta a la app en `/clientes/lista`

## 🔍 Diagnóstico

Si aún hay problemas, ejecuta:

```bash
npm run verify-keycloak
```

Deberías ver:
```
✅ ¡Keycloak responde correctamente!

Endpoints disponibles:
  - Authorization: https://authtest.cloudfruit.cl/auth/realms/TEST/protocol/openid-connect/auth
  - Token: https://authtest.cloudfruit.cl/auth/realms/TEST/protocol/openid-connect/token
  ...
```

## 📝 Variables de Entorno Actuales

Tu `.env.local` debe tener:

```bash
# Modo Keycloak (NO mock)
USE_MOCK_AUTH=false
NEXT_PUBLIC_USE_MOCK_AUTH=false

# Configuración Keycloak
KEYCLOAK_ID=cloudfruit
KEYCLOAK_SECRET=D5hWMZoxGT0e8C0iTlMhF6xXt1VqXpVm
KEYCLOAK_ISSUER=https://authtest.cloudfruit.cl/auth/realms/TEST

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=q7J9F3pR2kN8M0bCwYHc0E0xv7d6nPp4r1uLQ5ZkXcA=
```

## ⚠️ Problemas Comunes

### Error: "Variables de Keycloak no configuradas"

**Causa:** Las variables de entorno no se cargaron correctamente.

**Solución:**
1. Verifica que `.env.local` exista en la raíz del proyecto
2. Verifica que contenga las variables correctas
3. Reinicia el servidor completamente

### Error 500 persiste después de reiniciar

**Causa:** El navegador tiene cache del error anterior.

**Solución:**
1. Abre DevTools (F12)
2. Click derecho en el botón de reload
3. Selecciona "Empty Cache and Hard Reload"
4. O abre en ventana de incógnito: `Ctrl+Shift+N`

### Redirige a login pero no a Keycloak

**Causa:** El botón de login no está usando el provider correcto.

**Solución:**
1. Verifica que `NEXT_PUBLIC_USE_MOCK_AUTH=false`
2. Reinicia el servidor
3. La página de login debe mostrar "Iniciar Sesión con Keycloak"

## 📊 Flujo Correcto

```
1. http://localhost:3000
   ↓
2. Redirect a /login (por middleware)
   ↓
3. Click en "Iniciar Sesión con Keycloak"
   ↓
4. Redirect a https://authtest.cloudfruit.cl/auth/realms/TEST/protocol/openid-connect/auth
   ↓
5. Usuario ingresa credenciales en Keycloak
   ↓
6. Keycloak redirect a http://localhost:3000/api/auth/callback/keycloak?code=...
   ↓
7. NextAuth intercambia código por tokens
   ↓
8. Crea sesión JWT
   ↓
9. Redirect a /clientes/lista
   ↓
10. ✅ Usuario autenticado correctamente
```

## 🎯 Archivos Modificados

1. **[src/lib/auth/auth.config.ts](src/lib/auth/auth.config.ts)**
   - Agregada validación de variables de entorno
   - Configuración explícita de `wellKnown`
   - Función `getProviders()` para mejor organización
   - Logs de diagnóstico

2. **[package.json](package.json)**
   - Nuevo script: `npm run dev:clean` (limpia cache y reinicia)
   - Nuevo script: `npm run verify-keycloak` (verifica conexión)

3. **Nuevos archivos:**
   - `verify-keycloak.js` - Script de verificación de Keycloak
   - `KEYCLOAK-SETUP.md` - Guía detallada de configuración
   - Este archivo

## ✅ Checklist Final

Antes de considerar que funciona, verifica:

- [ ] El servidor inició sin errores
- [ ] Los logs muestran "Usando autenticación KEYCLOAK"
- [ ] `/api/auth/session` responde 200 OK (puedes verificar en Network tab)
- [ ] `/api/auth/providers` responde con lista de providers
- [ ] Al hacer click en login, redirige a Keycloak
- [ ] Puedes autenticar en Keycloak
- [ ] Después de autenticar, redirige a la app
- [ ] Puedes ver la lista de clientes

## 🆘 Si NADA Funciona

Como último recurso, prueba con modo mock para confirmar que la app funciona:

```bash
# En .env.local:
USE_MOCK_AUTH=true
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

Luego:
```bash
npm run dev:clean
```

Usa credenciales: `demo@bur-service.com` / `demo123`

Si funciona en modo mock pero no con Keycloak, el problema es específico de la conexión con Keycloak, no de la aplicación.

---

**IMPORTANTE:** Después de CUALQUIER cambio en `.env.local`, SIEMPRE reinicia el servidor:
```bash
# Ctrl+C para detener
npm run dev:clean
```

Next.js NO detecta automáticamente cambios en variables de entorno.




















































region 
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    orden - int - visible grid - visible modal - requerido
    codigo_sii - texto(20) solo alfanumerico - visible grid - visible modal - no requerido
    activo - boolean - visible grid - visible modal - true por defecto

comuna 
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    orden - int - visible grid - visible modal - requerido
    codigo_sii - texto(20) solo alfanumerico - visible grid - visible modal - no requerido
    activo - boolean - visible grid - visible modal - true por defecto

tipos contribuyente
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    swFactura - boolean - visible grid - visible modal - false por defecto
    activo - boolean - visible grid - visible modal - true por defecto

contribuyente
    id - bigint - no visible grid - no visible modal
    rut - texto(20) - visible grid - visible modal - requerido
    nombre - texto(300) - visible grid - visible modal - requerido
    apellidos - texto(300) - visible grid - visible modal - requerido
    idTipoContribuyente - multi select - visible grid - visible modal - requerido - default RM (region metropolitana)
    giro  - texto(300) - visible grid - visible modal - requerido solo cuando el "tipo contribuyente" tenga swFactura true 
    idRegion - select - visible grid - visible modal - requerido - default RM (region metropolitana)
    idComuna - select (depend idRegion) - visible grid - visible modal - requerido  solo cuando el "tipo contribuyente" tenga swFactura true 
    direccion - texto(300)- visible grid - visible modal - requerido solo cuando el "tipo contribuyente" tenga swFactura true 
    email - texto(300)- visible grid - visible modal - no requerido 
    telefono - texto(20)- visible grid - visible modal - no requerido
    telefono2 - texto(20)- visible grid - visible modal - no requerido
    activo - boolean - visible grid - visible modal - true por defecto


marca
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto

modelo
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    idMarca - select - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto

tipos vehiculo
    id - bigint - no visible grid - no visible modal
    codigo - texto(20) solo alfanumerico - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto

vehiculo
    id - bigint - no visible grid - no visible modal
    ppu - texto(20) solo alfanumerico - visible grid - visible modal (solo editable en nuevo, deshabilitar al editar) - requerido
    idMarca - select - visible grid - visible modal - requerido
    idModelo - select (depend marca) - visible grid - visible modal - requerido
    anio - int - visible grid - visible modal - opcional
    color - texto(100)  - visible grid - visible modal - requerido
    idTipoVehiculo - select - visible grid - visible modal - opcional
    activo - boolean - visible grid - visible modal - true por defecto



item presupuesto
    tipo (repuesto, desabolladura, puntura, mecanica)

check-list presupuesto 
    

tipo presupuesto 


presupuesto 
    items
    tipo
    ckecklist
    totales visibles
    impuesto



encabezado
    empresa
    tipopresupuesto
    numero
    folio (numero presupuesto en papel)
    cliente (datos personales presupuesto)
    contribuyente (datos a quien se facturara presupuesto)
    vehiculo (datos vehiculo)
    fecha_registro
    fecha_presupuesto
    fecha_vencimiento
    fecha_recepcion
    fecha_entrega
    neto
    exento
    impuesto
    valor_impuesto
    bruto
detalles    
    id
    idTipoDetalle
    descripcion
    swExento
    cantidad
    valor
    total


tipo presupuesto 
    id
    codigo
    descripcion
    detalles (n detalles)
        id
        codigo
        descripcion
        orden
        cantMaxDet
        verSwExento
        verCantidad
        verValor
        verTotal
        nombreTotal



TipoPresupuesto
    id
    idEmpresa
    codigo
    descripcion
    activo              ← NUEVO: esto me permite mejor control de historial

TipoPresupuestoDetalle
    id
    idTipoPresupuesto   ← FK explícito
    codigo
    descripcion
    orden
    cantMaxDet
    codigoGrupo         ← NUEVO: agrupación segura
    nombreTotal         ← display del grupo
    verSwExento
    verCantidad
    verValor
    verTotal



Caso	verCantidad	verValor	verTotal	Comportamiento en presupuesto
1	false	false	false	Sin líneas individuales → valor ingresado directo en subtotales
2	false	true	false	Líneas individuales, cantidad=1 fija, total=valor, subtotal=suma afectos
3	true	true	true	Líneas individuales, total=cant×valor, subtotal=suma afectos

[{
    "id": 1,
    "idEmpresa": 1,
    "codigo": "BS-PYD",
    "descripcion": "PINTURA Y DESABOLLADURA",
    "detalles": [
        {
            "id": "1",
            "codigo": "RP",
            "descripcion": "REPUESTOS",
            "orden": "1",
            "cantMaxDet": "30",
            "verSwExento": false,
            "verCantidad": true,
            "verValor": true,
            "verTotal": true,
            "nombreTotal": "REPUESTOS",
        },
        {
            "id": "2",
            "codigo": "DS",
            "descripcion": "DESABOLLADURA",
            "orden": "2",
            "cantMaxDet": "10",
            "verSwExento": false,
            "verCantidad": false,
            "verValor": false,
            "verTotal": false,
            "nombreTotal": "OBRA DE MANO",
        },
        {
            "id": "3",
            "codigo": "PT",
            "descripcion": "PINTURA",
            "orden": "3",
            "cantMaxDet": "10",
            "verSwExento": false,
            "verCantidad": false,
            "verValor": false,
            "verTotal": false,
            "nombreTotal": "OBRA DE MANO",
        },
        {
            "id": "4",
            "codigo": "MC",
            "descripcion": "MECANICA",
            "orden": "4",
            "cantMaxDet": "10",
            "verSwExento": false,
            "verCantidad": false,
            "verValor": false,
            "verTotal": false,
            "nombreTotal": "OBRA DE MANO",
        }
    ]
},{
    "id": 2,
    "idEmpresa": 2,
    "codigo": "BG-PB",
    "descripcion": "PARABRISAS",
    "detalles": [
        {
            "id": "1",
            "codigo": "RP",
            "descripcion": "REPUESTOS",
            "orden": "1",
            "cantMaxDet": "30",
            "verSwExento": false,
            "verCantidad": true,
            "verValor": true,
            "verTotal": true,
            "nombreTotal": "NETO",
        }
    ]
}]
        






puedes agregar estos mantenedores, seria en otro grupo

empresas
    id - bigint - no visible grid - no visible modal
    rut - texto(20) - visible grid - visible modal - requerido
    razonSocial - texto(300) - visible grid - visible modal - requerido
    nombreFantasia - texto(300) - visible grid - visible modal - no requerido
    giro - texto(300) - visible grid - visible modal - requerido
    actividadEconomica - texto(300) - visible grid - visible modal - requerido
    idRegion - select - visible grid - visible modal - requerido
    idComuna - select (depend idRegion) - visible grid - visible modal - requerido
    direccion - texto(300) - visible grid - visible modal - requerido
    email - texto(300) - visible grid - visible modal - no requerido
    telefono - texto(20) - visible grid - visible modal - no requerido
    numeroResolucionSii - int - visible grid - visible modal - requerido
    fechaResolucionSii - date - visible grid - visible modal - requerido
    ambiente - select (CERTIFICACION | PRODUCCION) - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto

certificadosDte
    id - bigint - no visible grid - no visible modal
    idEmpresa - bigint - no visible grid - no visible modal - requerido
    nombreArchivo - texto(200) - visible grid - no visible modal - requerido
    mimeType - texto(100) - no visible grid - no visible modal - requerido
    base64 - texto(max) - no visible grid - no visible modal - requerido
    password - texto(200) - no visible grid - visible modal - requerido
    rutCertificado - texto(20) - visible grid - visible modal - requerido
    fechaExpiracion - date - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto

tiposDte
    id - bigint - no visible grid - no visible modal
    codigo - int - visible grid - visible modal - requerido
    descripcion - texto(200) - visible grid - visible modal - requerido
    swAfecto - boolean - visible grid - visible modal - false por defecto
    swExento - boolean - visible grid - visible modal - false por defecto
    swElectronico - boolean - visible grid - visible modal - true por defecto
    activo - boolean - visible grid - visible modal - true por defecto

foliosCaf
    id - bigint - no visible grid - no visible modal
    idEmpresa - bigint - no visible grid - no visible modal - requerido
    idTipoDte - select - visible grid - visible modal - requerido
    folioDesde - int - visible grid - visible modal - requerido
    folioHasta - int - visible grid - visible modal - requerido
    folioActual - int - visible grid - visible modal - requerido
    nombreArchivo - texto(200) - visible grid - no visible modal - requerido
    mimeType - texto(100) - no visible grid - no visible modal - requerido
    base64 - texto(max) - no visible grid - no visible modal - requerido
    fechaVencimiento - date - visible grid - visible modal - requerido
    activo - boolean - visible grid - visible modal - true por defecto


1. Modelo encabezado — campos relacionales
Cliente vs Contribuyente:

¿Se seleccionan de un catálogo existente o se ingresan manualmente en el presupuesto?
R: tenia pensado usar ambas, que cuando se vaya escribiendo el nombre, 
¿Pueden ser la misma persona o siempre son distintos?
R: 
¿Qué campos mínimos necesitas de cada uno en el presupuesto?
Vehículo:

¿Se selecciona de un catálogo (la patente trae el resto) o se ingresa libre?

2. Número y Folio
¿El número se auto-genera por el sistema (correlativo)?
R: si, correlativo, inicialmente debe ir en blanco (valor null), al guardar devolvere que correlativo se le asigno (creo que es mejor esta forma por concurrencia) 
¿El folio se ingresa manualmente (es el papel físico que ya tienen)?
R: si, digitable y opcional, en caso de que quieran registra uno hecho en papel al sistema y tengan como asociarlos

3. % IVA
¿Es fijo 19% siempre, o se configura por empresa, o puede variar por documento?
R: el valor por defecto lo podriamos obtener luego de seleccionar el tipo presupuesto, cuando va buscar la config, y este valor quedara registrado en encabezado (% editable, pero usara el obtenido por defecto)

4. Subtotales Caso 1 en el modelo físico
El valor ingresado directamente en subtotales (OBRA DE MANO por ej.) — ¿se guarda en el encabezado como campo? ¿o en una tabla aparte de subtotales?
R: el encabezado solo guarda en db neto, exento, iva, porcentaje iva, bruto
   el subtotal del grupo se guarda en tabla a parte, en json supongo que seria algo asi ({...encabezado, detalles:[{...}, subtotales: [{orden, codigoSubTotal, nombreSubTotal, subtotal}]]}) o si te acomoda otra estructura me avisas

5. Estados del presupuesto
¿Tiene ciclo de vida? Ej: BORRADOR → ENVIADO → APROBADO → FACTURADO
¿O simplemente se guarda y punto?
R: no lo tenia considerado o previsto, seria bueno agregar un combo en encabezado para saber su estado, no se si tenias pensado otra cosa a parte de un combo
¿Un presupuesto guardado puede editarse después?
R: si, se deberia de poder buscar para editar y eliminar

6. Flujo nuevo vs editar
Modo nuevo: ¿algún campo pre-llenado (fecha hoy, empresa por defecto)?
¿Se puede duplicar un presupuesto existente?
R: a que te refieres con duplicar? 2 presupuestos con mismo cliente/vehiculo? (si, se puede) o te refieres a una funcion duplicar existente? (no por ahora) 
o es otra cosa a la que te refieres?

7. Vista de impresión
¿El sistema debe generar un PDF/impresión similar al Excel (layout dos columnas)?
¿O eso es para más adelante?
R: mas adelante

http://app-testbs.vercel.app/*






postgresql://postgres:k4ibshzgKi#7$&#@db.huduyqoynijtgrdsncwd.supabase.co:5432/postgres

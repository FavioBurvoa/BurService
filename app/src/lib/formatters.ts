// ============================================================================
// FORMATTERS — Normalización y display de campos con formato especial
// ============================================================================

// ── Moneda chilena (CLP) ─────────────────────────────────────────────────────

/**
 * Formatea un número a formato peso chileno con separador de miles (punto).
 * Redondea a entero. Acepta number, string numérico, null o undefined.
 * Ejemplos:
 *   1234567   → '1.234.567'
 *   '1234.5'  → '1.235'
 *   null      → ''
 */
export function formatCLP(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, ''));
  if (isNaN(n)) return '';
  return Math.round(n).toLocaleString('es-CL');
}

/**
 * Parsea un string en formato CLP a número.
 * Elimina puntos de miles y convierte coma decimal.
 * Ejemplos:
 *   '1.234.567' → 1234567
 *   '1.234,5'   → 1235
 *   ''          → null
 */
export function parseCLP(s: string): number | null {
  const clean = s.replace(/\./g, '').replace(',', '.').trim();
  if (clean === '') return null;
  const n = parseFloat(clean);
  return isNaN(n) ? null : Math.round(n);
}

// ── RUT chileno ──────────────────────────────────────────────────────────────

/**
 * Valida un RUT chileno: formato normalizado (sin puntos, con guión, mayúsculas)
 * + dígito verificador correcto (algoritmo módulo 11).
 *
 * Acepta formato DB: '12345678-9', '12345678-K'
 * Retorna true si el RUT es válido.
 */
export function validarRut(rut: string): boolean {
  if (!rut) return false;
  const clean = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  // Debe tener formato XXXXXXXX-X (cuerpo numérico + guión + dígito)
  const match = clean.match(/^(\d{1,8})-([0-9K])$/);
  if (!match) return false;
  const cuerpo = match[1];
  const dvIngresado = match[2];
  // Algoritmo módulo 11
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);
  return dvIngresado === dvCalculado;
}

/**
 * Normaliza un RUT al formato DB: sin puntos, con guión, mayúsculas.
 * Ejemplos:
 *   '12.345.678-9' → '12345678-9'
 *   '12345678K'    → '12345678-K'
 *   '12345678-9'   → '12345678-9'  (ya normalizado, sin cambio)
 */
export function normalizeRut(input: string): string {
  if (!input) return '';
  const stripped = input.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  const clean = stripped.replace(/-/g, '');
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

/**
 * Formatea un RUT en formato DB a formato display con puntos.
 * Solo aplica formato cuando el valor contiene guión (está normalizado).
 * Ejemplos:
 *   '12345678-9' → '12.345.678-9'
 *   '12345678-K' → '12.345.678-K'
 *   '123'        → '123'  (sin guión = sin formato, estado intermedio)
 */
export function displayRut(raw: string): string {
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (!upper.includes('-')) return upper;
  const dashIdx = upper.lastIndexOf('-');
  const body = upper.slice(0, dashIdx);
  const verifier = upper.slice(dashIdx + 1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${verifier}`;
}

/**
 * Normaliza una patente al formato DB: sin separadores, mayúsculas.
 * Ejemplos:
 *   'AB-1234' → 'AB1234'
 *   'abcd-12' → 'ABCD12'
 *   'ABCD 12' → 'ABCD12'
 */
export function normalizePatente(input: string): string {
  if (!input) return '';
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Formatea una patente en formato DB a formato display con guión.
 * Detecta automáticamente formato antiguo (AB1234) y nuevo (ABCD12).
 * Ejemplos:
 *   'AB1234'  → 'AB-1234'
 *   'ABCD12'  → 'ABCD-12'
 *   'ABC123'  → 'ABC123'  (formato desconocido, retorna limpio)
 */
export function displayPatente(raw: string): string {
  if (!raw) return '';
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 0) return '';
  // Formato antiguo: 2 letras + 4 dígitos
  if (/^[A-Z]{2}[0-9]{4}$/.test(clean)) {
    return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  }
  // Formato nuevo: 4 letras + 2 dígitos
  if (/^[A-Z]{4}[0-9]{2}$/.test(clean)) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

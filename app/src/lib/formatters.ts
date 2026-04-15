// ============================================================================
// FORMATTERS — Normalización y display de campos con formato especial
// ============================================================================

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

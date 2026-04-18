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
  const match = clean.match(/^(\d{1,8})-([0-9K])$/);
  if (!match) return false;
  const cuerpo = match[1];
  const dvIngresado = match[2];
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

// ============================================================================
// TRANSACCION - TIPOS BASE
// Usados por todas las vistas transaccionales (presupuesto, OT, factura, etc.)
// ============================================================================

import type { ComboOption } from '@/components/mantenedor/types';

export type { ComboOption };

// ============================================================================
// ENTIDADES EMBEBIDAS (snapshot histórico en el documento)
// ============================================================================

export interface VehiculoForm {
  patente: string;
  id_marca: number | null;
  id_modelo: number | null;
  anio: number | null;
  color: string;
}

export interface ClienteForm {
  rut: string;
  nombre: string;
  giro: string;
  id_region: number | null;
  id_comuna: number | null;
  direccion: string;
  email: string;
  telefono: string;
}

export interface ContribuyenteForm {
  rut: string;
  nombre: string;
  giro: string;
  id_region: number | null;
  id_comuna: number | null;
  direccion: string;
  email: string;
  telefono: string;
}

// ============================================================================
// ENCABEZADO DEL PRESUPUESTO
// ============================================================================

export interface EncabezadoForm {
  id?: number;
  numero?: number | null;
  folio: string;
  id_empresa: number | null;
  id_tipo_presupuesto: number | null;
  estado: string;
  porcentaje_iva: number;
  sw_facturar: boolean;
  sw_mismo_cliente: boolean;
  fecha_registro: string;
  fecha_presupuesto: string;
  fecha_vencimiento: string;
  fecha_recepcion: string;
  fecha_entrega: string;
  observacion: string;
  vehiculo: VehiculoForm;
  cliente: ClienteForm;
  contribuyente: ContribuyenteForm | null;
  neto: number;
  exento: number;
  iva: number;
  bruto: number;
}

// ============================================================================
// DETALLE
// ============================================================================

/** Caso derivado de flags ver* del tipo detalle */
export type DetalleCaso = 1 | 2 | 3;
// 1: ver_cantidad=false, ver_valor=false, ver_total=false → solo descripción, subtotal directo
// 2: ver_cantidad=false, ver_valor=true,  ver_total=false → valor por línea, cantidad=1 fija
// 3: ver_cantidad=true,  ver_valor=true,  ver_total=true  → cantidad×valor, total visible

export interface DetalleLinea {
  _tempId: string;     // solo frontend, no se persiste
  id?: number;
  id_tipo_detalle: number;
  descripcion: string;
  sw_exento: boolean;
  cantidad: number | null;
  valor: number | null;
  total: number | null;
}

export interface GrupoDetalle {
  id: number;           // id del TipoPresupuestoDetalle
  codigo: string;
  descripcion: string;
  orden: number;
  cant_max_det: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  ver_sw_exento: boolean;
  ver_cantidad: boolean;
  ver_valor: boolean;
  ver_total: boolean;
  caso: DetalleCaso;
  lineas: DetalleLinea[];
}

// ============================================================================
// SUBTOTALES Y TOTALES
// ============================================================================

export interface SubtotalItem {
  orden: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  subtotal: number;
}

export interface SubtotalGrupoUI {
  orden: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  caso: DetalleCaso;    // determina si es editable (Caso 1) o calculado (2/3)
  valor: number;
}

export interface TotalesCalc {
  subtotales: SubtotalGrupoUI[];
  neto: number;
  exento: number;
  iva: number;
  bruto: number;
}

// ============================================================================
// CONFIGURACIÓN TIPO PRESUPUESTO (endpoint config)
// ============================================================================

export interface TipoDetalleConfig {
  id: number;
  codigo: string;
  descripcion: string;
  orden: number;
  cant_max_det: number;
  codigo_subtotal: string;
  nombre_subtotal: string;
  ver_sw_exento: boolean;
  ver_cantidad: boolean;
  ver_valor: boolean;
  ver_total: boolean;
}

export interface TipoPresupuestoConfig {
  porcentaje_iva: number;
  detalles: TipoDetalleConfig[];
}

// ============================================================================
// LOOKUPS
// ============================================================================

export interface LookupPatenteResult {
  patente:   string;
  id_marca:  number | null;
  id_modelo: number | null;
  anio:      number | null;
  color:     string;
  ultimo_cliente: ClienteForm | null;
}

export interface LookupRutResult {
  id:        number;
  rut:       string;
  nombre:    string;
  giro:      string | null;
  id_region: number | null;
  id_comuna: number | null;
  direccion: string | null;
  email:     string | null;
  telefono:  string | null;
}

// ============================================================================
// PAYLOAD PARA GUARDAR
// ============================================================================

export interface PresupuestoPayload {
  encabezado: EncabezadoForm;
  detalles: Omit<DetalleLinea, '_tempId'>[];
  subtotales: SubtotalItem[];
}

// ============================================================================
// ITEM DE LISTA (versión aplanada para la tabla de presupuestos)
// ============================================================================

export interface PresupuestoListItem {
  id: number;
  numero: number | null;
  folio: string;
  estado: string;
  fecha_presupuesto: string;
  patente: string;
  id_modelo: number | null;
  modelo: string;
  id_marca: number | null;
  marca: string;
  anio: number | null;
  color: string;
  id_cliente: number | null;
  cliente_rut: string;
  cliente_nombre: string;
  neto: number;
  exento: number;
  iva: number;
  bruto: number;
}

// ============================================================================
// HELPERS
// ============================================================================

export function determineCaso(det: {
  ver_cantidad: boolean;
  ver_valor: boolean;
  ver_total: boolean;
}): DetalleCaso {
  if (!det.ver_cantidad && !det.ver_valor && !det.ver_total) return 1;
  if (!det.ver_cantidad && det.ver_valor && !det.ver_total) return 2;
  return 3;
}

export function calcularTotal(cantidad: number | null, valor: number | null): number | null {
  if (valor === null) return null;
  return Math.round((cantidad ?? 1) * valor);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function createEmptyEncabezado(): EncabezadoForm {
  return {
    numero: null,
    folio: '',
    id_empresa: null,
    id_tipo_presupuesto: null,
    estado: 'BORRADOR',
    porcentaje_iva: 19,
    sw_facturar: false,
    sw_mismo_cliente: false,
    fecha_registro: today(),
    fecha_presupuesto: today(),
    fecha_vencimiento: '',
    fecha_recepcion: '',
    fecha_entrega: '',
    observacion: '',
    vehiculo: { patente: '', id_marca: null, id_modelo: null, anio: null, color: '' },
    cliente: { rut: '', nombre: '', giro: '', id_region: null, id_comuna: null, direccion: '', email: '', telefono: '' },
    contribuyente: null,
    neto: 0,
    exento: 0,
    iva: 0,
    bruto: 0,
  };
}

export function buildGruposFromConfig(
  detalles: TipoDetalleConfig[],
  lineasExistentes: DetalleLinea[] = []
): GrupoDetalle[] {
  return detalles.map((det) => {
    const caso = determineCaso(det);
    const lineas = lineasExistentes
      .filter((l) => l.id_tipo_detalle === det.id)
      .map((l) => ({ ...l, _tempId: String(l.id ?? Math.random()) }));
    return { ...det, caso, lineas };
  });
}

export function calcularTotales(
  grupos: GrupoDetalle[],
  subtotalesDirectos: Record<string, number>,
  porcentaje_iva: number
): TotalesCalc {
  // Subtotales únicos por codigo_subtotal
  const subtotalMap = new Map<string, SubtotalGrupoUI>();

  for (const grupo of grupos) {
    const key = grupo.codigo_subtotal;
    if (!subtotalMap.has(key)) {
      subtotalMap.set(key, {
        orden: grupo.orden,
        codigo_subtotal: key,
        nombre_subtotal: grupo.nombre_subtotal,
        caso: grupo.caso,
        valor: 0,
      });
    }

    const entry = subtotalMap.get(key)!;
    if (grupo.caso === 1) {
      entry.valor = subtotalesDirectos[key] ?? 0;
    } else {
      // Acumula totales de líneas afectas
      const sumaAfecta = grupo.lineas.reduce(
        (acc, l) => acc + (!l.sw_exento ? (l.total ?? 0) : 0),
        0
      );
      entry.valor += sumaAfecta;
    }
  }

  const subtotales = Array.from(subtotalMap.values()).sort((a, b) => a.orden - b.orden);

  // Exento: líneas con sw_exento=true en grupos Caso 2/3
  const exento = grupos.reduce((acc, grupo) => {
    if (grupo.caso === 1) return acc;
    return acc + grupo.lineas.reduce((s, l) => s + (l.sw_exento ? (l.total ?? 0) : 0), 0);
  }, 0);

  const neto = subtotales.reduce((s, st) => s + st.valor, 0);
  const iva = Math.round(neto * (porcentaje_iva / 100));
  const bruto = neto + iva + exento;

  return { subtotales, neto, exento, iva, bruto };
}

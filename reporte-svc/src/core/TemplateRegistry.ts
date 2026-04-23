// ============================================================================
// TEMPLATE REGISTRY
// Registro centralizado de templates disponibles.
// Soporta dos tipos:
//   - ReporteBase  → genera Excel / PDF via LibreOffice
//   - DocumentoBase → genera HTML → PDF via Gotenberg Chromium
// ============================================================================

import type { ReporteBase }  from './ReporteBase';
import type { DocumentoBase } from './DocumentoBase';

import { PresupuestoDocumentoReporte }   from '../templates/PresupuestoDocumento';
import { PresupuestoDocumentoV2Reporte } from '../templates/PresupuestoDocumentoV2';
import { PresupuestoDocumentoV3Reporte } from '../templates/PresupuestoDocumentoV3';
import { PresupuestosListaReporte }      from '../templates/PresupuestosLista';
import { SeguimientoClienteReporte }     from '../templates/SeguimientoCliente';
import { HojaVidaVehiculoReporte }       from '../templates/HojaVidaVehiculo';
import { MarcasListaReporte }            from '../templates/MarcasLista';
import { TiposVehiculoListaReporte }     from '../templates/TiposVehiculoLista';
import { TiposContribuyenteListaReporte } from '../templates/TiposContribuyenteLista';
import { TiposDteListaReporte }          from '../templates/TiposDteLista';
import { RegionesListaReporte }          from '../templates/RegionesLista';
import { ModelosListaReporte }           from '../templates/ModelosLista';
import { ComunasListaReporte }           from '../templates/ComunasLista';
import { VehiculosListaReporte }         from '../templates/VehiculosLista';
import { ContribuyentesListaReporte }    from '../templates/ContribuyentesLista';
import { EmpresasListaReporte }          from '../templates/EmpresasLista';
import { TiposPresupuestoListaReporte }          from '../templates/TiposPresupuestoLista';
import { TiposPresupuestoDetallesListaReporte } from '../templates/TiposPresupuestoDetallesLista';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplate = ReporteBase<any> | DocumentoBase<any>;

const registry = new Map<string, AnyTemplate>([
  ['presupuesto-documento',    new PresupuestoDocumentoReporte()],
  ['presupuesto-documento-v2', new PresupuestoDocumentoV2Reporte()],
  ['presupuesto-documento-v3', new PresupuestoDocumentoV3Reporte()],
  ['presupuestos-lista',       new PresupuestosListaReporte()],
  ['seguimiento-cliente',      new SeguimientoClienteReporte()],
  ['hoja-vida-vehiculo',       new HojaVidaVehiculoReporte()],
  ['marcas-lista',             new MarcasListaReporte()],
  ['tipos-vehiculo-lista',     new TiposVehiculoListaReporte()],
  ['tipos-contribuyente-lista', new TiposContribuyenteListaReporte()],
  ['tipos-dte-lista',          new TiposDteListaReporte()],
  ['regiones-lista',           new RegionesListaReporte()],
  ['modelos-lista',            new ModelosListaReporte()],
  ['comunas-lista',            new ComunasListaReporte()],
  ['vehiculos-lista',          new VehiculosListaReporte()],
  ['contribuyentes-lista',     new ContribuyentesListaReporte()],
  ['empresas-lista',           new EmpresasListaReporte()],
  ['tipos-presupuesto-lista',          new TiposPresupuestoListaReporte()],
  ['tipos-presupuesto-detalles-lista', new TiposPresupuestoDetallesListaReporte()],
]);

export function getTemplate(name: string): AnyTemplate | undefined {
  return registry.get(name);
}

export function listTemplates(): string[] {
  return Array.from(registry.keys());
}

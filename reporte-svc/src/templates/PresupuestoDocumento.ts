// ============================================================================
// TEMPLATE: Documento de Presupuesto (HTML → Gotenberg Chromium → PDF)
// Recibe datos pre-armados desde Node API (opcion 9 de sp_presupuestos).
// Layout dos columnas: col_doc=1 izquierda (con precio), col_doc=2 derecha.
// ============================================================================

import { DocumentoBase } from '../core/DocumentoBase';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ItemDoc {
  descripcion: string;
  valor:       number | null;
}

interface GrupoDoc {
  orden:        number;
  col_doc:      1 | 2;
  header:       string;
  cant_max_det: number;
  items:        ItemDoc[];
}

interface PresupuestoDocumentoData {
  empresa: {
    razon_social:    string;
    nombre_fantasia: string | null;
    giro:            string | null;
    direccion:       string | null;
    telefono:        string | null;
    email:           string | null;
    porcentaje_iva:  number;
  };
  encabezado: {
    numero:            number | null;
    fecha_presupuesto: string | null;
    fecha_entrega:     string | null;
    porcentaje_iva:    number;
    neto:              number;
    exento:            number;
    iva:               number;
    bruto:             number;
  };
  cliente: {
    rut:       string | null;
    nombre:    string | null;
    direccion: string | null;
    telefono:  string | null;
  };
  vehiculo: {
    patente:  string | null;
    marca:    string | null;
    modelo:   string | null;
    anio:     number | null;
    color:    string | null;
  };
  grupos:     GrupoDoc[];
  subtotales: Array<{ nombre: string; monto: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return Math.round(n).toLocaleString('es-CL');
}

function fmtFechaLarga(s: string | null | undefined): string {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtFechaCorta(s: string | null | undefined): string {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL');
}

// ─── Template ────────────────────────────────────────────────────────────────

export class PresupuestoDocumentoReporte extends DocumentoBase<PresupuestoDocumentoData> {

  buildHtml(data: PresupuestoDocumentoData): string {
    const { empresa, encabezado: enc, cliente: cli, vehiculo: veh, grupos, subtotales } = data;

    // ── Separar grupos por columna ────────────────────────────────────────
    const leftGrupos  = grupos.filter(g => g.col_doc === 1);
    const rightGrupos = grupos.filter(g => g.col_doc === 2);

    // ── Filas columna izquierda (con padding por grupo) ───────────────────
    type LRow = { isHeader: boolean; desc: string; valor: number | null };
    const leftRows: LRow[] = [];
    let leftHeader = leftGrupos[0]?.header ?? 'Repuestos';

    for (let gi = 0; gi < leftGrupos.length; gi++) {
      const g = leftGrupos[gi];
      if (gi === 0) {
        leftHeader = g.header;
      } else {
        leftRows.push({ isHeader: true, desc: g.header, valor: null });
      }
      for (const item of g.items) {
        leftRows.push({ isHeader: false, desc: item.descripcion, valor: item.valor });
      }
      const pad = g.cant_max_det - g.items.length;
      for (let i = 0; i < pad; i++) {
        leftRows.push({ isHeader: false, desc: '', valor: null });
      }
    }

    // ── Filas columna derecha (con sub-encabezados entre grupos) ──────────
    type RRow = { isHeader: boolean; text: string };
    const rightRows: RRow[] = [];
    let rightHeader = rightGrupos[0]?.header ?? 'Servicio';

    for (let gi = 0; gi < rightGrupos.length; gi++) {
      const g = rightGrupos[gi];
      if (gi === 0) {
        rightHeader = g.header;
      } else {
        rightRows.push({ isHeader: true, text: g.header });
      }
      for (const item of g.items) {
        rightRows.push({ isHeader: false, text: item.descripcion });
      }
      const pad = g.cant_max_det - g.items.length;
      for (let i = 0; i < pad; i++) {
        rightRows.push({ isHeader: false, text: '' });
      }
    }

    // ── Igualar longitudes ────────────────────────────────────────────────
    const maxLen = Math.max(leftRows.length, rightRows.length, 12);
    while (leftRows.length  < maxLen) leftRows.push({ isHeader: false, desc: '', valor: null });
    while (rightRows.length < maxLen) rightRows.push({ isHeader: false, text: '' });

    // ── HTML filas ────────────────────────────────────────────────────────
    const rowsHtml = leftRows.map((l, i) => {
      const r      = rightRows[i];
      const lStyle = l.isHeader ? ' style="font-weight:bold;text-align:center"' : '';
      const rStyle = r.isHeader ? ' style="font-weight:bold;text-align:center"' : '';
      const precio = !l.isHeader && l.valor ? fmt(l.valor) : '';
      return `    <tr>
      <td class="td-left"${lStyle}>${esc(l.desc)}</td>
      <td class="td-price">${precio}</td>
      <td${rStyle}>${esc(r.text)}</td>
    </tr>`;
    }).join('\n');

    // ── Subtotales ────────────────────────────────────────────────────────
    const subtotalesHtml = subtotales.map(s => `    <tr>
      <td class="tot-label">${esc(s.nombre.toUpperCase())}</td>
      <td class="tot-pct"></td>
      <td class="tot-val">${fmt(s.monto)}</td>
    </tr>`).join('\n');

    const subtotal  = enc.neto + enc.exento;
    const giroLineas = (empresa.giro ?? '').split(/[\n|]/).map(l => l.trim()).filter(Boolean);

    // ── HTML completo ─────────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 8.5pt; color: #000; padding: 18px 22px; }

  .co-name { text-align: center; font-size: 16pt; font-weight: bold; line-height: 1.25; }
  .co-fant  { text-align: center; font-size: 12pt; font-style: italic; line-height: 1.25; margin-bottom: 3px; }
  .hdr-grid {
    display: grid; grid-template-columns: 1fr auto 1fr;
    gap: 0 12px; font-size: 8pt; margin-bottom: 2px;
  }
  .hdr-left   { text-align: left;   line-height: 1.4; }
  .hdr-center { text-align: center; line-height: 1.4; }
  .hdr-right  { text-align: right;  line-height: 1.4; }
  .pres-title { text-align: center; font-size: 11pt; font-weight: bold; text-decoration: underline; margin: 3px 0 2px; }
  .fecha-line { margin: 6px 0 8px; }

  .info-tbl { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8.5pt; }
  .info-tbl td { border: 1px solid #000; padding: 2px 6px; vertical-align: middle; white-space: nowrap; }
  .lbl { font-weight: bold; }

  .main-tbl { width: 100%; border-collapse: collapse; font-size: 8pt; }
  .main-tbl th { border: 1px solid #000; padding: 3px 6px; text-align: center; font-weight: bold; }
  .main-tbl td { border: 1px solid #000; padding: 1px 6px; height: 15px; vertical-align: middle; }
  .td-left  { width: 44%; }
  .td-price { width: 12%; text-align: right; }
  .td-right { width: 44%; }

  .tot-wrap  { display: flex; justify-content: flex-end; margin-top: 8px; }
  .tot-tbl   { border-collapse: collapse; font-size: 8.5pt; min-width: 240px; }
  .tot-tbl td { border: 1px solid #000; padding: 2px 8px; }
  .tot-label { font-weight: bold; }
  .tot-pct   { text-align: center; }
  .tot-val   { text-align: right; min-width: 85px; }
  .tot-total td { font-weight: bold; font-size: 9.5pt; }
</style>
</head>
<body>

<div class="co-name">${esc(empresa.razon_social)}</div>
${empresa.nombre_fantasia ? `<div class="co-fant">${esc(empresa.nombre_fantasia)}</div>` : ''}

<div class="hdr-grid">
  <div class="hdr-left">${esc(empresa.direccion ?? '')}</div>
  <div class="hdr-center">${giroLineas.map(l => esc(l)).join('<br>')}</div>
  <div class="hdr-right">${[
    empresa.telefono ? `Fono: ${esc(empresa.telefono)}` : '',
    empresa.email    ? `Email: ${esc(empresa.email)}`   : '',
  ].filter(Boolean).join('<br>')}</div>
</div>

<div class="pres-title">Presupuesto</div>
<div class="fecha-line">Santiago, &nbsp; ${fmtFechaLarga(enc.fecha_presupuesto)}</div>

<table class="info-tbl">
  <tbody>
    <tr>
      <td style="width:65%"><span class="lbl">Nombre:</span> ${esc(cli?.nombre ?? '')}</td>
      <td style="width:15%"><span class="lbl">R.U.T:</span></td>
      <td style="width:20%">${esc(cli?.rut ?? '')}</td>
    </tr>
    <tr>
      <td><span class="lbl">Dirección:</span> ${esc(cli?.direccion ?? '')}</td>
      <td><span class="lbl">Telefono:</span></td>
      <td>${esc(cli?.telefono ?? '')}</td>
    </tr>
    <tr>
      <td><span class="lbl">Marca:</span> ${esc(veh?.marca ?? '')} &nbsp;&nbsp; <span class="lbl">Color:</span> ${esc(veh?.color ?? '')}</td>
      <td><span class="lbl">Fecha entrega:</span></td>
      <td>${fmtFechaCorta(enc.fecha_entrega)}</td>
    </tr>
    <tr>
      <td><span class="lbl">Modelo:</span> ${esc(veh?.modelo ?? '')} &nbsp;&nbsp; <span class="lbl">Patente:</span> ${esc(veh?.patente ?? '')}</td>
      <td><span class="lbl">Año vehiculo:</span></td>
      <td>${veh?.anio ?? ''}</td>
    </tr>
  </tbody>
</table>

<table class="main-tbl">
  <thead>
    <tr>
      <th class="td-left">${esc(leftHeader)}</th>
      <th class="td-price">Precio</th>
      <th class="td-right">${esc(rightHeader)}</th>
    </tr>
  </thead>
  <tbody>
${rowsHtml}
  </tbody>
</table>

<div class="tot-wrap">
  <table class="tot-tbl">
    <tbody>
${subtotalesHtml}
      <tr>
        <td class="tot-label">SUBTOTAL</td>
        <td class="tot-pct"></td>
        <td class="tot-val">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td class="tot-label">IMPUESTO</td>
        <td class="tot-pct">${enc.porcentaje_iva}%</td>
        <td class="tot-val">${fmt(enc.iva)}</td>
      </tr>
      <tr class="tot-total">
        <td class="tot-label">TOTAL</td>
        <td class="tot-pct"></td>
        <td class="tot-val">${fmt(enc.bruto)}</td>
      </tr>
    </tbody>
  </table>
</div>

</body>
</html>`;
  }
}

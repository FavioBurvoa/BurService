// ============================================================================
// TEMPLATE V3: Documento de Presupuesto — Diseño profesional (variante uniforme)
// Igual que V2 pero todos los títulos de grupo (thead + sub-encabezados internos)
// comparten el mismo estilo: fondo #1B3A5C, texto blanco.
// ============================================================================

import { DocumentoBase } from '../core/DocumentoBase';

// ─── Tipos (idénticos a v1/v2) ────────────────────────────────────────────────

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

// ─── Helpers (idénticos a v1/v2) ─────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '';
  return '$\u00a0' + Math.round(n).toLocaleString('es-CL');
}

function fmtFechaCorta(s: string | null | undefined): string {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL');
}

// ─── Template V3 ─────────────────────────────────────────────────────────────

export class PresupuestoDocumentoV3Reporte extends DocumentoBase<PresupuestoDocumentoData> {

  buildHtml(data: PresupuestoDocumentoData): string {
    const { empresa, encabezado: enc, cliente: cli, vehiculo: veh, grupos, subtotales } = data;

    // ── Separar grupos por columna ────────────────────────────────────────
    const leftGrupos  = grupos.filter(g => g.col_doc === 1);
    const rightGrupos = grupos.filter(g => g.col_doc === 2);

    // ── Filas columna izquierda ───────────────────────────────────────────
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

    // ── Filas columna derecha ─────────────────────────────────────────────
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

    // ── HTML filas de la tabla principal ──────────────────────────────────
    const rowsHtml = leftRows.map((l, i) => {
      const r      = rightRows[i];
      const isEven = i % 2 === 0;

      if (l.isHeader) {
        // Sub-encabezado izquierdo — mismo estilo que thead, abarca las 3 celdas
        return `    <tr class="row-subhdr">
      <td colspan="3">${esc(l.desc)}</td>
    </tr>`;
      }
      if (r.isHeader) {
        // Sub-encabezado derecho — solo la celda derecha con estilo thead
        return `    <tr>
      <td class="td-left"></td>
      <td class="td-price"></td>
      <td class="subhdr-right">${esc(r.text)}</td>
    </tr>`;
      }

      const rowClass = isEven ? 'row-even' : 'row-odd';
      const precio   = l.valor != null ? fmt(l.valor) : '';
      return `    <tr class="${rowClass}">
      <td class="td-left">${esc(l.desc)}</td>
      <td class="td-price">${precio}</td>
      <td class="td-right">${esc(r.text)}</td>
    </tr>`;
    }).join('\n');

    // ── Subtotales dinámicos ──────────────────────────────────────────────
    const subtotalesHtml = subtotales.map(s => `      <tr class="tot-row">
        <td class="tot-label">${esc(s.nombre.toUpperCase())}</td>
        <td class="tot-val">${fmt(s.monto)}</td>
      </tr>`).join('\n');

    const subtotal   = enc.neto + enc.exento;
    const hayIva     = enc.porcentaje_iva > 0 && enc.iva > 0;
    const giroLineas = (empresa.giro ?? '').split(/[\n|]/).map(l => l.trim()).filter(Boolean);
    const numStr     = enc.numero != null ? String(enc.numero).padStart(4, '0') : '----';

    const empresaContacto = [
      empresa.direccion,
      empresa.telefono ? `Tel: ${empresa.telefono}` : null,
      empresa.email,
    ].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  /* ── Reset ────────────────────────────────────────── */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 8.5pt;
    color: #1A1A1A;
    background: #fff;
    padding: 24px 28px;
  }

  /* ── HEADER ──────────────────────────────────────── */
  .hdr-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2.5px solid #1B3A5C;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }
  .hdr-empresa { flex: 1; padding-right: 16px; }
  .co-name {
    font-size: 15pt;
    font-weight: bold;
    color: #1B3A5C;
    line-height: 1.2;
  }
  .co-fant {
    font-size: 9.5pt;
    font-style: italic;
    color: #4A5568;
    margin-top: 1px;
  }
  .co-giro {
    font-size: 8pt;
    color: #4A5568;
    margin-top: 2px;
  }
  .co-contacto {
    font-size: 7.5pt;
    color: #6B7280;
    margin-top: 4px;
  }

  /* Caja del número de presupuesto */
  .hdr-num-box {
    background: #1B3A5C;
    color: #fff;
    border-radius: 4px;
    padding: 8px 14px;
    text-align: center;
    min-width: 140px;
    flex-shrink: 0;
  }
  .num-label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
  }
  .num-value {
    font-size: 18pt;
    font-weight: bold;
    line-height: 1.1;
    letter-spacing: 1px;
  }
  .num-fecha {
    font-size: 7.5pt;
    opacity: 0.85;
    margin-top: 4px;
  }
  .num-fecha span { opacity: 0.7; }

  /* ── SECCIÓN CLIENTE / VEHÍCULO ───────────────────── */
  .cv-wrap {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }
  .cv-box {
    background: #F4F6F9;
    border: 1px solid #D0D7DE;
    border-radius: 3px;
    padding: 6px 10px;
  }
  .cv-title {
    font-size: 7pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #1B3A5C;
    border-bottom: 1px solid #D0D7DE;
    padding-bottom: 3px;
    margin-bottom: 5px;
  }
  .cv-row {
    display: flex;
    font-size: 8pt;
    line-height: 1.6;
  }
  .cv-lbl {
    color: #6B7280;
    min-width: 68px;
    flex-shrink: 0;
  }
  .cv-val { color: #1A1A1A; font-weight: 500; }

  /* ── TABLA PRINCIPAL ──────────────────────────────── */
  .main-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 10px;
  }
  .main-tbl thead tr {
    background: #1B3A5C;
    color: #fff;
  }
  .main-tbl th {
    padding: 5px 8px;
    font-weight: bold;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: none;
  }
  .main-tbl th.th-left  { text-align: center; width: 44%; }
  .main-tbl th.th-price { text-align: right;  width: 12%; }
  .main-tbl th.th-right { text-align: center; width: 44%; }

  .main-tbl td {
    padding: 3px 8px;
    height: 16px;
    vertical-align: middle;
    border-bottom: 1px solid #E8ECF0;
    border-left: none;
    border-right: none;
  }
  .td-left  { width: 44%; }
  .td-price { width: 12%; text-align: right; color: #1B3A5C; font-weight: 500; }
  .td-right { width: 44%; }

  .row-even { background: #fff; }
  .row-odd  { background: #F8FAFC; }

  /* Sub-encabezado izquierdo — mismo estilo que thead, abarca las 3 celdas */
  .row-subhdr {
    background: #1B3A5C;
    color: #fff;
  }
  .row-subhdr td {
    font-weight: bold;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    padding: 5px 8px;
    border-bottom: none;
  }
  /* Sub-encabezado derecho — solo la 3ra celda con estilo thead */
  .subhdr-right {
    background: #1B3A5C;
    color: #fff;
    font-weight: bold;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    padding: 5px 8px;
    border-bottom: none;
  }

  /* Línea separadora entre columna izq. y der. */
  .main-tbl td.td-price {
    border-left: 1px solid #D0D7DE;
    border-right: 1px solid #D0D7DE;
  }

  /* ── TOTALES ──────────────────────────────────────── */
  .tot-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }
  .tot-tbl {
    border-collapse: collapse;
    font-size: 8.5pt;
    min-width: 260px;
    border: 1px solid #D0D7DE;
    border-radius: 3px;
    overflow: hidden;
  }
  .tot-row td {
    padding: 3px 12px;
    border-bottom: 1px solid #E8ECF0;
  }
  .tot-label { color: #4A5568; font-size: 8pt; }
  .tot-val   { text-align: right; color: #1A1A1A; min-width: 100px; }

  .tot-subtotal td {
    border-top: 1px solid #D0D7DE;
    padding-top: 4px;
  }
  .tot-iva td { color: #6B7280; font-size: 8pt; }
  .tot-iva .tot-label::after { content: ' (${enc.porcentaje_iva}%)'; font-size: 7.5pt; }

  .tot-total { background: #1B3A5C; }
  .tot-total td {
    color: #fff;
    font-weight: bold;
    font-size: 10pt;
    padding: 6px 12px;
    border-bottom: none;
  }
  .tot-total .tot-val { font-size: 10.5pt; }

  /* ── FOOTER ───────────────────────────────────────── */
  .footer {
    border-top: 1px solid #D0D7DE;
    padding-top: 6px;
    text-align: center;
    font-size: 7.5pt;
    color: #9CA3AF;
  }
</style>
</head>
<body>

<!-- ═══ HEADER ══════════════════════════════════════════════════════════════ -->
<div class="hdr-wrap">
  <div class="hdr-empresa">
    <div class="co-name">${esc(empresa.razon_social)}</div>
    ${empresa.nombre_fantasia ? `<div class="co-fant">${esc(empresa.nombre_fantasia)}</div>` : ''}
    ${giroLineas.length > 0 ? `<div class="co-giro">${giroLineas.map(l => esc(l)).join(' · ')}</div>` : ''}
    ${empresaContacto ? `<div class="co-contacto">${empresaContacto}</div>` : ''}
  </div>
  <div class="hdr-num-box">
    <div class="num-label">Presupuesto</div>
    <div class="num-value">N°&nbsp;${numStr}</div>
    <div class="num-fecha">
      <span>Fecha:</span> ${fmtFechaCorta(enc.fecha_presupuesto)}<br>
      ${enc.fecha_entrega ? `<span>Entrega:</span> ${fmtFechaCorta(enc.fecha_entrega)}` : ''}
    </div>
  </div>
</div>

<!-- ═══ CLIENTE / VEHÍCULO ═══════════════════════════════════════════════════ -->
<div class="cv-wrap">
  <div class="cv-box">
    <div class="cv-title">Cliente</div>
    <div class="cv-row"><span class="cv-lbl">Nombre</span><span class="cv-val">${esc(cli?.nombre ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">R.U.T</span><span class="cv-val">${esc(cli?.rut ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">Dirección</span><span class="cv-val">${esc(cli?.direccion ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">Teléfono</span><span class="cv-val">${esc(cli?.telefono ?? '')}</span></div>
  </div>
  <div class="cv-box">
    <div class="cv-title">Vehículo</div>
    <div class="cv-row"><span class="cv-lbl">Marca</span><span class="cv-val">${esc(veh?.marca ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">Modelo</span><span class="cv-val">${esc(veh?.modelo ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">Patente</span><span class="cv-val">${esc(veh?.patente ?? '')}</span></div>
    <div class="cv-row"><span class="cv-lbl">Año / Color</span><span class="cv-val">${veh?.anio ?? ''}${veh?.anio && veh?.color ? ' · ' : ''}${esc(veh?.color ?? '')}</span></div>
  </div>
</div>

<!-- ═══ TABLA PRINCIPAL ═══════════════════════════════════════════════════════ -->
<table class="main-tbl">
  <thead>
    <tr>
      <th class="th-left">${esc(leftHeader)}</th>
      <th class="th-price">Precio</th>
      <th class="th-right">${esc(rightHeader)}</th>
    </tr>
  </thead>
  <tbody>
${rowsHtml}
  </tbody>
</table>

<!-- ═══ TOTALES ══════════════════════════════════════════════════════════════ -->
<div class="tot-wrap">
  <table class="tot-tbl">
    <tbody>
${subtotalesHtml}
      <tr class="tot-subtotal tot-row">
        <td class="tot-label">SUBTOTAL</td>
        <td class="tot-val">${fmt(subtotal)}</td>
      </tr>
      ${hayIva ? `<tr class="tot-iva tot-row">
        <td class="tot-label">IMPUESTO</td>
        <td class="tot-val">${fmt(enc.iva)}</td>
      </tr>` : ''}
      <tr class="tot-total">
        <td class="tot-label">TOTAL</td>
        <td class="tot-val">${fmt(enc.bruto)}</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ═══ FOOTER ════════════════════════════════════════════════════════════════ -->
<div class="footer">
  Presupuesto válido por 15 días a partir de la fecha de emisión.&nbsp;&nbsp;·&nbsp;&nbsp;Precios en pesos chilenos (CLP).
</div>

</body>
</html>`;
  }
}

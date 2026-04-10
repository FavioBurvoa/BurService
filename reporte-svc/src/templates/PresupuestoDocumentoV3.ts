// ============================================================================
// TEMPLATE V3: Documento de Presupuesto — layout adaptativo por agrupación
//
// Cada agrupación (tipos_presupuesto_detalles) es una mini-tabla independiente
// con columnas dinámicas según ver_cantidad / ver_valor / ver_total.
// El layout del documento se adapta automáticamente:
//   - Solo col_doc=1 o solo col_doc=2 → ancho completo (sides-single)
//   - Ambos lados configurados         → dos columnas   (sides-double)
// ============================================================================

import { DocumentoBase } from '../core/DocumentoBase';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ItemDoc {
  descripcion: string;
  cantidad:    number | null;
  valor:       number | null;
  total:       number | null;
}

interface GrupoDoc {
  orden:        number;
  col_doc:      1 | 2;
  header:       string;
  cant_max_det: number;
  ver_cantidad: boolean;
  ver_valor:    boolean;
  ver_total:    boolean;
  items:        ItemDoc[];
}

interface TipoPresupuestoDoc {
  encabezado_linea1: string | null;
  encabezado_linea2: string | null;
  logo_ancho:        number | null;
  logo_alto:         number | null;
  dias_validez:      number | null;
}

interface LogoDoc {
  mime_type: string;
  archivo:   string;
}

interface PresupuestoDocumentoData {
  empresa: {
    razon_social:         string;
    nombre_fantasia:      string | null;
    giro:                 string | null;
    direccion:            string | null;
    direccion_referencia: string | null;
    telefono:             string | null;
    email:                string | null;
    porcentaje_iva:       number;
  };
  tipo_presupuesto: TipoPresupuestoDoc | null;
  logo:             LogoDoc | null;
  encabezado: {
    numero:            number | null;
    fecha_presupuesto: string | null;
    fecha_entrega:     string | null;
    porcentaje_iva:    number;
    neto:              number;
    exento:            number;
    iva:               number;
    bruto:             number;
    observacion:       string | null;
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
  return '$\u00a0' + Math.round(n).toLocaleString('es-CL');
}

function fmtFechaCorta(s: string | null | undefined): string {
  if (!s) return '';
  return new Date(s + 'T12:00:00').toLocaleDateString('es-CL');
}

function fmtCant(n: number | null | undefined): string {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : n.toLocaleString('es-CL');
}

// ─── Renderizado de lado ──────────────────────────────────────────────────────
//
// Un lado = una única <table>. Los grupos se apilan dentro del <tbody>:
//   - Primer grupo: su nombre va en el <thead> junto a las cabeceras de columna
//   - Grupos siguientes: fila <tr class="grp-hdr"> que actúa de separador
//
// Las columnas se determinan por el SUPERSET de ver_xxx de todos los grupos
// del lado. Si el lado es heterogéneo (un grupo tiene ver_valor y otro no),
// las celdas extras de los grupos que no aplican se dejan vacías.
// Esto garantiza que thead, grp-hdr y filas de datos tengan SIEMPRE el mismo
// número de columnas → las líneas horizontales se alinean entre lados.

function buildLadoHtml(grupos: GrupoDoc[]): string {
  if (grupos.length === 0) return '';

  // Superset de columnas del lado
  const verCant  = grupos.some(g => g.ver_cantidad);
  const verVal   = grupos.some(g => g.ver_valor);
  const verTot   = grupos.some(g => g.ver_total);
  const colCount = 1 + (verCant ? 1 : 0) + (verVal ? 1 : 0) + (verTot ? 1 : 0);

  // Colgroup según superset
  let colgroup: string;
  if (verCant && verVal && verTot) {
    colgroup = '<colgroup><col style="width:52%"><col style="width:12%"><col style="width:20%"><col style="width:16%"></colgroup>';
  } else if (verVal) {
    colgroup = '<colgroup><col style="width:78%"><col style="width:22%"></colgroup>';
  } else {
    colgroup = '<colgroup><col style="width:100%"></colgroup>';
  }

  // thead — nombre del primer grupo + cabeceras de columna
  const theadCols = [
    `<th class="th-desc">${esc(grupos[0].header)}</th>`,
    verCant ? '<th class="th-num">Cant.</th>' : '',
    verVal  ? '<th class="th-num">Valor</th>' : '',
    verTot  ? '<th class="th-num">Total</th>' : '',
  ].join('');

  // tbody — todos los grupos
  const empty: ItemDoc = { descripcion: '', cantidad: null, valor: null, total: null };
  let offset = 0;
  const rows: string[] = [];

  for (let gi = 0; gi < grupos.length; gi++) {
    const g = grupos[gi];

    // Grupos 2+ → fila separadora con nombre del grupo (mismo alto que data row)
    if (gi > 0) {
      rows.push(`    <tr class="grp-hdr"><td colspan="${colCount}">${esc(g.header)}</td></tr>`);
      offset += 1; // grp-hdr ocupa una fila → mantener alternancia even/odd
    }

    // Filas de datos + relleno hasta cant_max_det
    const padCount = Math.max(0, g.cant_max_det - g.items.length);
    const allRows  = [...g.items, ...Array(padCount).fill(empty)];

    for (let i = 0; i < allRows.length; i++) {
      const item     = allRows[i];
      const rowClass = (offset + i) % 2 === 0 ? 'row-even' : 'row-odd';
      const hasData  = item.descripcion.trim() !== '';
      const tdCols   = [
        `<td class="td-desc">${esc(item.descripcion)}</td>`,
        verCant ? `<td class="td-num">${hasData && g.ver_cantidad ? fmtCant(item.cantidad) : ''}</td>` : '',
        verVal  ? `<td class="td-num">${hasData && g.ver_valor    ? fmt(item.valor)        : ''}</td>` : '',
        verTot  ? `<td class="td-num">${hasData && g.ver_total    ? fmt(item.total)        : ''}</td>` : '',
      ].join('');
      rows.push(`    <tr class="${rowClass}">${tdCols}</tr>`);
    }

    offset += allRows.length;
  }

  return `<table class="grp-tbl">
  ${colgroup}
  <thead><tr>${theadCols}</tr></thead>
  <tbody>
${rows.join('\n')}
  </tbody>
</table>`;
}

// ─── Template V3 ─────────────────────────────────────────────────────────────

export class PresupuestoDocumentoV3Reporte extends DocumentoBase<PresupuestoDocumentoData> {

  buildHtml(data: PresupuestoDocumentoData): string {
    const { empresa, tipo_presupuesto: tp, logo, encabezado: enc, cliente: cli, vehiculo: veh, grupos, subtotales } = data;

    // ── Configuración de encabezado ───────────────────────────────────────
    const enc1      = tp?.encabezado_linea1 ?? null;
    const enc2      = tp?.encabezado_linea2 ?? null;
    const logoAncho = tp?.logo_ancho ?? 100;
    const logoAlto  = tp?.logo_alto  ?? 60;
    const diasValid = tp?.dias_validez ?? 15;

    // ── Layout: determinar si hay 1 o 2 lados ────────────────────────────
    const leftGrupos  = grupos.filter(g => g.col_doc === 1);
    const rightGrupos = grupos.filter(g => g.col_doc === 2);
    const isSingle    = leftGrupos.length === 0 || rightGrupos.length === 0;
    const singleGrupos = leftGrupos.length > 0 ? leftGrupos : rightGrupos;

    // ── HTML de grupos por lado ───────────────────────────────────────────
    const sidesHtml = isSingle
      ? `<div class="sides-wrap sides-single">
  <div class="side">
    ${buildLadoHtml(singleGrupos)}
  </div>
</div>`
      : `<div class="sides-wrap sides-double">
  <div class="side side-left">
    ${buildLadoHtml(leftGrupos)}
  </div>
  <div class="side side-right">
    ${buildLadoHtml(rightGrupos)}
  </div>
</div>`;

    // ── Subtotales ────────────────────────────────────────────────────────
    const subtotalesHtml = subtotales.map(s => `      <tr class="tot-row">
        <td class="tot-label">${esc(s.nombre.toUpperCase())}</td>
        <td class="tot-val">${fmt(s.monto)}</td>
      </tr>`).join('\n');

    const subtotal = enc.neto + enc.exento;
    const hayIva   = enc.porcentaje_iva > 0 && enc.iva > 0;
    const numStr   = enc.numero != null ? String(enc.numero).padStart(4, '0') : '----';

    // ── Logo y títulos ────────────────────────────────────────────────────
    const logoHtml = logo
      ? `<img src="data:${esc(logo.mime_type)};base64,${logo.archivo}" style="width:${logoAncho}px;height:${logoAlto}px;object-fit:contain;flex-shrink:0;margin-right:12px;">`
      : '';

    const titulosHtml = [enc1, enc2].filter(Boolean).map((t, i) =>
      i === 0
        ? `<div class="hdr-enc1">${esc(t!)}</div>`
        : `<div class="hdr-enc2">${esc(t!)}</div>`
    ).join('');

    // ── Dirección y contacto ──────────────────────────────────────────────
    const addrLines = [
      empresa.direccion             ? esc(empresa.direccion)                                              : null,
      empresa.direccion_referencia  ? `<span class="hdr-ref">${esc(empresa.direccion_referencia)}</span>` : null,
    ].filter(Boolean).join('<br>');

    const contactLines = [
      empresa.telefono ? `Tel: ${esc(empresa.telefono)}` : null,
      empresa.email    ? esc(empresa.email)              : null,
    ].filter(Boolean).join('<br>');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  /* ── Reset ──────────────────────────────────────── */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 8.5pt;
    color: #1A1A1A;
    background: #fff;
    padding: 24px 28px;
  }

  /* ── HEADER ─────────────────────────────────────── */
  .hdr-top {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  .hdr-titles { flex: 1; text-align: center; padding: 0 10px; }
  .hdr-enc1 {
    font-size: 14pt;
    font-weight: bold;
    color: #1B3A5C;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .hdr-enc2 { font-size: 10pt; font-style: italic; color: #4A5568; line-height: 1.3; }
  .hdr-divider { border: none; border-top: 2.5px solid #1B3A5C; margin: 4px 0; }
  .hdr-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #4A5568;
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .hdr-ref     { color: #6B7280; }
  .hdr-contact { text-align: right; }

  /* Caja número de presupuesto */
  .hdr-num-box {
    background: #1B3A5C;
    color: #fff;
    border-radius: 4px;
    padding: 8px 14px;
    text-align: center;
    min-width: 140px;
    flex-shrink: 0;
  }
  .num-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
  .num-value { font-size: 18pt; font-weight: bold; line-height: 1.1; letter-spacing: 1px; }
  .num-fecha { font-size: 7.5pt; opacity: 0.85; margin-top: 4px; }
  .num-fecha span { opacity: 0.7; }

  /* ── CLIENTE / VEHÍCULO ─────────────────────────── */
  .cv-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
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
  .cv-row  { display: flex; font-size: 8pt; line-height: 1.6; }
  .cv-lbl  { color: #6B7280; min-width: 68px; flex-shrink: 0; }
  .cv-val  { color: #1A1A1A; font-weight: 500; }

  /* ── LAYOUT DE LADOS ────────────────────────────── */
  .sides-wrap { display: flex; gap: 8px; margin-bottom: 10px; align-items: flex-start; }
  .sides-single .side { width: 100%; }
  .sides-double .side { width: calc(50% - 4px); }

  /* Card que envuelve todos los grupos de un lado */
  .side {
    border: 1px solid #D0D7DE;
    border-radius: 3px;
    overflow: hidden;
  }

  /* ── TABLA DE AGRUPACIÓN ────────────────────────── */
  .grp-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }

  /* Encabezado principal (thead) — altura fija, sin wrap */
  .grp-tbl thead tr { background: #1B3A5C; color: #fff; }
  .grp-tbl th {
    height: 16px;
    padding: 1px 8px;
    font-weight: bold;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }
  .grp-tbl th.th-desc { text-align: left; }
  .grp-tbl th.th-num  { text-align: right; }

  /* Separador de grupo secundario — misma altura que fila de datos */
  .grp-hdr { background: #1B3A5C; color: #fff; }
  .grp-hdr td {
    height: 16px;
    padding: 1px 8px;
    font-weight: bold;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: none;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }

  /* Filas de datos — altura fija, sin wrap */
  .grp-tbl td {
    height: 16px;
    padding: 1px 8px;
    vertical-align: middle;
    border-bottom: 1px solid #E8ECF0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 0;
  }
  .grp-tbl tbody tr:last-child td { border-bottom: none; }
  .grp-tbl td.td-desc { text-align: left; }
  .grp-tbl td.td-num  { text-align: right; color: #1B3A5C; font-weight: 500; border-left: 1px solid #D0D7DE; }

  .row-even { background: #fff; }
  .row-odd  { background: #F8FAFC; }

  /* ── OBSERVACIÓN + TOTALES ──────────────────────── */
  .obs-tot-wrap { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 16px; }
  .obs-box {
    flex: 1;
    border: 1px solid #D0D7DE;
    border-left: 3px solid #1B3A5C;
    border-radius: 3px;
    padding: 8px 12px;
    background: #F9FAFB;
    height: 86px;
    overflow: hidden;
  }
  .obs-title {
    font-size: 7pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #1B3A5C;
    margin-bottom: 5px;
  }
  .obs-text { font-size: 8pt; color: #4A5568; line-height: 1.6; white-space: pre-wrap; }

  /* ── TOTALES ────────────────────────────────────── */
  .tot-wrap { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .tot-card {
    border: 1px solid #D0D7DE;
    border-radius: 3px;
    overflow: hidden;
    min-width: 260px;
  }
  .tot-tbl {
    border-collapse: collapse;
    font-size: 8.5pt;
    width: 100%;
  }
  .tot-row td    { padding: 3px 12px; border-bottom: 1px solid #E8ECF0; }
  .tot-label     { color: #4A5568; font-size: 8pt; }
  .tot-val       { text-align: right; color: #1A1A1A; min-width: 100px; }
  .tot-subtotal td { border-top: 1px solid #D0D7DE; padding-top: 4px; }
  .tot-iva td    { color: #6B7280; font-size: 8pt; }
  .tot-iva .tot-label::after { content: ' (${enc.porcentaje_iva}%)'; font-size: 7.5pt; }
  .tot-total     { background: #1B3A5C; }
  .tot-total td  { color: #fff; font-weight: bold; font-size: 10pt; padding: 6px 12px; border-bottom: none; }
  .tot-total .tot-val { font-size: 10.5pt; }

  /* ── FOOTER ─────────────────────────────────────── */
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
<div class="hdr-top">
  ${logoHtml}
  <div class="hdr-titles">
    ${titulosHtml}
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
<hr class="hdr-divider">
<div class="hdr-bottom">
  <div class="hdr-addr">${addrLines}</div>
  <div class="hdr-contact">${contactLines}</div>
</div>

<!-- ═══ CLIENTE / VEHÍCULO ══════════════════════════════════════════════════ -->
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

<!-- ═══ AGRUPACIONES ════════════════════════════════════════════════════════ -->
${sidesHtml}

<!-- ═══ TOTALES ═════════════════════════════════════════════════════════════ -->
<div class="${enc.observacion ? 'obs-tot-wrap' : 'tot-wrap'}">
  ${enc.observacion ? `<div class="obs-box">
    <div class="obs-title">Observaciones</div>
    <div class="obs-text">${esc(enc.observacion)}</div>
  </div>` : ''}
  <div class="tot-card">
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
</div>

<!-- ═══ FOOTER ══════════════════════════════════════════════════════════════ -->
<div class="footer">
  Presupuesto válido por ${diasValid} días a partir de la fecha de emisión.&nbsp;&nbsp;·&nbsp;&nbsp;Precios en pesos chilenos (CLP).
</div>

</body>
</html>`;
  }
}

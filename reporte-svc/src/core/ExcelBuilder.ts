// ============================================================================
// EXCEL BUILDER
// Construye workbooks ExcelJS a partir de un ReporteBase + datos.
//
// Reglas de fidelidad PDF (LibreOffice/Gotenberg):
//   - Fuente: Arial (disponible en LibreOffice sin instalación adicional)
//   - Anchos de columna explícitos — nunca autofit
//   - Bordes: solo 'thin' y 'medium' (los exóticos no mapean bien)
//   - pageSetup con fitToPage para que el PDF no corte columnas
//   - Colores hex puros, sin temas Office
// ============================================================================

import ExcelJS from 'exceljs';
import type { ReporteBase } from './ReporteBase';
import type { ColumnDef, ReporteOptions } from '../types';

// ── Paleta de estilos (centralizada aquí — cambiar en un lugar afecta todos) ──

const STYLES = {
  font:          'Arial',
  fontSize:      10,
  titleSize:     13,
  subtitleSize:  10,

  headerBg:      'FF1F3864',   // azul oscuro
  headerFg:      'FFFFFFFF',   // blanco
  titleFg:       'FF1F3864',

  rowAltBg:      'FFF2F4F8',   // gris muy claro filas pares
  totalBg:       'FFCFD8E3',   // gris azulado fila totales
  totalFg:       'FF1F3864',

  borderColor:   'FFBDC3CB',
} as const;

// ── Formatos de número (Excel format strings) ──

const FORMAT_MAP: Record<string, string> = {
  currency: '#,##0',
  number:   '#,##0.##',
  percent:  '0.00%',
  date:     'DD/MM/YYYY',
  text:     '@',
};

// ============================================================================

export class ExcelBuilder {
  async build<T>(
    reporte: ReporteBase<T>,
    data: T[],
    opts: ReporteOptions = {},
  ): Promise<Buffer> {
    const options: ReporteOptions = { ...reporte.defaultOptions, ...opts };
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'BUR-SERVICE';
    wb.created  = new Date();

    const ws = wb.addWorksheet(reporte.sheetName, {
      pageSetup: {
        orientation:      options.orientation ?? 'landscape',
        fitToPage:        options.fitToPage ?? true,
        fitToWidth:       1,
        fitToHeight:      0,
        paperSize:        9,   // A4
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      },
      properties: { defaultRowHeight: 16 },
    });

    const cols = reporte.columns;
    let currentRow = 1;

    // ── Título ──
    const titleText = opts.title ?? reporte.title;
    ws.mergeCells(currentRow, 1, currentRow, cols.length);
    const titleCell = ws.getCell(currentRow, 1);
    titleCell.value = titleText;
    titleCell.font  = { name: STYLES.font, size: STYLES.titleSize, bold: true, color: { argb: STYLES.titleFg } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.getRow(currentRow).height = 22;
    currentRow++;

    // ── Subtítulo / fecha ──
    if (options.subtitle || options.showDate) {
      const parts: string[] = [];
      if (options.subtitle)  parts.push(options.subtitle);
      if (options.showDate)  parts.push(`Generado: ${new Date().toLocaleDateString('es-CL')}`);
      ws.mergeCells(currentRow, 1, currentRow, cols.length);
      const subCell = ws.getCell(currentRow, 1);
      subCell.value = parts.join('   ·   ');
      subCell.font  = { name: STYLES.font, size: 9, italic: true, color: { argb: 'FF666666' } };
      subCell.alignment = { horizontal: 'left' };
      ws.getRow(currentRow).height = 14;
      currentRow++;
    }

    // ── Fila vacía de separación ──
    currentRow++;

    // ── Cabecera ──
    const headerRow = ws.getRow(currentRow);
    headerRow.height = 20;
    cols.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font  = { name: STYLES.font, size: STYLES.fontSize, bold: true, color: { argb: STYLES.headerFg } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.headerBg } };
      cell.alignment = { horizontal: col.align ?? 'left', vertical: 'middle', wrapText: false };
      cell.border = this.thinBorder();
    });
    currentRow++;

    // ── Filas de datos ──
    const dataStartRow = currentRow;
    data.forEach((row, rowIdx) => {
      const wsRow = ws.getRow(currentRow);
      wsRow.height = 15;
      const isAlt = rowIdx % 2 === 1;

      cols.forEach((col, i) => {
        const cell  = wsRow.getCell(i + 1);
        const raw   = (row as Record<string, unknown>)[col.key];
        cell.value  = this.coerceValue(raw, col);
        cell.font   = { name: STYLES.font, size: STYLES.fontSize, bold: col.bold ?? false };
        cell.fill   = isAlt
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.rowAltBg } }
          : { type: 'pattern', pattern: 'none'  };
        cell.alignment = { horizontal: col.align ?? 'left', vertical: 'middle', wrapText: col.wrap ?? false };
        cell.border = this.thinBorder();
        if (col.format && FORMAT_MAP[col.format]) {
          cell.numFmt = FORMAT_MAP[col.format];
        }
      });
      currentRow++;
    });

    // ── Fila de totales ──
    const hasTotals = cols.some((c) => c.total) && (options.showTotals ?? true);
    if (hasTotals && data.length > 0) {
      const totRow = ws.getRow(currentRow);
      totRow.height = 16;
      cols.forEach((col, i) => {
        const cell = totRow.getCell(i + 1);
        cell.font  = { name: STYLES.font, size: STYLES.fontSize, bold: true, color: { argb: STYLES.totalFg } };
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: STYLES.totalBg } };
        cell.border = this.thinBorder();
        cell.alignment = { horizontal: col.align ?? 'left', vertical: 'middle' };

        if (!col.total) { cell.value = i === 0 ? 'TOTAL' : null; return; }

        const colLetter = this.colLetter(i + 1);
        if (col.total === 'sum') {
          cell.value  = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${currentRow - 1})` };
          if (col.format && FORMAT_MAP[col.format]) cell.numFmt = FORMAT_MAP[col.format];
        } else if (col.total === 'count') {
          cell.value = data.length;
        } else if (col.total === 'avg') {
          cell.value  = { formula: `AVERAGE(${colLetter}${dataStartRow}:${colLetter}${currentRow - 1})` };
          if (col.format && FORMAT_MAP[col.format]) cell.numFmt = FORMAT_MAP[col.format];
        }
      });
    }

    // ── Anchos de columna (siempre explícitos) ──
    ws.columns = cols.map((col, i) => ({
      key:   String(i),
      width: col.width,
    }));

    // ── Freeze header ──
    ws.views = [{ state: 'frozen', ySplit: dataStartRow - 1 }];

    // ── Serializar a buffer ──
    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ── Helpers privados ──

  private coerceValue<U>(raw: unknown, col: ColumnDef<U>): ExcelJS.CellValue {
    if (raw === null || raw === undefined) return null;
    if (col.format === 'date' && typeof raw === 'string') {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw as string : d;
    }
    if ((col.format === 'currency' || col.format === 'number') && typeof raw === 'string') {
      const n = parseFloat(raw);
      return isNaN(n) ? raw : n;
    }
    return raw as ExcelJS.CellValue;
  }

  private thinBorder(): Partial<ExcelJS.Borders> {
    const side: ExcelJS.BorderStyle = 'thin';
    const color = { argb: STYLES.borderColor };
    return { top: { style: side, color }, bottom: { style: side, color }, left: { style: side, color }, right: { style: side, color } };
  }

  private colLetter(n: number): string {
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }
}

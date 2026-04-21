// ============================================================================
// EXCEL PARSER
// Lee un xlsx (Buffer) y devuelve su contenido como JSON: por hoja, headers
// de la primera fila no vacía + filas posteriores keyed por header.
//
// Reglas:
//   - La primera fila con al menos una celda no vacía se toma como header.
//   - Celdas vacías → null.
//   - Filas totalmente vacías se descartan.
//   - Headers se normalizan: trim. Celdas con fórmulas devuelven el result.
// ============================================================================

import ExcelJS from 'exceljs';

export interface ParsedSheet {
  name:    string;
  headers: string[];
  rows:    Record<string, unknown>[];
}

export interface ParsedWorkbook {
  sheets: ParsedSheet[];
}

export class ExcelParser {
  async parse(buffer: Buffer): Promise<ParsedWorkbook> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);

    const sheets: ParsedSheet[] = [];

    wb.eachSheet((ws) => {
      const headers: string[] = [];
      let headerRowNum: number | null = null;

      // El header es la primera fila con >=2 valores no vacíos distintos y
      // sin celdas mergeadas. Esto descarta filas de título/subtítulo
      // mergeadas (ExcelJS expone el valor del master en todas las celdas
      // del rango merge, así que una fila mergeada aparenta tener N celdas
      // con el mismo valor repetido).
      for (let r = 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const values: string[] = [];
        const distinct = new Set<string>();
        let anyMerged = false;
        for (let c = 1; c <= row.cellCount; c++) {
          const cell = row.getCell(c);
          if ((cell as ExcelJS.Cell).isMerged) anyMerged = true;
          const v = this.cellValue(cell);
          const s = v === null || v === undefined ? '' : String(v).trim();
          values.push(s);
          if (s !== '') distinct.add(s);
        }
        if (!anyMerged && distinct.size >= 2) {
          headers.push(...values);
          headerRowNum = r;
          break;
        }
      }

      if (headerRowNum === null) {
        sheets.push({ name: ws.name, headers: [], rows: [] });
        return;
      }

      const trimmedHeaders = headers.map((h) => h.trim()).filter((h) => h !== '');
      const colCount = trimmedHeaders.length;

      const rows: Record<string, unknown>[] = [];
      for (let r = headerRowNum + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const obj: Record<string, unknown> = {};
        let hasContent = false;
        for (let c = 1; c <= colCount; c++) {
          const header = trimmedHeaders[c - 1];
          const v = this.cellValue(row.getCell(c));
          obj[header] = v;
          if (v !== null && v !== undefined && String(v).trim() !== '') hasContent = true;
        }
        if (hasContent) rows.push(obj);
      }

      sheets.push({ name: ws.name, headers: trimmedHeaders, rows });
    });

    return { sheets };
  }

  private cellValue(cell: ExcelJS.Cell): unknown {
    const v = cell.value;
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') {
      if (v instanceof Date) return v.toISOString();
      if ('result' in v && v.result !== undefined) return v.result;
      if ('richText' in v && Array.isArray(v.richText)) {
        return v.richText.map((rt) => rt.text).join('');
      }
      if ('text' in v) return (v as { text: string }).text;
      if ('hyperlink' in v && 'text' in v) return (v as { text: string }).text;
    }
    return v;
  }
}

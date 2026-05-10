// Inspecciona estructura básica de cada archivo
const ExcelJS = require('c:/test/reporte-svc/node_modules/exceljs');
const path = require('path');

const files = ['liv2024.xlsx','liv2025.xlsx','liv2026.xlsx','pes2024.xlsx','pes2025.xlsx','pes2026.xlsx'];

(async () => {
  for (const f of files) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join('c:/test/vehiculos', f));
    console.log('===', f, '===');
    wb.eachSheet((ws) => {
      console.log(`  hoja: "${ws.name}"  filas: ${ws.rowCount}  cols: ${ws.columnCount}`);
      // primera fila no vacía como cabecera
      const headerRow = ws.getRow(1);
      const headers = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
        headers.push(`${col}:${String(cell.value).trim()}`);
      });
      console.log('  fila1:', headers.slice(0, 30).join(' | '));
      // segunda fila
      const r2 = ws.getRow(2);
      const r2v = [];
      r2.eachCell({ includeEmpty: false }, (cell, col) => {
        r2v.push(`${col}:${String(cell.value).trim().slice(0,40)}`);
      });
      console.log('  fila2:', r2v.slice(0, 30).join(' | '));
    });
  }
})();

// Imprime las primeras 12 filas tal cual de cada hoja principal
const ExcelJS = require('c:/test/reporte-svc/node_modules/exceljs');
const path = require('path');

const files = ['liv2024.xlsx','liv2026.xlsx','pes2024.xlsx','pes2026.xlsx'];

(async () => {
  for (const f of files) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join('c:/test/vehiculos', f));
    const ws = wb.worksheets[0];
    console.log('===', f, ' hoja:', ws.name, '===');
    for (let r = 1; r <= 14; r++) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        const v = row.getCell(c).value;
        vals.push(v === null || v === undefined ? '' : String(v).slice(0, 25));
      }
      console.log(`  r${r}: [${vals.join(' | ')}]`);
    }
  }
})();

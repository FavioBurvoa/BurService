// Verifica los xlsx generados: estructura, headers, primeras y últimas filas
const ExcelJS = require('c:/test/reporte-svc/node_modules/exceljs');

const FILES = ['out/tipos-vehiculo.xlsx', 'out/marcas.xlsx', 'out/modelos.xlsx'];

(async () => {
  for (const f of FILES) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(`c:/test/vehiculos/${f}`);
    const ws = wb.worksheets[0];
    console.log(`\n====== ${f} ======`);
    console.log(`hoja: "${ws.name}" filas=${ws.rowCount} cols=${ws.columnCount}`);
    console.log('merges:', JSON.stringify(ws.model.merges || []));

    for (const r of [1, 2, 3, 4, 5, 6, 7]) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        const v = row.getCell(c).value;
        vals.push(v == null ? '' : (typeof v === 'object' ? JSON.stringify(v).slice(0,30) : String(v).slice(0,40)));
      }
      console.log(`  r${r}:`, vals.join(' | '));
    }
    console.log('  ... últimas filas:');
    for (let r = ws.rowCount - 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const vals = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        const v = row.getCell(c).value;
        vals.push(v == null ? '' : String(v).slice(0,40));
      }
      console.log(`  r${r}:`, vals.join(' | '));
    }
  }
})();

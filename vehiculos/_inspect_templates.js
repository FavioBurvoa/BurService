// Inspecciona las plantillas descargadas de la app
const ExcelJS = require('c:/test/reporte-svc/node_modules/exceljs');

const FILES = ['marcas.xlsx', 'modelos.xlsx', 'tipos-vehiculo.xlsx'];

(async () => {
  for (const f of FILES) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(`c:/test/vehiculos/${f}`);
    console.log('======', f, '======');
    console.log('  hojas:', wb.worksheets.map(w => w.name).join(', '));
    wb.eachSheet((ws) => {
      console.log(`  -- hoja "${ws.name}" filas=${ws.rowCount} cols=${ws.columnCount}`);
      // Imprimir primeras 5 filas con tipos
      for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
        const row = ws.getRow(r);
        const vals = [];
        for (let c = 1; c <= ws.columnCount; c++) {
          const cell = row.getCell(c);
          const v = cell.value;
          const t = typeof v;
          vals.push(`[${c}] ${v === null || v === undefined ? '' : (t === 'object' ? JSON.stringify(v).slice(0,40) : String(v).slice(0,40))}`);
        }
        console.log(`    r${r}:`, vals.join(' | '));
      }
      // Inspeccionar estilo / merges en la cabecera
      console.log('    merges:', JSON.stringify(ws.model.merges || []));
      const headerRow = ws.getRow(1);
      const styles = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
        styles.push(`c${col}: font=${JSON.stringify(cell.font || {}).slice(0,80)} fill=${JSON.stringify(cell.fill || {}).slice(0,60)}`);
      });
      console.log('    estilos cabecera:', styles.join(' | '));
      // Column widths
      const widths = [];
      ws.columns.forEach((col, i) => widths.push(`c${i+1}=${col.width}`));
      console.log('    widths:', widths.join(' | '));
    });
    console.log();
  }
})();

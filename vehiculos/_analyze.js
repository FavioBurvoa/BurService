// Analiza estructura del Código SII y diferencias entre años
const ExcelJS = require('c:/test/reporte-svc/node_modules/exceljs');
const path = require('path');

const FILES = {
  liv2024: { file: 'liv2024.xlsx', headerRow: 13 },
  liv2025: { file: 'liv2025.xlsx', headerRow: 13 },
  liv2026: { file: 'liv2026.xlsx', headerRow: 12 },
  pes2024: { file: 'pes2024.xlsx', headerRow: 12 },
  pes2025: { file: 'pes2025.xlsx', headerRow: 12 },
  pes2026: { file: 'pes2026.xlsx', headerRow: 11 },
};

async function loadSheet(file, headerRow) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join('c:/test/vehiculos', file));
  const ws = wb.worksheets[0];
  const headers = [];
  ws.getRow(headerRow).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = cell.value ? String(cell.value).trim() : null;
  });
  // build colIdx by name
  const colByName = {};
  headers.forEach((h, i) => { if (h) colByName[h] = i; });
  return { ws, headers, colByName, dataStart: headerRow + 1 };
}

function getStr(cell) {
  if (cell == null) return '';
  if (typeof cell === 'object' && cell.text) return String(cell.text).trim();
  if (typeof cell === 'object' && cell.result !== undefined) return String(cell.result).trim();
  return String(cell).trim();
}

(async () => {
  // 1) Diferencias de columnas entre años
  console.log('==================== DIFERENCIAS DE COLUMNAS ====================\n');
  for (const grupo of [['liv2024','liv2025','liv2026'], ['pes2024','pes2025','pes2026']]) {
    console.log('Grupo:', grupo.join(' / '));
    for (const k of grupo) {
      const { headers } = await loadSheet(FILES[k].file, FILES[k].headerRow);
      console.log(` ${k}:`, headers.filter(Boolean).join(' | '));
    }
    console.log();
  }

  // 2) Análisis del Código SII para LIV2026 y PES2026
  console.log('==================== ANÁLISIS CÓDIGO SII ====================\n');
  for (const k of ['liv2026','pes2026']) {
    const { ws, colByName, dataStart } = await loadSheet(FILES[k].file, FILES[k].headerRow);
    const cCodigo = colByName['Código SII'];
    const cTipo = colByName['Tipo'];
    const cMarca = colByName['Marca'];
    const cModelo = colByName['Modelo'];
    console.log(`-- ${k} (cols: codigo=${cCodigo} tipo=${cTipo} marca=${cMarca} modelo=${cModelo})`);

    // Diccionarios
    const tipoToPrefix = new Map();   // tipo -> set de prefijo 2 letras
    const marcaToCode  = new Map();   // marca -> set de código 3 dígitos
    const modeloToCode = new Map();   // (marca|modelo) -> set de código 4 dígitos
    let totalRows = 0;
    let len9 = 0;

    for (let r = dataStart; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const codigo = getStr(row.getCell(cCodigo).value);
      if (!codigo) continue;
      totalRows++;
      if (codigo.length === 9) len9++;
      const tipo = getStr(row.getCell(cTipo).value);
      const marca = getStr(row.getCell(cMarca).value);
      const modelo = getStr(row.getCell(cModelo).value);

      const pTipo = codigo.substring(0, 2);
      const pMarca = codigo.substring(2, 5);
      const pModelo = codigo.substring(5, 9);

      if (tipo) {
        if (!tipoToPrefix.has(tipo)) tipoToPrefix.set(tipo, new Set());
        tipoToPrefix.get(tipo).add(pTipo);
      }
      if (marca) {
        if (!marcaToCode.has(marca)) marcaToCode.set(marca, new Set());
        marcaToCode.get(marca).add(pMarca);
      }
      const key = `${marca}|${modelo}`;
      if (marca && modelo) {
        if (!modeloToCode.has(key)) modeloToCode.set(key, new Set());
        modeloToCode.get(key).add(pModelo);
      }
    }

    console.log(`   filas con datos: ${totalRows}, codigos de 9 chars: ${len9}`);

    // Verificar consistencia
    let tipoMulti = 0, marcaMulti = 0, modeloMulti = 0;
    for (const [, set] of tipoToPrefix) if (set.size > 1) tipoMulti++;
    for (const [, set] of marcaToCode)  if (set.size > 1) marcaMulti++;
    for (const [, set] of modeloToCode) if (set.size > 1) modeloMulti++;
    console.log(`   tipos: ${tipoToPrefix.size} (con +1 prefijo: ${tipoMulti})`);
    console.log(`   marcas: ${marcaToCode.size} (con +1 código: ${marcaMulti})`);
    console.log(`   modelos: ${modeloToCode.size} (con +1 código: ${modeloMulti})`);

    // Mostrar muestras
    console.log('   muestra tipos:');
    let n = 0;
    for (const [t, s] of tipoToPrefix) {
      console.log(`     "${t}" -> ${[...s].join(',')}`);
      if (++n >= 10) break;
    }
    console.log('   muestra marcas (primeras 15):');
    n = 0;
    for (const [m, s] of marcaToCode) {
      console.log(`     "${m}" -> ${[...s].join(',')}`);
      if (++n >= 15) break;
    }
    // Mostrar marcas con +1 código (si hay)
    if (marcaMulti > 0) {
      console.log('   marcas con +1 código (problemáticas):');
      let m2 = 0;
      for (const [m, s] of marcaToCode) {
        if (s.size > 1) {
          console.log(`     "${m}" -> ${[...s].join(',')}`);
          if (++m2 >= 10) break;
        }
      }
    }
    console.log();
  }
})();

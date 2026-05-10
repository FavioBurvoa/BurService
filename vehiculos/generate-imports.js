// ============================================================================
// generate-imports.js
//
// Lee liv2026.xlsx y pes2026.xlsx y genera xlsx de import para Saga Ops:
//   out/marcas.xlsx           ← codigo (3) | descripcion | activo
//   out/modelos.xlsx          ← codigo (6 = marca+corr) | descripcion | marca | activo
//   out/tipos-vehiculo.xlsx   ← codigo (3) | descripcion | activo
//
// Replica el formato de las plantillas que entrega la app:
//   fila 1: título mergeado (estilo bold #1F3864 size 13 Arial)
//   fila 2: "Generado: dd-mm-yyyy" mergeado
//   fila 3: vacía
//   fila 4: cabeceras "Código | Descripción | [Marca] | Activo"
//   fila 5+: datos
//
// Idempotencia (stateful):
//   Si los xlsx ya existen en out/, lee los códigos previos y los preserva.
//   Las entradas nuevas reciben el siguiente correlativo disponible.
//
// Comparación de descripciones: trim + UPPER + sin acentos.
// Escritura de descripciones: Title Case por palabra.
// ============================================================================

const path     = require('path');
const fs       = require('fs');
const ExcelJS  = require('c:/test/reporte-svc/node_modules/exceljs');

const SRC_DIR  = 'c:/test/vehiculos';
const OUT_DIR  = path.join(SRC_DIR, 'out');
const SOURCES  = [
  { file: 'liv2026.xlsx', headerNeedle: 'Código SII' },
  { file: 'pes2026.xlsx', headerNeedle: 'Código SII' },
];

const HEADER_FONT = { bold: true, color: { argb: 'FF1F3864' }, size: 13, name: 'Arial' };

// ─── Helpers ────────────────────────────────────────────────────────────────

function normKey(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();
}

function toTitleCase(s) {
  if (s === null || s === undefined) return '';
  // Capitaliza la primera letra de cada secuencia de letras (Unicode-aware).
  // "TROLEBÚS" → "Trolebús", "S/M" → "S/M", "B.M.C." → "B.M.C.",
  // "ASTON MARTIN" → "Aston Martin".
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/(\p{L})(\p{L}*)/gu, (_, first, rest) => first.toUpperCase() + rest);
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function getCellText(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v.text) return String(v.text);
    if (v.result !== undefined) return String(v.result);
    if (Array.isArray(v.richText)) return v.richText.map((rt) => rt.text).join('');
  }
  return String(v);
}

function todayStamp() {
  const d  = new Date();
  const dd = pad(d.getDate(), 2);
  const mm = pad(d.getMonth() + 1, 2);
  return `${dd}-${mm}-${d.getFullYear()}`;
}

// ─── Lectura de fuentes (liv2026 / pes2026) ─────────────────────────────────

async function readSourceRows(file, headerNeedle) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(SRC_DIR, file));
  const ws = wb.worksheets[0];

  // localizar fila de cabecera buscando "Código SII" en columna A
  let headerRow = -1;
  for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
    if (normKey(getCellText(ws.getRow(r).getCell(1))) === normKey(headerNeedle)) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) throw new Error(`No se encontró cabecera "${headerNeedle}" en ${file}`);

  // mapear columnas por nombre
  const colByName = {};
  ws.getRow(headerRow).eachCell({ includeEmpty: false }, (cell, col) => {
    const name = getCellText(cell).trim();
    if (name) colByName[name] = col;
  });
  const cTipo   = colByName['Tipo'];
  const cMarca  = colByName['Marca'];
  const cModelo = colByName['Modelo'];
  if (!cTipo || !cMarca || !cModelo) {
    throw new Error(`Faltan columnas Tipo/Marca/Modelo en ${file}`);
  }

  const out = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row    = ws.getRow(r);
    const tipo   = getCellText(row.getCell(cTipo)).trim();
    const marca  = getCellText(row.getCell(cMarca)).trim();
    const modelo = getCellText(row.getCell(cModelo)).trim();
    if (!marca || !modelo) continue;
    out.push({ tipo, marca, modelo });
  }
  return out;
}

// ─── Lectura de xlsx existente en out/ (para preservar códigos) ─────────────

async function readExistingXlsx(filePath, expectedHeaders) {
  if (!fs.existsSync(filePath)) return [];
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  // detectar fila de cabecera: buscamos la fila donde col 1 == "Código"
  let headerRow = -1;
  for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
    if (normKey(getCellText(ws.getRow(r).getCell(1))) === 'CODIGO') {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) return [];

  const colByName = {};
  ws.getRow(headerRow).eachCell({ includeEmpty: false }, (cell, col) => {
    const name = normKey(getCellText(cell));
    if (name) colByName[name] = col;
  });

  const rows = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj = {};
    for (const h of expectedHeaders) {
      const col = colByName[normKey(h)];
      obj[h] = col ? getCellText(row.getCell(col)).trim() : '';
    }
    if (obj.Código || obj.Descripción) rows.push(obj);
  }
  return rows;
}

// ─── Builders xlsx (replican las plantillas) ────────────────────────────────

function writeWorkbook({ filePath, sheetName, title, headers, widths, dataRows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  const lastCol = String.fromCharCode(64 + headers.length); // A=1 → 'A', B=2 → 'B' ...
  // fila 1: título mergeado
  ws.mergeCells(`A1:${lastCol}1`);
  const r1 = ws.getCell('A1');
  r1.value = title;
  r1.font  = HEADER_FONT;

  // fila 2: generado mergeado
  ws.mergeCells(`A2:${lastCol}2`);
  const r2 = ws.getCell('A2');
  r2.value = `Generado: ${todayStamp()}`;
  r2.font  = HEADER_FONT;

  // fila 3: vacía
  // fila 4: cabeceras
  const r4 = ws.getRow(4);
  headers.forEach((h, i) => {
    const cell = r4.getCell(i + 1);
    cell.value = h;
    cell.font  = HEADER_FONT;
  });

  // anchos
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // datos desde fila 5
  dataRows.forEach((row, i) => {
    const r = ws.getRow(5 + i);
    headers.forEach((h, idx) => { r.getCell(idx + 1).value = row[h]; });
  });

  return wb.xlsx.writeFile(filePath);
}

// ─── Lógica principal ───────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1) leer fuentes
  console.log('Leyendo fuentes...');
  const allRows = [];
  for (const s of SOURCES) {
    const rows = await readSourceRows(s.file, s.headerNeedle);
    console.log(`  ${s.file}: ${rows.length} filas`);
    allRows.push(...rows);
  }
  console.log(`  Total: ${allRows.length} filas\n`);

  // 2) leer xlsx existentes en out/ (state previo)
  const prevTipos   = await readExistingXlsx(path.join(OUT_DIR, 'tipos-vehiculo.xlsx'), ['Código', 'Descripción', 'Activo']);
  const prevMarcas  = await readExistingXlsx(path.join(OUT_DIR, 'marcas.xlsx'),         ['Código', 'Descripción', 'Activo']);
  const prevModelos = await readExistingXlsx(path.join(OUT_DIR, 'modelos.xlsx'),        ['Código', 'Descripción', 'Marca', 'Activo']);
  console.log(`State previo → tipos:${prevTipos.length} marcas:${prevMarcas.length} modelos:${prevModelos.length}\n`);

  // ─── TIPOS ────────────────────────────────────────────────────────────────
  // Mapa: normKey(descripcion) → { codigo, descripcion (preservada) }
  const tiposMap = new Map();
  let tipoMaxCode = 0;

  for (const t of prevTipos) {
    const key = normKey(t.Descripción);
    if (!key) continue;
    const codigo = String(t.Código).trim();
    tiposMap.set(key, { codigo, descripcion: t.Descripción.trim() });
    const num = parseInt(codigo, 10);
    if (!isNaN(num) && num > tipoMaxCode) tipoMaxCode = num;
  }

  // recolectar tipos únicos del source (orden alfabético)
  const tiposSeenInSrc = new Map(); // key → primera variante encontrada
  for (const r of allRows) {
    if (!r.tipo) continue;
    const k = normKey(r.tipo);
    if (!tiposSeenInSrc.has(k)) tiposSeenInSrc.set(k, r.tipo);
  }
  const tiposNuevos = [...tiposSeenInSrc.entries()]
    .filter(([k]) => !tiposMap.has(k))
    .sort((a, b) => a[1].localeCompare(b[1], 'es'));

  for (const [k, descRaw] of tiposNuevos) {
    tipoMaxCode++;
    if (tipoMaxCode > 999) throw new Error('Tipos: superado el límite de 999 códigos');
    tiposMap.set(k, { codigo: pad(tipoMaxCode, 3), descripcion: toTitleCase(descRaw) });
  }
  console.log(`Tipos: ${prevTipos.length} previos + ${tiposNuevos.length} nuevos = ${tiposMap.size} totales`);

  // ─── MARCAS ───────────────────────────────────────────────────────────────
  const marcasMap = new Map(); // normKey(desc) → { codigo, descripcion }
  let marcaMaxCode = 0;

  for (const m of prevMarcas) {
    const key = normKey(m.Descripción);
    if (!key) continue;
    const codigo = String(m.Código).trim();
    marcasMap.set(key, { codigo, descripcion: m.Descripción.trim() });
    const num = parseInt(codigo, 10);
    if (!isNaN(num) && num > marcaMaxCode) marcaMaxCode = num;
  }

  const marcasSeenInSrc = new Map();
  for (const r of allRows) {
    const k = normKey(r.marca);
    if (!k) continue;
    if (!marcasSeenInSrc.has(k)) marcasSeenInSrc.set(k, r.marca);
  }
  const marcasNuevas = [...marcasSeenInSrc.entries()]
    .filter(([k]) => !marcasMap.has(k))
    .sort((a, b) => a[1].localeCompare(b[1], 'es'));

  for (const [k, descRaw] of marcasNuevas) {
    marcaMaxCode++;
    if (marcaMaxCode > 999) throw new Error('Marcas: superado el límite de 999 códigos');
    marcasMap.set(k, { codigo: pad(marcaMaxCode, 3), descripcion: toTitleCase(descRaw) });
  }
  console.log(`Marcas: ${prevMarcas.length} previas + ${marcasNuevas.length} nuevas = ${marcasMap.size} totales`);

  // ─── MODELOS ──────────────────────────────────────────────────────────────
  // Map: `${marcaKey}|${modeloKey}` → { codigo, descripcion, marcaDesc }
  const modelosMap = new Map();
  // Por marca: max correlativo intra-marca
  const corrPorMarca = new Map(); // marcaCodigo (3 dígitos) → maxCorr

  for (const md of prevModelos) {
    const marcaKey  = normKey(md.Marca);
    const modeloKey = normKey(md.Descripción);
    if (!marcaKey || !modeloKey) continue;
    const codigo = String(md.Código).trim();
    modelosMap.set(`${marcaKey}|${modeloKey}`, {
      codigo,
      descripcion: md.Descripción.trim(),
      marcaDesc:   md.Marca.trim(),
    });
    if (codigo.length === 6) {
      const marcaCod = codigo.substring(0, 3);
      const corr     = parseInt(codigo.substring(3, 6), 10);
      if (!isNaN(corr)) {
        const cur = corrPorMarca.get(marcaCod) || 0;
        if (corr > cur) corrPorMarca.set(marcaCod, corr);
      }
    }
  }

  // Recolectar (marca, modelo) únicos del source
  const modelosSeenInSrc = new Map(); // key → { marcaRaw, modeloRaw }
  for (const r of allRows) {
    const mKey = normKey(r.marca);
    const xKey = normKey(r.modelo);
    if (!mKey || !xKey) continue;
    const k = `${mKey}|${xKey}`;
    if (!modelosSeenInSrc.has(k)) modelosSeenInSrc.set(k, { marcaRaw: r.marca, modeloRaw: r.modelo });
  }

  // Agrupar nuevos por marca para asignar correlativos en orden
  const nuevosPorMarca = new Map(); // marcaKey → [{ marcaRaw, modeloRaw }]
  for (const [k, v] of modelosSeenInSrc) {
    if (modelosMap.has(k)) continue;
    const marcaKey = k.split('|')[0];
    if (!nuevosPorMarca.has(marcaKey)) nuevosPorMarca.set(marcaKey, []);
    nuevosPorMarca.get(marcaKey).push(v);
  }

  let modelosNuevosTotal = 0;
  // procesar marcas en orden alfabético para output consistente
  const marcaKeysOrdenadas = [...nuevosPorMarca.keys()].sort();
  for (const marcaKey of marcaKeysOrdenadas) {
    const entry = marcasMap.get(marcaKey);
    if (!entry) {
      // shouldn't happen — la marca debería estar en marcasMap
      console.warn(`  ⚠ marca "${marcaKey}" no encontrada en marcasMap, salto sus modelos`);
      continue;
    }
    const marcaCod = entry.codigo;
    let corr = corrPorMarca.get(marcaCod) || 0;
    const modelosList = nuevosPorMarca.get(marcaKey)
      .sort((a, b) => a.modeloRaw.localeCompare(b.modeloRaw, 'es'));
    for (const { marcaRaw, modeloRaw } of modelosList) {
      corr++;
      if (corr > 999) throw new Error(`Modelos: marca "${marcaRaw}" superó 999 modelos`);
      const codigo = `${marcaCod}${pad(corr, 3)}`;
      const k = `${normKey(marcaRaw)}|${normKey(modeloRaw)}`;
      modelosMap.set(k, {
        codigo,
        descripcion: toTitleCase(modeloRaw),
        marcaDesc:   entry.descripcion, // marca preservada (Title Case)
      });
      modelosNuevosTotal++;
    }
    corrPorMarca.set(marcaCod, corr);
  }
  console.log(`Modelos: ${prevModelos.length} previos + ${modelosNuevosTotal} nuevos = ${modelosMap.size} totales\n`);

  // ─── Escribir xlsx ────────────────────────────────────────────────────────
  // Tipos
  const tiposRows = [...tiposMap.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((t) => ({ 'Código': t.codigo, 'Descripción': t.descripcion, 'Activo': 'true' }));
  await writeWorkbook({
    filePath:  path.join(OUT_DIR, 'tipos-vehiculo.xlsx'),
    sheetName: 'Tipos de Vehículo',
    title:     'Tipos de Vehículo',
    headers:   ['Código', 'Descripción', 'Activo'],
    widths:    [15, 40, 12],
    dataRows:  tiposRows,
  });

  // Marcas
  const marcasRows = [...marcasMap.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((m) => ({ 'Código': m.codigo, 'Descripción': m.descripcion, 'Activo': 'true' }));
  await writeWorkbook({
    filePath:  path.join(OUT_DIR, 'marcas.xlsx'),
    sheetName: 'Marcas',
    title:     'Marcas',
    headers:   ['Código', 'Descripción', 'Activo'],
    widths:    [15, 40, 12],
    dataRows:  marcasRows,
  });

  // Modelos
  const modelosRows = [...modelosMap.values()]
    .sort((a, b) => a.codigo.localeCompare(b.codigo))
    .map((m) => ({
      'Código':      m.codigo,
      'Descripción': m.descripcion,
      'Marca':       m.marcaDesc,
      'Activo':      'true',
    }));
  await writeWorkbook({
    filePath:  path.join(OUT_DIR, 'modelos.xlsx'),
    sheetName: 'Modelos',
    title:     'Modelos',
    headers:   ['Código', 'Descripción', 'Marca', 'Activo'],
    widths:    [15, 40, 25, 12],
    dataRows:  modelosRows,
  });

  console.log('✓ Archivos generados en', OUT_DIR);
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});

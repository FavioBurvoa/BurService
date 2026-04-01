// ============================================================================
// ROUTES — /render
// Único endpoint del servicio.
//
// POST /render
//   Reportes tabulares (ReporteBase):
//     { template, formato: 'xlsx'|'pdf', data: unknown[], options? }
//     → genera Excel; si formato=pdf lo convierte via Gotenberg LibreOffice
//
//   Documentos HTML (DocumentoBase):
//     { template, data: object }
//     → buildHtml() → Gotenberg Chromium → PDF
// ============================================================================

import { Router, type Request, type Response } from 'express';
import { ExcelBuilder }     from '../core/ExcelBuilder';
import { GotenbergClient }  from '../core/GotenbergClient';
import { DocumentoBase }    from '../core/DocumentoBase';
import { getTemplate }      from '../core/TemplateRegistry';
import type { ReporteBase } from '../core/ReporteBase';
import type { RenderRequest } from '../types';

export const renderRouter = Router();

const excelBuilder    = new ExcelBuilder();
const gotenbergClient = new GotenbergClient();

renderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as RenderRequest;
    const { template: templateName, formato, data, options } = body;

    if (!templateName) {
      res.status(400).json({ success: false, message: 'template es requerido' });
      return;
    }

    const template = getTemplate(templateName);
    if (!template) {
      res.status(404).json({ success: false, message: `Template '${templateName}' no encontrado` });
      return;
    }

    // ── Documento HTML → Chromium → PDF ──────────────────────────────────
    if (template instanceof DocumentoBase) {
      const html      = template.buildHtml(data);
      const pdfBuffer = await gotenbergClient.htmlToPdf(html);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${templateName}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    // ── Reporte tabular → Excel / LibreOffice PDF ─────────────────────────
    if (!formato || !Array.isArray(data)) {
      res.status(400).json({ success: false, message: 'formato y data (array) son requeridos para reportes tabulares' });
      return;
    }

    const xlsxBuffer = await excelBuilder.build(template as ReporteBase<unknown>, data, options);

    if (formato === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${templateName}.xlsx"`);
      res.send(xlsxBuffer);
      return;
    }

    if (formato === 'pdf') {
      const pdfBuffer = await gotenbergClient.xlsxToPdf(xlsxBuffer, `${templateName}.xlsx`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${templateName}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    res.status(400).json({ success: false, message: `Formato '${formato}' no soportado. Use: xlsx, pdf` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno';
    res.status(500).json({ success: false, message });
  }
});

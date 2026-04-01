// ============================================================================
// GOTENBERG CLIENT
// Wrapper para convertir .xlsx → .pdf via Gotenberg (LibreOffice).
// ============================================================================

import FormData from 'form-data';
import fetch from 'node-fetch';

const GOTENBERG_URL = process.env['GOTENBERG_URL'] ?? 'http://localhost:3002';

export class GotenbergClient {
  async htmlToPdf(html: string): Promise<Buffer> {
    const form = new FormData();
    form.append('files', Buffer.from(html), {
      filename:    'index.html',
      contentType: 'text/html',
    });
    form.append('paperWidth',  '8.27');   // A4
    form.append('paperHeight', '11.69');  // A4
    form.append('marginTop',    '0.2');
    form.append('marginBottom', '0.2');
    form.append('marginLeft',   '0.2');
    form.append('marginRight',  '0.2');

    const res = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
      method:  'POST',
      body:    form,
      headers: form.getHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gotenberg error ${res.status}: ${text}`);
    }

    return res.buffer();
  }

  async xlsxToPdf(xlsxBuffer: Buffer, filename = 'reporte.xlsx'): Promise<Buffer> {
    const form = new FormData();
    form.append('files', xlsxBuffer, {
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
      method:  'POST',
      body:    form,
      headers: form.getHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gotenberg error ${res.status}: ${text}`);
    }

    const buf = await res.buffer();
    return buf;
  }
}

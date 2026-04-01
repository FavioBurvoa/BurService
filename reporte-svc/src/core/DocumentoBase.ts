// ============================================================================
// DOCUMENTO BASE
// Clase abstracta para documentos HTML → PDF via Gotenberg Chromium.
// Distinto de ReporteBase (que genera Excel tabular).
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class DocumentoBase<T = any> {
  /** Recibe el data object del Node API y retorna HTML completo */
  abstract buildHtml(data: T): string;
}

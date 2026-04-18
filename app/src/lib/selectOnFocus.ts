import type React from 'react';

/**
 * Handler de foco para formularios de carga de datos.
 * Cuando un input de texto recibe foco y tiene contenido, selecciona todo
 * el texto para que el usuario pueda sobrescribir inmediatamente.
 *
 * Se aplica vía delegación de eventos (onFocus en un contenedor padre)
 * para mantenedores y formularios transaccionales por igual.
 *
 * No interfiere con:
 *   - Select / MultiSelect / Autocomplete (aria-autocomplete="list")
 *   - Checkbox, Radio, File, Range, Color, Hidden (excluidos por tipo)
 *   - Textarea (no es <input>)
 *   - Inputs vacíos (nada que seleccionar)
 */
export function selectAllOnFocusHandler(e: React.FocusEvent<HTMLElement>): void {
  const target = e.target as HTMLInputElement;

  // Solo inputs de texto
  if (target.tagName !== 'INPUT') return;

  // Excluir tipos no-texto
  const excludedTypes = new Set([
    'checkbox', 'radio', 'file', 'range', 'color',
    'hidden', 'button', 'submit', 'reset',
  ]);
  if (excludedTypes.has(target.type)) return;

  // Excluir Mantine Select / Autocomplete / MultiSelect
  // Estos componentes marcan el input interno con aria-autocomplete="list"
  if (target.getAttribute('aria-autocomplete') === 'list') return;

  // Solo actuar si hay contenido
  if (!target.value || target.value.length === 0) return;

  // Diferir para que el browser complete el foco nativo antes de seleccionar
  setTimeout(() => {
    // Verificar que el input sigue enfocado al momento de ejecutar
    if (document.activeElement === target) {
      target.select();
    }
  }, 0);
}

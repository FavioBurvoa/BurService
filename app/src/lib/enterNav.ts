import type React from 'react';

/**
 * Handler de teclado para formularios de carga de datos.
 * Enter en un campo de texto mueve el foco al siguiente campo editable
 * dentro del mismo contenedor (el elemento que tiene el onKeyDown).
 *
 * Diseñado para soportar cualquier cascada de dependencias (simple, doble,
 * triple, N niveles) en mantenedores y formularios transaccionales.
 *
 * Mecanismo:
 *   - Mantine procesa el Enter primero (bubble: hijo antes que padre).
 *   - Si hubo selección/cambio, dispara onChange → state update → re-render
 *     que puede habilitar campos dependientes (remount por selectKey).
 *   - Nuestro handler difiere la navegación con setTimeout(0): el callback
 *     corre DESPUÉS del commit de React, por lo que el DOM ya refleja los
 *     campos recién habilitados al buscar el siguiente input.
 *
 * No interfiere con:
 *   - Textarea          → Enter inserta salto de línea (comportamiento nativo)
 *   - Submit button     → Enter activa el botón y envía el formulario
 *   - Switch/Check      → type="checkbox" (excluido del selector)
 *   - File inputs       → type="file" (excluido del selector)
 *   - Select dropdowns  → Mantine gestiona la selección antes que nosotros
 */
export function enterNavHandler(e: React.KeyboardEvent<HTMLElement>): void {
  if (e.key !== 'Enter') return;

  const target = e.target as HTMLElement;

  // Textarea: Enter inserta salto de línea (comportamiento nativo)
  if (target.tagName === 'TEXTAREA') return;

  // Submit button: Enter debe activar el botón y enviar el formulario
  if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') return;

  e.preventDefault();

  // Siempre diferimos la navegación para dar tiempo a React a commitear
  // cualquier re-render disparado por el Enter (ej: onChange de un Select
  // que habilita un campo dependiente). Al correr el setTimeout, el DOM
  // ya refleja el nuevo estado y la búsqueda del siguiente input es correcta.
  const container = e.currentTarget;
  setTimeout(() => navigateToNext(container, target), 0);
}

function navigateToNext(container: HTMLElement, target: HTMLElement): void {
  const inputs = Array.from(
    container.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([aria-disabled="true"]):not([type="hidden"]):not([type="checkbox"]):not([type="file"]), ' +
      'button[type="submit"]:not([disabled])',
    ),
  ).filter((el) => {
    // Excluir elementos visualmente ocultos (collapsed sections, etc.)
    if (el.offsetParent === null) return false;
    // Mantine marca componentes deshabilitados con data-disabled en el wrapper
    // (Select, NumberInput, etc.) además de poner disabled en el <input> interno.
    if (el.closest('[data-disabled]')) return false;
    return true;
  });

  const idx = inputs.indexOf(target);
  if (idx >= 0 && idx < inputs.length - 1) {
    inputs[idx + 1].focus();
  }
}

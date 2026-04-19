import { z, type ZodErrorMap, ZodIssueCode } from 'zod';

/**
 * Error map global de Zod con mensajes en español.
 * Solo se aplica cuando el schema no define un .message explícito.
 * Registrar una vez al boot con z.setErrorMap(esErrorMap).
 */
export const esErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Campo requerido' };
      }
      return { message: `Se esperaba ${issue.expected}, se recibió ${issue.received}` };

    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Formato de email inválido' };
      if (issue.validation === 'url')   return { message: 'URL inválida' };
      if (issue.validation === 'uuid')  return { message: 'UUID inválido' };
      if (issue.validation === 'regex') return { message: 'Formato inválido' };
      return { message: 'Formato inválido' };

    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        if (issue.minimum === 1) return { message: 'Campo requerido' };
        return { message: `Debe tener al menos ${issue.minimum} caracteres` };
      }
      if (issue.type === 'number') return { message: `Debe ser mayor o igual a ${issue.minimum}` };
      if (issue.type === 'array')  return { message: `Debe tener al menos ${issue.minimum} elementos` };
      return { message: `Valor demasiado pequeño` };

    case ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `Debe tener máximo ${issue.maximum} caracteres` };
      if (issue.type === 'number') return { message: `Debe ser menor o igual a ${issue.maximum}` };
      if (issue.type === 'array')  return { message: `Debe tener máximo ${issue.maximum} elementos` };
      return { message: `Valor demasiado grande` };

    case ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Opciones: ${issue.options.join(', ')}` };

    case ZodIssueCode.invalid_date:
      return { message: 'Fecha inválida' };

    case ZodIssueCode.not_finite:
      return { message: 'Debe ser un número finito' };

    case ZodIssueCode.invalid_arguments:
    case ZodIssueCode.invalid_return_type:
      return { message: 'Argumentos inválidos' };

    case ZodIssueCode.unrecognized_keys:
      return { message: `Campos no reconocidos: ${issue.keys.join(', ')}` };

    case ZodIssueCode.invalid_union:
    case ZodIssueCode.invalid_union_discriminator:
      return { message: 'Valor no coincide con ninguna opción válida' };

    case ZodIssueCode.invalid_literal:
      return { message: `Se esperaba el valor: ${JSON.stringify(issue.expected)}` };

    default:
      return { message: ctx.defaultError };
  }
};

export function registerEsErrorMap(): void {
  z.setErrorMap(esErrorMap);
}

// ============================================================================
// ZOD RESOLVER COMPATIBLE CON ZOD 4 + MANTINE FORM
// ============================================================================

import type { z } from 'zod';

/**
 * Resolver de Zod 4 para @mantine/form
 * Reemplaza zodResolver de @mantine/form que no es compatible con Zod 4
 */
export function zodResolver<T>(schema: z.ZodType<T>) {
  return (values: Record<string, any>) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return {};
    }

    const errors: Record<string, string> = {};

    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (path && !errors[path]) {
        errors[path] = issue.message;
      }
    });

    return errors;
  };
}

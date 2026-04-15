'use client';

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import type { TextInputProps } from '@mantine/core';
import { normalizeRut, displayRut } from '@/lib/formatters';

interface RutInputProps extends Omit<TextInputProps, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  /** Llamado en cada keystroke con el valor filtrado (sin puntos, uppercase). */
  onChange?: (raw: string) => void;
  /** Llamado al perder el foco con el valor ya normalizado al formato DB (12345678-9). */
  onBlur?: (normalized: string) => void;
}

/**
 * TextInput especializado para RUT chileno.
 * - Enfocado: muestra el valor en formato DB (sin puntos) para facilitar la edición.
 * - Desenfocado: muestra el valor con formato display (12.345.678-9).
 * - onChange: filtra chars inválidos y fuerza mayúsculas.
 * - onBlur: normaliza al formato DB y notifica con el valor final.
 */
export function RutInput({ value, onChange, onBlur, ...rest }: RutInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholder="12.345.678-9"
      {...rest}
      value={focused ? value : displayRut(value)}
      onChange={(e) => {
        const clean = e.currentTarget.value
          .replace(/\./g, '')
          .replace(/\s/g, '')
          .toUpperCase()
          .replace(/[^0-9K-]/g, '');
        onChange?.(clean);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        const normalized = normalizeRut(value);
        onChange?.(normalized);
        setFocused(false);
        onBlur?.(normalized);
      }}
    />
  );
}

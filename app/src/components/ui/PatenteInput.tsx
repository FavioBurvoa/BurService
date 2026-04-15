'use client';

import { useState } from 'react';
import { TextInput } from '@mantine/core';
import type { TextInputProps } from '@mantine/core';
import { normalizePatente, displayPatente } from '@/lib/formatters';

interface PatenteInputProps extends Omit<TextInputProps, 'value' | 'onChange' | 'onBlur'> {
  value: string;
  /** Llamado en cada keystroke con el valor filtrado (sin separadores, uppercase). */
  onChange?: (raw: string) => void;
  /** Llamado al perder el foco con el valor ya normalizado al formato DB (ABCD12). */
  onBlur?: (normalized: string) => void;
}

/**
 * TextInput especializado para patente vehicular chilena.
 * - Enfocado: muestra el valor en formato DB (sin guión) para facilitar la edición.
 * - Desenfocado: muestra el valor con formato display (AB-1234 o ABCD-12).
 * - onChange: filtra chars inválidos y fuerza mayúsculas.
 * - onBlur: normaliza al formato DB y notifica con el valor final.
 */
export function PatenteInput({ value, onChange, onBlur, ...rest }: PatenteInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholder="ABCD-12"
      {...rest}
      value={focused ? value : displayPatente(value)}
      onChange={(e) => {
        const clean = e.currentTarget.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        onChange?.(clean);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        const normalized = normalizePatente(value);
        onChange?.(normalized);
        setFocused(false);
        onBlur?.(normalized);
      }}
    />
  );
}

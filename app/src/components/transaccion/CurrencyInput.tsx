// ============================================================================
// CURRENCY INPUT
// Input de monto con formato peso chileno (puntos como separadores de miles)
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { TextInput } from '@mantine/core';
import type { TextInputProps } from '@mantine/core';
import { formatCLP, parseCLP } from '@/lib/formatters';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChange'> {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function CurrencyInput({ value, onChange, onKeyDown, ...props }: CurrencyInputProps) {
  const [display, setDisplay] = useState(formatCLP(value));
  const [focused, setFocused] = useState(false);

  // Sync display when value changes externally (not while focused)
  useEffect(() => {
    if (!focused) {
      setDisplay(formatCLP(value));
    }
  }, [value, focused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    // Show raw number for easy editing
    setDisplay(value !== null && value !== undefined ? String(value) : '');
    e.target.select();
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    const parsed = parseCLP(display);
    onChange(parsed);
    setDisplay(formatCLP(parsed));
    props.onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseCLP(display);
      onChange(parsed);
      setDisplay(formatCLP(parsed));
    }
    onKeyDown?.(e);
  };

  return (
    <TextInput
      {...props}
      value={display}
      onChange={(e) => setDisplay(e.currentTarget.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      styles={{
        ...props.styles,
        input: { textAlign: 'right', ...(props.styles as any)?.input },
      }}
    />
  );
}

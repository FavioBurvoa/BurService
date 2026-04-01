// ============================================================================
// MANTINE THEME CONFIGURATION
// ============================================================================

import { createTheme, MantineColorsTuple } from '@mantine/core';

/**
 * Paleta de colores centralizada para BUR-SERVICE
 * Fuente única de verdad para todos los colores del sistema
 */
export const colors = {
  // Colores principales
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#dbeafe',
  secondary: '#64748b',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',

  // Header & Sidebar
  headerBg: '#0f172a',
  sidebarBg: '#0f172a',
  sidebarHover: '#1e293b',
  sidebarActive: '#3b82f6',
  sidebarText: '#f1f5f9',
  sidebarTextInactive: '#94a3b8',

  // Content
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Textos
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textLabel: '#1f2937',
  textMuted: '#9ca3af',

  // Tabla
  tableHeader: '#dbeafe',
  tableHeaderText: '#1e40af',
  tableHover: '#f1f5f9',
  tableText: '#111827',
} as const;

/**
 * Definición de color azul personalizado para Mantine
 */
const customBlue: MantineColorsTuple = [
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a',
];

/**
 * Tipografía del sistema
 * Usa CSS variables inyectadas por next/font en layout.tsx
 */
const fontBody = 'var(--font-body), "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const fontHeading = 'var(--font-heading), "Outfit", var(--font-body), sans-serif';

/**
 * Configuración del tema de Mantine
 */
export const theme = createTheme({
  primaryColor: 'blue',

  colors: {
    blue: customBlue,
  },

  // Tipografía
  fontFamily: fontBody,
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',

  headings: {
    fontFamily: fontHeading,
    fontWeight: '700',
  },

  // Tamaños de fuente
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.9375rem',
    lg: '1.0625rem',
    xl: '1.25rem',
  },

  // Radios de borde
  radius: {
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },

  // Espaciado
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // Breakpoints responsivos
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },

  // Configuración de componentes
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 150ms ease',
        },
      },
    },

    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
      },
    },

    PasswordInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
      },
    },

    Textarea: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
      },
    },

    Select: {
      defaultProps: {
        radius: 'md',
        comboboxProps: {
          shadow: 'md',
        },
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
        dropdown: {
          backgroundColor: colors.bgPrimary,
          border: `1px solid ${colors.border}`,
        },
        option: {
          fontSize: '0.9375rem',
        },
      },
    },

    MultiSelect: {
      defaultProps: {
        radius: 'md',
        comboboxProps: {
          shadow: 'md',
        },
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
        dropdown: {
          backgroundColor: colors.bgPrimary,
          border: `1px solid ${colors.border}`,
        },
        option: {
          fontSize: '0.9375rem',
        },
      },
    },

    Switch: {
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
      },
    },

    NumberInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        label: {
          color: colors.textLabel,
          fontWeight: 600,
          fontSize: '0.8125rem',
          marginBottom: '0.25rem',
        },
        input: {
          color: colors.textPrimary,
          borderColor: colors.border,
          fontSize: '0.9375rem',
        },
      },
    },

    Table: {
      styles: {
        thead: {
          backgroundColor: colors.tableHeader,
        },
        th: {
          color: colors.tableHeaderText,
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        },
        td: {
          color: colors.tableText,
          fontSize: '0.875rem',
        },
      },
    },

    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        padding: 'lg',
      },
    },

    Modal: {
      defaultProps: {
        radius: 'lg',
        padding: 'xl',
      },
      styles: {
        title: {
          color: colors.textPrimary,
          fontWeight: 700,
          fontSize: '1.25rem',
          fontFamily: fontHeading,
        },
        header: {
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: '1rem',
        },
        body: {
          color: colors.textPrimary,
          paddingTop: '1.25rem',
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: 'md',
        shadow: 'xs',
      },
    },

    Notification: {
      defaultProps: {
        radius: 'md',
      },
    },
  },

  defaultRadius: 'md',
  cursorType: 'pointer',

  // Sombras
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
});

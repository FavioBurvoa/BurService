import type { ReactNode } from "react";
import {
  MantineProvider,
  Box,
  Alert,
  Text,
  Group,
  Stack,
  createTheme,
  type MantineColorsTuple
} from "@mantine/core";
import { IconAlertCircle, IconInfoCircle, IconCheck } from "@tabler/icons-react";
import "@mantine/core/styles.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import type { KcContext } from "./KcContext";
import type { I18n } from "./i18n";

// ─── Paleta dark ──────────────────────────────────────────────────────────────
const d = {
  bg:               "#0a0f1e",
  cardBg:           "rgba(255,255,255,0.04)",
  cardBorder:       "rgba(255,255,255,0.09)",
  inputBg:          "rgba(255,255,255,0.07)",
  inputBorder:      "rgba(255,255,255,0.12)",
  textWhite:        "#f1f5f9",
  textMuted:        "#94a3b8",
  textSubtle:       "#64748b",
  linkBlue:         "#60a5fa",
  primary:          "#2563eb",
  primaryLight:     "#3b82f6",
};

// ─── Tema Mantine (dark) ──────────────────────────────────────────────────────
const customBlue: MantineColorsTuple = [
  "#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa",
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"
];

const mantineTheme = createTheme({
  primaryColor:  "blue",
  colors:        { blue: customBlue },
  fontFamily:    '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  defaultRadius: "md",
  cursorType:    "pointer",
  radius: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
  fontSizes: { xs: "0.75rem", sm: "0.8125rem", md: "0.9375rem", lg: "1.0625rem", xl: "1.25rem" },
  breakpoints: { xs: "36em", sm: "48em", md: "62em", lg: "75em", xl: "88em" },

  components: {
    // Inputs dark-themed globalmente
    TextInput: {
      styles: {
        label: {
          color:        d.textMuted,
          fontWeight:   500,
          fontSize:     "0.8125rem",
          marginBottom: "0.25rem",
          letterSpacing: "0.01em",
        },
        input: {
          backgroundColor: d.inputBg,
          borderColor:     d.inputBorder,
          color:           d.textWhite,
          fontSize:        "0.9375rem",
          "&::placeholder": { color: d.textSubtle }
        }
      }
    },
    PasswordInput: {
      styles: {
        label: {
          color:        d.textMuted,
          fontWeight:   500,
          fontSize:     "0.8125rem",
          marginBottom: "0.25rem",
          letterSpacing: "0.01em",
        },
        input: {
          backgroundColor: d.inputBg,
          borderColor:     d.inputBorder,
        },
        innerInput: {
          color:     d.textWhite,
          fontSize:  "0.9375rem",
          "&::placeholder": { color: d.textSubtle }
        },
        visibilityToggle: {
          color: d.textSubtle
        }
      }
    },
    Checkbox: {
      styles: {
        label: { color: d.textMuted, fontSize: "0.875rem", cursor: "pointer" }
      }
    }
  }
});

// ─── Alertas ──────────────────────────────────────────────────────────────────
const alertConfig = {
  error:   { color: "red",    icon: <IconAlertCircle size={16} /> },
  warning: { color: "yellow", icon: <IconAlertCircle size={16} /> },
  success: { color: "green",  icon: <IconCheck       size={16} /> },
  info:    { color: "blue",   icon: <IconInfoCircle  size={16} /> }
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────
type TemplateProps = {
  kcContext:             KcContext;
  i18n:                 I18n;
  doUseDefaultCss:      boolean;
  classes?:             Record<string, string | undefined>;
  headerNode:           ReactNode;
  infoNode?:            ReactNode;
  socialProvidersNode?: ReactNode;
  documentTitle?:       string;
  bodyClassName?:       string;
  children:             ReactNode;
  displayRequiredFields?: boolean;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Template(props: TemplateProps) {
  const { kcContext, children, headerNode, infoNode, socialProvidersNode } = props;

  const { message } = kcContext as { message?: { type: string; summary: string } };

  return (
    <MantineProvider theme={mantineTheme}>

      {/* ── Estilos globales ─────────────────────────────────────────────── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body, #root {
          height: 100%;
          background: ${d.bg};
          color: ${d.textWhite};
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Grain sutil sobre el fondo */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 220px 220px;
          opacity: 0.028;
          pointer-events: none;
          z-index: 0;
        }

        /* Inputs: foco con glow azul */
        .mantine-TextInput-input:focus,
        .mantine-PasswordInput-input:focus-within {
          border-color: rgba(59, 130, 246, 0.65) !important;
          background-color: rgba(255,255,255,0.10) !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18) !important;
          outline: none !important;
        }
      `}</style>

      {/* ── Fondo con gradientes radiales ────────────────────────────────── */}
      <Box
        style={{
          position:   "fixed",
          inset:      0,
          background: `
            radial-gradient(ellipse 75% 55% at 82% 12%, rgba(37,99,235,0.22) 0%, transparent 58%),
            radial-gradient(ellipse 65% 50% at 18% 88%, rgba(79,70,229,0.16) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 50% 42%, rgba(14,165,233,0.09) 0%, transparent 52%),
            ${d.bg}
          `,
          zIndex: 0,
          pointerEvents: "none"
        }}
      />

      {/* ── Layout centrado ───────────────────────────────────────────────── */}
      <Box
        style={{
          position:       "relative",
          zIndex:         1,
          minHeight:      "100vh",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "32px 16px"
        }}
      >
        {/* Card glassmorphism */}
        <Box
          style={{
            width:            "100%",
            maxWidth:         420,
            background:       d.cardBg,
            backdropFilter:   "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border:           `1px solid ${d.cardBorder}`,
            borderRadius:     24,
            padding:          "40px 40px 36px",
            boxShadow: `
              0 0 0 1px rgba(59,130,246,0.07),
              0 32px 80px rgba(0,0,0,0.55),
              0 4px 12px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.07)
            `
          }}
        >
          {/* Logo + nombre */}
          <Stack align="center" gap={6} mb={32}>
            <Box
              style={{
                width:        52,
                height:       52,
                borderRadius: 16,
                background:   `linear-gradient(135deg, ${d.primary} 0%, ${d.primaryLight} 100%)`,
                boxShadow:    `0 0 28px rgba(37,99,235,0.55), 0 8px 20px rgba(0,0,0,0.4)`,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center"
              }}
            >
              <Text
                style={{
                  color:      "white",
                  fontWeight: 800,
                  fontSize:   "1.375rem",
                  fontFamily: '"Outfit", sans-serif',
                  lineHeight: 1
                }}
              >
                S
              </Text>
            </Box>

            <Text
              style={{
                color:         d.textWhite,
                fontFamily:    '"Outfit", sans-serif',
                fontWeight:    700,
                fontSize:      "1.25rem",
                letterSpacing: "-0.02em",
                lineHeight:    1
              }}
            >
              Saga Ops
            </Text>
            <Text style={{ color: d.textSubtle, fontSize: "0.75rem", letterSpacing: "0.03em" }}>
              SISTEMA DE GESTIÓN OPERACIONAL
            </Text>
          </Stack>

          {/* Separador */}
          <Box style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 28 }} />

          {/* Alerta de Keycloak */}
          {message && (
            <Alert
              icon={alertConfig[message.type as keyof typeof alertConfig]?.icon ?? <IconInfoCircle size={16} />}
              color={alertConfig[message.type as keyof typeof alertConfig]?.color ?? "blue"}
              variant="light"
              radius="md"
              mb="lg"
              styles={{ message: { fontSize: "0.875rem" } }}
            >
              {message.summary}
            </Alert>
          )}

          {/* Header para páginas DefaultPage (register, forgot-password, etc.) */}
          {headerNode && (
            <Text
              mb="lg"
              style={{
                fontFamily:    '"Outfit", sans-serif',
                fontWeight:    700,
                fontSize:      "1.375rem",
                color:         d.textWhite,
                letterSpacing: "-0.02em"
              }}
            >
              {headerNode}
            </Text>
          )}

          {/* Contenido principal */}
          {children}

          {/* Info node */}
          {infoNode && (
            <Box mt="lg" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16 }}>
              {infoNode}
            </Box>
          )}

          {/* Social providers */}
          {socialProvidersNode && (
            <>
              <Group gap={12} my="lg" align="center">
                <Box style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <Text size="xs" style={{ color: d.textSubtle, whiteSpace: "nowrap" }}>
                  o continúa con
                </Text>
                <Box style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </Group>
              {socialProvidersNode}
            </>
          )}
        </Box>

        {/* Footer */}
        <Text
          mt="xl"
          size="xs"
          style={{ color: d.textSubtle, textAlign: "center" }}
        >
          © {new Date().getFullYear()} Saga Ops — Todos los derechos reservados
        </Text>
      </Box>
    </MantineProvider>
  );
}

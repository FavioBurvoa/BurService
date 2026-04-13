import { useEffect, useRef } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import {
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Stack,
  Group,
  Text,
  Title,
  Anchor
} from "@mantine/core";

// ─── Colores dark (coherentes con Template) ───────────────────────────────────
const d = {
  textWhite:   "#f1f5f9",
  textMuted:   "#94a3b8",
  textSubtle:  "#64748b",
  linkBlue:    "#60a5fa",
  primary:     "#2563eb",
  primaryLight:"#3b82f6",
  inputBorder: "rgba(255,255,255,0.12)",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Props = PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>;

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Login(props: Props) {
  const { kcContext, i18n, Template, doUseDefaultCss, classes } = props;

  const {
    url,
    realm,
    login,
    auth,
    usernameHidden,
    social,
    registrationDisabled,
    messagesPerField
  } = kcContext;

  const { msg } = i18n;

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!usernameHidden && !login.username) {
      usernameRef.current?.focus();
    } else {
      passwordRef.current?.focus();
    }
  }, [usernameHidden, login.username]);

  // ─── Social providers ───────────────────────────────────────────────────────
  const socialProvidersNode =
    social?.displayInfo && (social?.providers?.length ?? 0) > 0 ? (
      <Stack gap="xs">
        {social.providers!.map((provider) => (
          <Button
            key={provider.alias}
            component="a"
            href={provider.loginUrl}
            variant="default"
            fullWidth
            radius="md"
            size="md"
            styles={{
              root: {
                background:  "rgba(255,255,255,0.06)",
                border:      `1px solid ${d.inputBorder}`,
                color:       d.textMuted,
                fontWeight:  500,
                fontSize:    "0.9rem",
                "&:hover": {
                  background: "rgba(255,255,255,0.10)"
                }
              }
            }}
          >
            {provider.displayName}
          </Button>
        ))}
      </Stack>
    ) : null;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={null}
      socialProvidersNode={socialProvidersNode}
    >
      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <Stack gap={4} mb={24}>
        <Title
          order={2}
          style={{
            fontFamily:    '"Outfit", sans-serif',
            fontWeight:    700,
            fontSize:      "1.5rem",
            color:         d.textWhite,
            letterSpacing: "-0.025em",
            lineHeight:    1.2
          }}
        >
          Bienvenido de vuelta
        </Title>
        <Text size="sm" style={{ color: d.textMuted }}>
          Ingresa tus credenciales para continuar
        </Text>
      </Stack>

      {/* ── Formulario ───────────────────────────────────────────────────── */}
      <form id="kc-form-login" action={url.loginAction} method="post">
        <Stack gap="md">

          {/* Campo oculto WebAuthn */}
          {auth.selectedCredential !== undefined && (
            <input
              type="hidden"
              id="selectedCredentialId"
              name="credentialId"
              value={auth.selectedCredential}
            />
          )}

          {/* Usuario / Email */}
          {!usernameHidden && (
            <TextInput
              ref={usernameRef}
              id="username"
              name="username"
              label={
                !realm.loginWithEmailAllowed
                  ? msg("username")
                  : !realm.registrationEmailAsUsername
                  ? msg("usernameOrEmail")
                  : msg("email")
              }
              defaultValue={login.username ?? ""}
              autoComplete="username"
              error={
                messagesPerField.existsError("username", "password")
                  ? messagesPerField.get("username")
                  : undefined
              }
            />
          )}

          {/* Contraseña */}
          <PasswordInput
            ref={passwordRef}
            id="password"
            name="password"
            label={msg("password")}
            autoComplete="current-password"
            error={
              messagesPerField.existsError("password") &&
              !messagesPerField.existsError("username", "password")
                ? messagesPerField.get("password")
                : undefined
            }
          />

          {/* Recuérdame + Olvidé contraseña */}
          {(realm.rememberMe || realm.resetPasswordAllowed) && (
            <Group justify="space-between" align="center" mt={-4}>
              {realm.rememberMe && !usernameHidden ? (
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  label={msg("rememberMe")}
                  defaultChecked={Boolean(login.rememberMe)}
                  size="sm"
                />
              ) : (
                <span />
              )}

              {realm.resetPasswordAllowed && (
                <Anchor
                  href={url.loginResetCredentialsUrl}
                  size="sm"
                  style={{ color: d.linkBlue, fontWeight: 500 }}
                >
                  {msg("doForgotPassword")}
                </Anchor>
              )}
            </Group>
          )}

          {/* Botón de acceso */}
          <Button
            type="submit"
            id="kc-login"
            name="login"
            fullWidth
            size="md"
            mt={4}
            style={{
              background:    `linear-gradient(135deg, ${d.primary} 0%, ${d.primaryLight} 100%)`,
              boxShadow:     "0 4px 18px rgba(37,99,235,0.45)",
              border:        "none",
              fontWeight:    600,
              fontSize:      "0.9375rem",
              letterSpacing: "0.01em",
              transition:    "all 180ms ease"
            }}
          >
            {msg("doLogIn")}
          </Button>
        </Stack>
      </form>

      {/* ── Registro ─────────────────────────────────────────────────────── */}
      {realm.password && realm.registrationAllowed && !registrationDisabled && (
        <Text ta="center" mt="lg" size="sm" style={{ color: d.textMuted }}>
          ¿No tienes cuenta?{" "}
          <Anchor
            href={url.registrationUrl}
            style={{ color: d.linkBlue, fontWeight: 600 }}
          >
            Regístrate aquí
          </Anchor>
        </Text>
      )}
    </Template>
  );
}

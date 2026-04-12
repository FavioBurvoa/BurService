import type { Meta, StoryObj } from "@storybook/react-vite";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login.ftl" });

const meta = {
  title: "login/Login",
  component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Estado base ──────────────────────────────────────────────────────────────
export const Default: Story = {
  args: {}
};

// ─── Con usuario pre-relleno ──────────────────────────────────────────────────
export const WithUsername: Story = {
  args: {
    kcContext: {
      login: { username: "admin@sagaops.cl" }
    }
  }
};

// ─── Error de credenciales ────────────────────────────────────────────────────
export const WithLoginError: Story = {
  args: {
    kcContext: {
      message: {
        type: "error",
        summary: "Nombre de usuario o contraseña incorrectos."
      }
    }
  }
};

// ─── Mensaje de éxito (ej. contraseña actualizada) ────────────────────────────
export const WithSuccessMessage: Story = {
  args: {
    kcContext: {
      message: {
        type: "success",
        summary: "Tu contraseña ha sido actualizada correctamente."
      }
    }
  }
};

// ─── Con recuérdame + olvidé contraseña ───────────────────────────────────────
export const WithRememberMe: Story = {
  args: {
    kcContext: {
      realm: {
        rememberMe:           true,
        resetPasswordAllowed: true
      }
    }
  }
};

// ─── Login solo con email (sin username) ──────────────────────────────────────
export const EmailOnly: Story = {
  args: {
    kcContext: {
      realm: {
        loginWithEmailAllowed:        true,
        registrationEmailAsUsername:  true
      }
    }
  }
};

// ─── Con link de registro ─────────────────────────────────────────────────────
export const WithRegistrationLink: Story = {
  args: {
    kcContext: {
      realm: {
        registrationAllowed: true,
        password:            true
      },
      registrationDisabled: false
    }
  }
};

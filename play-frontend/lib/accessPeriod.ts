import type { auth } from "play";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

interface AccessPeriodUser {
  role: auth.UserRole;
  isEnabled: boolean;
  accessExpiresAt: string | null;
}

export interface AccessPeriodSummary {
  compactLabel: string;
  label: string;
  detail: string;
  daysRemaining: number | null;
  state: "permanent" | "active" | "expired" | "disabled";
}

function formatExpirationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function getAccessPeriodSummary(
  user: AccessPeriodUser,
  now = Date.now()
): AccessPeriodSummary {
  if (!user.isEnabled) {
    return {
      compactLabel: "Desativado",
      label: "Acesso desativado",
      detail: "Entre em contato com o administrador para reativar.",
      daysRemaining: 0,
      state: "disabled",
    };
  }

  if (user.role === "superadmin" || !user.accessExpiresAt) {
    return {
      compactLabel: "Sem prazo",
      label:
        user.role === "superadmin"
          ? "Acesso permanente"
          : "Acesso por tempo indeterminado",
      detail: "Seu período de uso não possui data de expiração.",
      daysRemaining: null,
      state: "permanent",
    };
  }

  const expiration = new Date(user.accessExpiresAt);
  const remainingMilliseconds = expiration.getTime() - now;
  const daysRemaining = Math.max(
    0,
    Math.ceil(remainingMilliseconds / DAY_IN_MILLISECONDS)
  );

  if (daysRemaining === 0) {
    return {
      compactLabel: "Expirado",
      label: "Período de uso encerrado",
      detail: `O acesso terminou em ${formatExpirationDate(
        user.accessExpiresAt
      )}.`,
      daysRemaining: 0,
      state: "expired",
    };
  }

  return {
    compactLabel: `${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"}`,
    label: `${daysRemaining} ${
      daysRemaining === 1 ? "dia restante" : "dias restantes"
    }`,
    detail: `Acesso disponível até ${formatExpirationDate(
      user.accessExpiresAt
    )}.`,
    daysRemaining,
    state: "active",
  };
}

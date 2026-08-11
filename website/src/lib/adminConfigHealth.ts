import { isAdminPinConfigured } from "@/lib/adminSession";

export type AdminConfigCheck = {
  id: string;
  label: string;
  hint: string;
  ok: boolean;
};

/** Presence-only checks : never expose secret values. */
export function getAdminConfigHealth(): AdminConfigCheck[] {
  const pinOk = isAdminPinConfigured();
  const sessionOk = Boolean(
    process.env.BETA_ADMIN_SESSION_SECRET?.trim() &&
      process.env.BETA_ADMIN_SESSION_SECRET.trim().length >= 16,
  );
  const adminSecretOk = Boolean(process.env.BETA_WEBSITE_ADMIN_SECRET?.trim());
  const waitlistAdminUrlOk = Boolean(
    process.env.BETA_WAITLIST_ADMIN_FUNCTION_URL?.trim(),
  );
  const waitlistUrlOk = Boolean(process.env.BETA_WAITLIST_FUNCTION_URL?.trim());
  const validateUrlOk = Boolean(process.env.BETA_VALIDATE_FUNCTION_URL?.trim());

  return [
    {
      id: "pin",
      label: "Minicode admin",
      hint: "BETA_ADMIN_PIN / ADMIN_MINICODE",
      ok: pinOk,
    },
    {
      id: "session",
      label: "Secret session (≥ 16 car.)",
      hint: "BETA_ADMIN_SESSION_SECRET",
      ok: sessionOk || (pinOk && process.env.NODE_ENV !== "production"),
    },
    {
      id: "admin_secret",
      label: "Secret API Cloud Functions",
      hint: "BETA_WEBSITE_ADMIN_SECRET",
      ok: adminSecretOk,
    },
    {
      id: "waitlist_admin_url",
      label: "URL admin waitlist",
      hint: "BETA_WAITLIST_ADMIN_FUNCTION_URL",
      ok: waitlistAdminUrlOk,
    },
    {
      id: "waitlist_url",
      label: "URL inscription publique",
      hint: "BETA_WAITLIST_FUNCTION_URL",
      ok: waitlistUrlOk,
    },
    {
      id: "validate_url",
      label: "URL validation accès bêta",
      hint: "BETA_VALIDATE_FUNCTION_URL",
      ok: validateUrlOk,
    },
  ];
}

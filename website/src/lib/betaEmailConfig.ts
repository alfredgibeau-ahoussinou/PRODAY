/** Expéditeur production ProDay (domaine vérifié sur Resend). */
export const BETA_FROM_EMAIL_PRODUCTION = "ProDay <contact@proday.app>";

const TEST_FROM = "Proday <onboarding@resend.dev>";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export function isResendTestFrom(from: string): boolean {
  return from.includes("onboarding@resend.dev");
}

/**
 * Expéditeur Resend pour la bêta.
 * En production : exige un domaine vérifié (contact@proday.app), pas onboarding@resend.dev.
 */
export function resolveBetaFromEmail(): string {
  const configured = process.env.BETA_FROM_EMAIL?.trim();
  if (configured) {
    if (isProductionRuntime() && isResendTestFrom(configured)) {
      throw new Error(
        "BETA_FROM_EMAIL ne peut pas être onboarding@resend.dev en production. Vérifiez proday.app sur Resend et utilisez contact@proday.app."
      );
    }
    return configured;
  }

  if (isProductionRuntime()) {
    return BETA_FROM_EMAIL_PRODUCTION;
  }

  return TEST_FROM;
}

export function resolveBetaSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "https://proday.app";
}

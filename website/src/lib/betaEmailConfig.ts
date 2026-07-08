export function resolveBetaSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;
  const netlify = process.env.URL?.trim() || process.env.DEPLOY_URL?.trim();
  if (netlify) return netlify.startsWith("http") ? netlify : `https://${netlify}`;
  return "https://proday75.fr";
}

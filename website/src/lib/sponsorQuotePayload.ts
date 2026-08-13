/** Parsing / validation whitelist pour /api/sponsor/quote (aligné Cloud Function). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PACKAGE_TIERS = new Set([
  "starter",
  "territorial",
  "national",
  "custom",
] as const);

const MAX_STRING = 200;
const MAX_ARRAY = 12;
const MAX_MESSAGE = 2000;
const MAX_EMAIL = 254;

export type SanitizedSponsorQuote = {
  companyName: string;
  contactEmail: string;
  contactName: string;
  contactRole?: string;
  phone?: string;
  budget?: string;
  goals: string[];
  audience: string[];
  regions: string[];
  sports: string[];
  message?: string;
  packageTier: "starter" | "territorial" | "national" | "custom";
  sector?: string;
  source: "website" | "app";
  sponsorUid?: string;
};

function trimStr(value: unknown, max = MAX_STRING): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function trimArray(value: unknown, max = MAX_ARRAY): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim().slice(0, MAX_STRING))
    .filter(Boolean)
    .slice(0, max);
}

function resolvePackageTier(
  value: unknown,
): SanitizedSponsorQuote["packageTier"] {
  const tier = trimStr(value, 32).toLowerCase();
  return PACKAGE_TIERS.has(tier as SanitizedSponsorQuote["packageTier"])
    ? (tier as SanitizedSponsorQuote["packageTier"])
    : "custom";
}

/** Ne conserve que les champs autorisés (ignore le reste du body). */
export function sanitizeSponsorQuoteBody(
  body: Record<string, unknown>,
): SanitizedSponsorQuote {
  const sourceRaw = trimStr(body.source, 16).toLowerCase();
  const source: "website" | "app" = sourceRaw === "app" ? "app" : "website";

  return {
    companyName: trimStr(body.companyName ?? body.company_name),
    contactEmail: trimStr(
      body.contactEmail ?? body.contact_email ?? body.email,
      MAX_EMAIL,
    ).toLowerCase(),
    contactName: trimStr(body.contactName ?? body.contact_name),
    contactRole:
      trimStr(body.contactRole ?? body.contact_role) || undefined,
    phone: trimStr(body.phone, 32) || undefined,
    budget: trimStr(body.budget) || undefined,
    goals: trimArray(body.goals),
    audience: trimArray(body.audience),
    regions: trimArray(body.regions),
    sports: trimArray(body.sports),
    message: body.message ? trimStr(body.message, MAX_MESSAGE) : undefined,
    packageTier: resolvePackageTier(body.packageTier ?? body.package_tier),
    sector: trimStr(body.sector) || undefined,
    source,
    sponsorUid:
      trimStr(body.sponsorUid ?? body.sponsor_uid, 128) || undefined,
  };
}

export function validateSponsorQuote(
  payload: SanitizedSponsorQuote,
): string | null {
  if (!payload.companyName) return "Nom d'entreprise requis";
  if (!payload.contactName) return "Nom du contact requis";
  if (!EMAIL_RE.test(payload.contactEmail)) return "Email invalide";
  return null;
}

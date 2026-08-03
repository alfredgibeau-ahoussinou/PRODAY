import {
  SPONSOR_DEVIS_INITIAL,
  type SponsorDevisFormState,
  type SponsorPackageTier,
} from "@/lib/sponsorContent";

export const SPONSOR_DEVIS_STORAGE_KEY = "proday.sponsor.devis.v1";

const PACKAGE_TIERS = new Set<SponsorPackageTier>([
  "starter",
  "territorial",
  "national",
  "custom",
]);

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asPackageTier(value: unknown): SponsorPackageTier {
  const raw = asString(value).toLowerCase() as SponsorPackageTier;
  return PACKAGE_TIERS.has(raw) ? raw : "custom";
}

export function parseSponsorDevisState(raw: unknown): SponsorDevisFormState {
  if (!raw || typeof raw !== "object") return { ...SPONSOR_DEVIS_INITIAL };
  const data = raw as Record<string, unknown>;
  return {
    companyName: asString(data.companyName),
    sector: asString(data.sector),
    contactName: asString(data.contactName),
    contactRole: asString(data.contactRole),
    email: asString(data.email),
    phone: asString(data.phone),
    packageTier: asPackageTier(data.packageTier),
    budget: asString(data.budget),
    goals: asStringArray(data.goals),
    audience: asStringArray(data.audience),
    regions: asStringArray(data.regions),
    sports: asStringArray(data.sports),
    message: asString(data.message),
  };
}

export function loadSponsorDevisState(): SponsorDevisFormState {
  if (typeof window === "undefined") return { ...SPONSOR_DEVIS_INITIAL };
  try {
    const raw = window.sessionStorage.getItem(SPONSOR_DEVIS_STORAGE_KEY);
    if (!raw) return { ...SPONSOR_DEVIS_INITIAL };
    return parseSponsorDevisState(JSON.parse(raw));
  } catch {
    return { ...SPONSOR_DEVIS_INITIAL };
  }
}

export function saveSponsorDevisState(state: SponsorDevisFormState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SPONSOR_DEVIS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function clearSponsorDevisState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SPONSOR_DEVIS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isEntrepriseStepValid(form: SponsorDevisFormState): boolean {
  return form.companyName.trim().length >= 2 && form.sector !== "";
}

export function isContactStepValid(form: SponsorDevisFormState): boolean {
  return (
    form.contactName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  );
}

export function isFormuleStepValid(form: SponsorDevisFormState): boolean {
  return form.packageTier !== undefined && form.budget !== "";
}

export function isProjetStepValid(form: SponsorDevisFormState): boolean {
  return form.goals.length > 0;
}

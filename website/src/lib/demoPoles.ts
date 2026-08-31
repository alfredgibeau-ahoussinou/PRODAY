import { SHOWCASE_POLES, POLE_IMAGES, type PoleId } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";
import {
  AMATEUR_BRAND,
  PRO_CLUB_BRAND,
  PRO_JOUEUR_BRAND,
  PRO_STAFF_BRAND,
  SANTE_BRAND,
  SUPPORTER_BRAND,
} from "@/lib/content";
import type { UniverseThemeId } from "@/components/universe/universeTheme";

/** Pôles exposés dans la démo vitrine (5) + Santé legacy URL. */
export type DemoPoleId =
  | "joueur"
  | "supporter"
  | "pro_club"
  | "coach"
  | "sponsor"
  | "sante";

export const DEMO_POLE_IDS: DemoPoleId[] = SHOWCASE_POLES.map(
  (p) => p.id as DemoPoleId,
);

export const DEMO_POLE_SHORT_LABEL: Record<DemoPoleId, string> = {
  joueur: "Joueur",
  supporter: "Supporter",
  sante: "Santé",
  pro_club: "Club",
  coach: "Coach",
  sponsor: "Sponsor",
};

export function isDemoPoleId(value: string | undefined): value is DemoPoleId {
  return (
    value === "joueur" ||
    value === "supporter" ||
    value === "sante" ||
    value === "pro_club" ||
    value === "coach" ||
    value === "sponsor"
  );
}

/** Legacy `?u=` → pôle démo. */
export function demoPoleFromUniverseParam(u: string | undefined): DemoPoleId | null {
  switch (u) {
    case "amateur":
    case "homme":
    case "woman":
      return "joueur";
    case "supporter":
      return "supporter";
    case "sante":
      return "sante";
    case "pro":
    case "pro_staff":
      return "coach";
    case "evenements":
      return "pro_club";
    case "sponsor":
    case "partenaires":
      return "sponsor";
    default:
      return null;
  }
}

export function parseDemoPoleParam(p?: string, u?: string): DemoPoleId {
  if (p === "amateur" || p === "pro_joueur") return "joueur";
  if (p === "pro_staff") return "coach";
  if (p === "evenements") return "pro_club";
  if (p === "partenaires") return "sponsor";
  if (isDemoPoleId(p)) return p;
  return demoPoleFromUniverseParam(u) ?? "joueur";
}

export function demoUrlForPole(pole: DemoPoleId): string {
  return `${ROUTES.demo}?p=${pole}`;
}

export function themeIdForDemoPole(pole: DemoPoleId): UniverseThemeId {
  if (pole === "joueur") return "pro_joueur";
  if (pole === "coach") return "pro_staff";
  if (pole === "sponsor") return "pro";
  if (pole === "sante") return "sante";
  return pole;
}

export function brandForDemoPole(pole: DemoPoleId): { name: string; logo: string } {
  switch (pole) {
    case "joueur":
      return { name: PRO_JOUEUR_BRAND.name, logo: PRO_JOUEUR_BRAND.logo };
    case "supporter":
      return { name: SUPPORTER_BRAND.name, logo: SUPPORTER_BRAND.logo };
    case "sante":
      return { name: SANTE_BRAND.name, logo: SANTE_BRAND.logo };
    case "pro_club":
      return { name: PRO_CLUB_BRAND.name, logo: PRO_CLUB_BRAND.logo };
    case "coach":
      return { name: "Pro Day Coach", logo: PRO_STAFF_BRAND.logo };
    case "sponsor":
      return { name: "Pro Day Sponsor", logo: "/branding/logo-proday-mark-sponsor.png" };
    default:
      return { name: AMATEUR_BRAND.name, logo: AMATEUR_BRAND.logo };
  }
}

export function imageForDemoPole(pole: DemoPoleId): string {
  return POLE_IMAGES[pole as PoleId] ?? POLE_IMAGES.joueur;
}

/** Alias historique pour DemoHero. */
export function heroImageForDemoPole(pole: DemoPoleId): string {
  return imageForDemoPole(pole);
}

import { CAROUSEL_POLES, POLE_IMAGES, type PoleId } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";
import {
  AMATEUR_BRAND,
  PRO_CLUB_BRAND,
  PRO_JOUEUR_BRAND,
  PRO_STAFF_BRAND,
  SANTE_BRAND,
  SUPPORTER_BRAND,
  type ProductLineWeb,
} from "@/lib/content";
import type { UniverseThemeId } from "@/components/universe/universeTheme";

/** Pôles exposés dans la démo (hors Partenaires). */
export type DemoPoleId = Exclude<PoleId, "sponsor">;

export const DEMO_POLE_IDS: DemoPoleId[] = CAROUSEL_POLES.map((p) => p.id as DemoPoleId);

export const DEMO_POLE_SHORT_LABEL: Record<DemoPoleId, string> = {
  amateur: "Amateur",
  supporter: "Supporter",
  sante: "Santé",
  pro_joueur: "Pro Joueur",
  pro_club: "Pro Club",
  pro_staff: "Pro Staff",
};

export function isDemoPoleId(value: string | undefined): value is DemoPoleId {
  return (
    value === "amateur" ||
    value === "supporter" ||
    value === "sante" ||
    value === "pro_joueur" ||
    value === "pro_club" ||
    value === "pro_staff"
  );
}

/** Legacy `?u=` → pôle démo. */
export function demoPoleFromUniverseParam(u: string | undefined): DemoPoleId | null {
  switch (u) {
    case "amateur":
      return "amateur";
    case "supporter":
      return "supporter";
    case "sante":
      return "sante";
    case "homme":
    case "woman":
      return "pro_joueur";
    case "pro":
      return "pro_staff";
    default:
      return null;
  }
}

export function parseDemoPoleParam(p?: string, u?: string): DemoPoleId {
  if (isDemoPoleId(p)) return p;
  return demoPoleFromUniverseParam(u) ?? "amateur";
}

export function demoUrlForPole(pole: DemoPoleId): string {
  return `${ROUTES.demo}?p=${pole}`;
}

export function themeIdForDemoPole(pole: DemoPoleId): UniverseThemeId {
  return pole;
}

export function brandForDemoPole(pole: DemoPoleId): { name: string; logo: string } {
  switch (pole) {
    case "amateur":
      return { name: AMATEUR_BRAND.name, logo: AMATEUR_BRAND.logo };
    case "supporter":
      return { name: SUPPORTER_BRAND.name, logo: SUPPORTER_BRAND.logo };
    case "sante":
      return { name: SANTE_BRAND.name, logo: SANTE_BRAND.logo };
    case "pro_joueur":
      return { name: PRO_JOUEUR_BRAND.name, logo: PRO_JOUEUR_BRAND.logo };
    case "pro_club":
      return { name: PRO_CLUB_BRAND.name, logo: PRO_CLUB_BRAND.logo };
    case "pro_staff":
      return { name: PRO_STAFF_BRAND.name, logo: PRO_STAFF_BRAND.logo };
  }
}

export function heroImageForDemoPole(pole: DemoPoleId): string {
  return POLE_IMAGES[pole];
}

/** Pour embeds univers legacy → URL démo pôle. */
export function demoPoleFromProductLine(line: ProductLineWeb): DemoPoleId {
  return demoPoleFromUniverseParam(line) ?? "amateur";
}

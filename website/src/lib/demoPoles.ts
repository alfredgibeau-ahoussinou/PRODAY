import { CAROUSEL_POLES, POLE_IMAGES, type PoleId } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";
import {
  AMATEUR_BRAND,
  EVENEMENTS_BRAND,
  PRO_CLUB_BRAND,
  PRO_JOUEUR_BRAND,
  PRO_STAFF_BRAND,
  SANTE_BRAND,
  SUPPORTER_BRAND,
} from "@/lib/content";
import type { UniverseThemeId } from "@/components/universe/universeTheme";

/** Pôles exposés dans la démo (hors Partenaires). */
export type DemoPoleId = Exclude<PoleId, "sponsor" | "amateur" | "pro_joueur">;

export const DEMO_POLE_IDS: DemoPoleId[] = CAROUSEL_POLES.map((p) => p.id as DemoPoleId);

export const DEMO_POLE_SHORT_LABEL: Record<DemoPoleId, string> = {
  joueur: "Joueur",
  supporter: "Supporter",
  sante: "Santé",
  pro_club: "Club",
  pro_staff: "Staff",
  evenements: "Événements",
};

export function isDemoPoleId(value: string | undefined): value is DemoPoleId {
  return (
    value === "joueur" ||
    value === "supporter" ||
    value === "sante" ||
    value === "pro_club" ||
    value === "pro_staff" ||
    value === "evenements"
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
      return "pro_staff";
    default:
      return null;
  }
}

export function parseDemoPoleParam(p?: string, u?: string): DemoPoleId {
  if (p === "amateur" || p === "pro_joueur") return "joueur";
  if (isDemoPoleId(p)) return p;
  return demoPoleFromUniverseParam(u) ?? "joueur";
}

export function demoUrlForPole(pole: DemoPoleId): string {
  return `${ROUTES.demo}?p=${pole}`;
}

export function themeIdForDemoPole(pole: DemoPoleId): UniverseThemeId {
  if (pole === "joueur") return "pro_joueur";
  if (pole === "evenements") return "pro_staff";
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
    case "pro_staff":
      return { name: PRO_STAFF_BRAND.name, logo: PRO_STAFF_BRAND.logo };
    case "evenements":
      return { name: EVENEMENTS_BRAND.name, logo: EVENEMENTS_BRAND.logo };
    default:
      return { name: AMATEUR_BRAND.name, logo: AMATEUR_BRAND.logo };
  }
}

export function imageForDemoPole(pole: DemoPoleId): string {
  return POLE_IMAGES[pole];
}

/** Alias historique pour DemoHero. */
export function heroImageForDemoPole(pole: DemoPoleId): string {
  return imageForDemoPole(pole);
}

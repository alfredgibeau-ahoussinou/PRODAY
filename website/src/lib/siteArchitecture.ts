import type { PoleId } from "./poles";
import {
  CLUB_APP_HREF,
  COACH_APP_HREF,
  PARENT_APP_HREF,
  PRESIDENT_HUB_HREF,
  ROUTES,
  SPONSOR_APP_HREF,
} from "./routes";

export type PageCategory = "home" | "pole" | "platform";

export type PageAccent =
  | "default"
  | "joueur"
  | "woman"
  | "amateur"
  | "supporter"
  | "parent"
  | "pro"
  | "pro_club"
  | "coach"
  | "pro_staff"
  | "evenements"
  | "sante"
  | "sponsor"
  | "president";

export type PageMeta = {
  path: string;
  poleId: PoleId | null;
  category: PageCategory;
  accent: PageAccent;
  poleHubPath?: string;
  siblingLinks?: { href: string; label: string }[];
};

const ECOSYSTEM_SIBLINGS = [
  { href: ROUTES.joueur, label: "Joueur" },
  { href: CLUB_APP_HREF, label: "Club" },
  { href: PRESIDENT_HUB_HREF, label: "Président" },
  { href: COACH_APP_HREF, label: "Coach" },
  { href: PARENT_APP_HREF, label: "Parent" },
  { href: ROUTES.supporter, label: "Supporter" },
  { href: SPONSOR_APP_HREF, label: "Sponsor" },
] as const;

export const SITE_PAGES: Record<string, PageMeta> = {
  [ROUTES.home]: {
    path: ROUTES.home,
    poleId: null,
    category: "home",
    accent: "default",
  },
  [ROUTES.joueurs]: {
    path: ROUTES.joueurs,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.homme]: {
    path: ROUTES.homme,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.woman]: {
    path: ROUTES.woman,
    poleId: "joueur",
    category: "pole",
    accent: "woman",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.amateur]: {
    path: ROUTES.amateur,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.joueur]: {
    path: ROUTES.joueur,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    siblingLinks: ECOSYSTEM_SIBLINGS.filter((l) => l.href !== ROUTES.joueur),
  },
  [ROUTES.supporter]: {
    path: ROUTES.supporter,
    poleId: "supporter",
    category: "pole",
    accent: "supporter",
  },
  [ROUTES.sante]: {
    path: ROUTES.sante,
    poleId: "sante",
    category: "pole",
    accent: "sante",
  },
  [ROUTES.parent]: {
    path: ROUTES.parent,
    poleId: "parent",
    category: "pole",
    accent: "parent",
    poleHubPath: ROUTES.parent,
    siblingLinks: ECOSYSTEM_SIBLINGS.filter((l) => l.href !== PARENT_APP_HREF),
  },
  [ROUTES.proJoueur]: {
    path: ROUTES.proJoueur,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.proClub]: {
    path: ROUTES.proClub,
    poleId: "pro_club",
    category: "pole",
    accent: "pro_club",
    siblingLinks: ECOSYSTEM_SIBLINGS.filter((l) => l.href !== CLUB_APP_HREF),
  },
  [ROUTES.president]: {
    path: ROUTES.president,
    poleId: null,
    category: "pole",
    accent: "president",
    poleHubPath: ROUTES.president,
    siblingLinks: ECOSYSTEM_SIBLINGS.filter((l) => l.href !== PRESIDENT_HUB_HREF),
  },
  [ROUTES.coach]: {
    path: ROUTES.coach,
    poleId: "coach",
    category: "pole",
    accent: "coach",
    siblingLinks: ECOSYSTEM_SIBLINGS.filter((l) => l.href !== COACH_APP_HREF),
  },
  [ROUTES.proStaff]: {
    path: ROUTES.proStaff,
    poleId: "coach",
    category: "pole",
    accent: "coach",
    poleHubPath: ROUTES.coach,
  },
  [ROUTES.evenements]: {
    path: ROUTES.evenements,
    poleId: "pro_club",
    category: "pole",
    accent: "pro_club",
    poleHubPath: ROUTES.proClub,
  },
  [ROUTES.pro]: {
    path: ROUTES.pro,
    poleId: "coach",
    category: "pole",
    accent: "pro",
    poleHubPath: ROUTES.coach,
  },
  [ROUTES.partenaires]: {
    path: ROUTES.partenaires,
    poleId: "sponsor",
    category: "pole",
    accent: "sponsor",
    poleHubPath: ROUTES.sponsor,
  },
  [ROUTES.sponsor]: {
    path: ROUTES.sponsor,
    poleId: "sponsor",
    category: "pole",
    accent: "sponsor",
  },
  [ROUTES.pricing]: {
    path: ROUTES.pricing,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.features]: {
    path: ROUTES.features,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.demo]: {
    path: ROUTES.demo,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.cards]: {
    path: ROUTES.cards,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.beta]: {
    path: ROUTES.beta,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.betaProgramme]: {
    path: ROUTES.betaProgramme,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.betaInstaller]: {
    path: ROUTES.betaInstaller,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.betaAide]: {
    path: ROUTES.betaAide,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.betaWaitlist]: {
    path: ROUTES.betaWaitlist,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.faq]: {
    path: ROUTES.faq,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.about]: {
    path: ROUTES.about,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.vision]: {
    path: ROUTES.vision,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.journeys]: {
    path: ROUTES.journeys,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.pulse]: {
    path: ROUTES.pulse,
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.liveStats]: {
    path: ROUTES.liveStats,
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.cv]: {
    path: ROUTES.cv,
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueur,
  },
  [ROUTES.quiz]: {
    path: ROUTES.quiz,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.compare]: {
    path: ROUTES.compare,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.trust]: {
    path: ROUTES.trust,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.ecosystem]: {
    path: ROUTES.ecosystem,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.roadmap]: {
    path: ROUTES.roadmap,
    poleId: null,
    category: "platform",
    accent: "default",
  },
  [ROUTES.shop]: {
    path: ROUTES.shop,
    poleId: null,
    category: "platform",
    accent: "default",
  },
};

export const POLE_HUB_LABELS: Record<string, string> = {
  [ROUTES.joueur]: "Pôle Joueur",
  [ROUTES.amateur]: "Pôle Joueur",
  [ROUTES.supporter]: "Pôle Supporter",
  [ROUTES.parent]: "Pôle Parent",
  [ROUTES.proJoueur]: "Pôle Joueur",
  [ROUTES.proClub]: "Pôle Club",
  [ROUTES.president]: "Pôle Président",
  [ROUTES.coach]: "Pôle Coach",
  [ROUTES.proStaff]: "Pôle Coach",
  [ROUTES.evenements]: "Pôle Club",
  [ROUTES.pro]: "Écosystème",
  [ROUTES.partenaires]: "Pôle Sponsor",
  [ROUTES.sponsor]: "Pôle Sponsor",
};

function normalizePath(pathname: string): string {
  const base = pathname.split("?")[0]?.split("#")[0] ?? "/";
  return base === "" ? "/" : base;
}

export function pageMetaForPath(pathname: string): PageMeta {
  const path = normalizePath(pathname);
  if (SITE_PAGES[path]) return SITE_PAGES[path];

  for (const [route, meta] of Object.entries(SITE_PAGES)) {
    if (route !== ROUTES.home && path.startsWith(route)) return meta;
  }

  return {
    path,
    poleId: null,
    category: "platform",
    accent: "default",
  };
}

export function poleForPath(pathname: string): PoleId | null {
  return pageMetaForPath(pathname).poleId;
}

export function isPolePage(pathname: string): boolean {
  return pageMetaForPath(pathname).category === "pole";
}

export function showPoleContextBar(pathname: string): boolean {
  const meta = pageMetaForPath(pathname);
  if (meta.category === "pole") return true;
  return Boolean(meta.poleHubPath && meta.poleId);
}

export function poleHubForPath(pathname: string): string | null {
  const meta = pageMetaForPath(pathname);
  if (meta.poleHubPath) return meta.poleHubPath;
  if (meta.category === "pole" && meta.path) return meta.path;
  if (meta.poleId === "joueur" || meta.poleId === "amateur" || meta.poleId === "pro_joueur") {
    return ROUTES.joueur;
  }
  if (meta.poleId === "supporter") return ROUTES.supporter;
  if (meta.poleId === "sante") return ROUTES.sante;
  if (meta.poleId === "pro_club") return ROUTES.proClub;
  if (meta.poleId === "coach" || meta.poleId === "pro_staff") return ROUTES.coach;
  if (meta.poleId === "evenements") return ROUTES.proClub;
  if (meta.poleId === "sponsor") return ROUTES.sponsor;
  if (meta.poleId === "parent") return ROUTES.parent;
  if (meta.path === ROUTES.president || meta.accent === "president") {
    return ROUTES.president;
  }
  return null;
}

export function isNavActive(href: string, pathname: string): boolean {
  const path = normalizePath(pathname);
  const [targetPath, hash] = href.split("#");

  if (hash) {
    return path === targetPath || path.startsWith(`${targetPath}/`);
  }

  if (targetPath === ROUTES.joueur || targetPath === ROUTES.amateur) {
    return (
      path === ROUTES.joueur ||
      path === ROUTES.amateur ||
      path === ROUTES.proJoueur ||
      path === ROUTES.homme ||
      path === ROUTES.woman ||
      path === ROUTES.joueurs ||
      path === ROUTES.pulse ||
      path === ROUTES.cv ||
      path === ROUTES.liveStats
    );
  }
  if (targetPath === ROUTES.supporter) return path === ROUTES.supporter;
  if (targetPath === ROUTES.sante) return path === ROUTES.sante;
  if (targetPath === ROUTES.proJoueur) {
    return path === ROUTES.proJoueur || path === ROUTES.joueur || path === ROUTES.pulse || path === ROUTES.cv || path === ROUTES.liveStats;
  }
  if (targetPath === ROUTES.proClub) {
    return path === ROUTES.proClub || path === ROUTES.evenements;
  }
  if (targetPath === ROUTES.president) {
    return path === ROUTES.president;
  }
  if (targetPath === ROUTES.coach) {
    return (
      path === ROUTES.coach ||
      path === ROUTES.proStaff ||
      path === ROUTES.pro ||
      path.startsWith(`${ROUTES.pro}/`)
    );
  }
  if (targetPath === ROUTES.evenements) return path === ROUTES.evenements;
  if (targetPath === ROUTES.proStaff) {
    return path === ROUTES.proStaff || path === ROUTES.coach || path === ROUTES.pro;
  }
  if (targetPath === ROUTES.sponsor) {
    return (
      path === ROUTES.sponsor ||
      path.startsWith(`${ROUTES.sponsor}/`) ||
      path === ROUTES.partenaires ||
      path.startsWith(`${ROUTES.partenaires}/`)
    );
  }

  return path === targetPath;
}

import type { PoleId } from "./poles";
import { ROUTES } from "./routes";

export type PageCategory = "home" | "pole" | "platform";

export type PageAccent =
  | "default"
  | "joueur"
  | "woman"
  | "amateur"
  | "supporter"
  | "pro"
  | "pro_club"
  | "pro_staff"
  | "sante"
  | "sponsor";

export type PageMeta = {
  path: string;
  poleId: PoleId | null;
  category: PageCategory;
  accent: PageAccent;
  poleHubPath?: string;
  siblingLinks?: { href: string; label: string }[];
};

const PRO_SIBLINGS = [
  { href: ROUTES.proJoueur, label: "Pro Joueur" },
  { href: ROUTES.proClub, label: "Pro Club" },
  { href: ROUTES.proStaff, label: "Pro Staff" },
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
    poleId: "amateur",
    category: "pole",
    accent: "amateur",
    poleHubPath: ROUTES.amateur,
  },
  [ROUTES.homme]: {
    path: ROUTES.homme,
    poleId: "amateur",
    category: "pole",
    accent: "amateur",
    poleHubPath: ROUTES.amateur,
  },
  [ROUTES.woman]: {
    path: ROUTES.woman,
    poleId: "amateur",
    category: "pole",
    accent: "amateur",
    poleHubPath: ROUTES.amateur,
  },
  [ROUTES.amateur]: {
    path: ROUTES.amateur,
    poleId: "amateur",
    category: "pole",
    accent: "amateur",
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
  [ROUTES.proJoueur]: {
    path: ROUTES.proJoueur,
    poleId: "pro_joueur",
    category: "pole",
    accent: "joueur",
    siblingLinks: PRO_SIBLINGS.filter((l) => l.href !== ROUTES.proJoueur),
  },
  [ROUTES.proClub]: {
    path: ROUTES.proClub,
    poleId: "pro_club",
    category: "pole",
    accent: "pro_club",
    siblingLinks: PRO_SIBLINGS.filter((l) => l.href !== ROUTES.proClub),
  },
  [ROUTES.proStaff]: {
    path: ROUTES.proStaff,
    poleId: "pro_staff",
    category: "pole",
    accent: "pro_staff",
    siblingLinks: PRO_SIBLINGS.filter((l) => l.href !== ROUTES.proStaff),
  },
  [ROUTES.pro]: {
    path: ROUTES.pro,
    poleId: "pro_staff",
    category: "pole",
    accent: "pro",
    poleHubPath: ROUTES.proStaff,
  },
  [ROUTES.partenaires]: {
    path: ROUTES.partenaires,
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
  [ROUTES.beta]: {
    path: ROUTES.beta,
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
    poleId: "pro_joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.proJoueur,
  },
  [ROUTES.liveStats]: {
    path: ROUTES.liveStats,
    poleId: "pro_joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.proJoueur,
  },
  [ROUTES.cv]: {
    path: ROUTES.cv,
    poleId: "pro_joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.proJoueur,
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
  [ROUTES.amateur]: "Pôle Amateur",
  [ROUTES.supporter]: "Pôle Supporter",
  [ROUTES.sante]: "Pôle Santé",
  [ROUTES.proJoueur]: "Pôle Pro Joueur",
  [ROUTES.proClub]: "Pôle Pro Club",
  [ROUTES.proStaff]: "Pôle Pro Staff",
  [ROUTES.pro]: "Pôle Pro",
  [ROUTES.partenaires]: "Pôle Partenaires",
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
  if (meta.poleId === "amateur") return ROUTES.amateur;
  if (meta.poleId === "supporter") return ROUTES.supporter;
  if (meta.poleId === "sante") return ROUTES.sante;
  if (meta.poleId === "pro_joueur") return ROUTES.proJoueur;
  if (meta.poleId === "pro_club") return ROUTES.proClub;
  if (meta.poleId === "pro_staff") return ROUTES.proStaff;
  if (meta.poleId === "sponsor") return ROUTES.partenaires;
  return null;
}

export function isNavActive(href: string, pathname: string): boolean {
  const path = normalizePath(pathname);
  const [targetPath, hash] = href.split("#");

  if (hash) {
    return path === targetPath || path.startsWith(`${targetPath}/`);
  }

  if (targetPath === ROUTES.amateur) {
    return (
      path === ROUTES.amateur ||
      path === ROUTES.homme ||
      path === ROUTES.woman ||
      path === ROUTES.joueurs
    );
  }
  if (targetPath === ROUTES.supporter) return path === ROUTES.supporter;
  if (targetPath === ROUTES.sante) return path === ROUTES.sante;
  if (targetPath === ROUTES.proJoueur) {
    return path === ROUTES.proJoueur || path === ROUTES.pulse || path === ROUTES.cv || path === ROUTES.liveStats;
  }
  if (targetPath === ROUTES.proClub) return path === ROUTES.proClub;
  if (targetPath === ROUTES.proStaff) {
    return path === ROUTES.proStaff || path === ROUTES.pro || path.startsWith(`${ROUTES.pro}/`);
  }

  return path === targetPath;
}

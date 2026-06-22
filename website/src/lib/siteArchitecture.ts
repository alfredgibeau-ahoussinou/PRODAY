import type { PoleId } from "./poles";
import { ROUTES } from "./routes";

export type PageCategory = "home" | "pole" | "platform";

export type PageAccent =
  | "default"
  | "joueur"
  | "woman"
  | "pro"
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

const JOUEUR_SIBLINGS = [
  { href: ROUTES.homme, label: "Man" },
  { href: ROUTES.woman, label: "Woman" },
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
    siblingLinks: [...JOUEUR_SIBLINGS],
  },
  [ROUTES.homme]: {
    path: ROUTES.homme,
    poleId: "joueur",
    category: "pole",
    accent: "joueur",
    poleHubPath: ROUTES.joueurs,
    siblingLinks: [{ href: ROUTES.woman, label: "Woman" }],
  },
  [ROUTES.woman]: {
    path: ROUTES.woman,
    poleId: "joueur",
    category: "pole",
    accent: "woman",
    poleHubPath: ROUTES.joueurs,
    siblingLinks: [{ href: ROUTES.homme, label: "Man" }],
  },
  [ROUTES.pro]: {
    path: ROUTES.pro,
    poleId: "pro",
    category: "pole",
    accent: "pro",
  },
  [ROUTES.sante]: {
    path: ROUTES.sante,
    poleId: "sante",
    category: "pole",
    accent: "sante",
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
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueurs,
  },
  [ROUTES.liveStats]: {
    path: ROUTES.liveStats,
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueurs,
  },
  [ROUTES.cv]: {
    path: ROUTES.cv,
    poleId: "joueur",
    category: "platform",
    accent: "joueur",
    poleHubPath: ROUTES.joueurs,
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

const POLE_PREFIXES: { prefix: string; poleId: PoleId }[] = [
  { prefix: ROUTES.joueurs, poleId: "joueur" },
  { prefix: ROUTES.homme, poleId: "joueur" },
  { prefix: ROUTES.woman, poleId: "joueur" },
  { prefix: ROUTES.pro, poleId: "pro" },
  { prefix: ROUTES.sante, poleId: "sante" },
  { prefix: ROUTES.partenaires, poleId: "sponsor" },
];

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

/** Affiche la barre contextuelle sur les hubs pôle et les pages outils rattachées (pulse, cv…). */
export function showPoleContextBar(pathname: string): boolean {
  const meta = pageMetaForPath(pathname);
  if (meta.category === "pole") return true;
  return Boolean(meta.poleHubPath && meta.poleId);
}

export function poleHubForPath(pathname: string): string | null {
  const meta = pageMetaForPath(pathname);
  if (meta.poleHubPath) return meta.poleHubPath;
  if (meta.category === "pole" && meta.poleId === "joueur" && meta.path === ROUTES.joueurs) {
    return ROUTES.joueurs;
  }
  if (meta.poleId === "joueur") return ROUTES.joueurs;
  if (meta.poleId === "pro") return ROUTES.pro;
  if (meta.poleId === "sante") return ROUTES.sante;
  if (meta.poleId === "sponsor") return ROUTES.partenaires;
  return null;
}

export function isNavActive(href: string, pathname: string): boolean {
  const path = normalizePath(pathname);
  const [targetPath, hash] = href.split("#");

  if (hash) {
    return path === targetPath || path.startsWith(`${targetPath}/`);
  }

  if (targetPath === ROUTES.joueurs) {
    return (
      path === ROUTES.joueurs ||
      path === ROUTES.homme ||
      path === ROUTES.woman
    );
  }
  if (targetPath === ROUTES.pro) return path === ROUTES.pro || path.startsWith(`${ROUTES.pro}/`);
  if (targetPath === ROUTES.sante) return path === ROUTES.sante;
  if (targetPath === ROUTES.partenaires) return path === ROUTES.partenaires;

  return path === targetPath;
}

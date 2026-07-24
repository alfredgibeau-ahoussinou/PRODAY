import { mercatoTabLabelForWeb, type ProductLineWeb } from "./content";
import type { DemoPoleId } from "./demoPoles";

/** Aligné sur `src/navigation/mainTabConfig.ts`. */
export type MainTabId =
  | "home"
  | "recrutement"
  | "matchs"
  | "covoiturage"
  | "sante"
  | "feed"
  | "reels"
  | "famille"
  | "messages"
  | "profil"
  | "shop";

export type MobileRailLayout = {
  left: MainTabId[];
  center: MainTabId | null;
  right: MainTabId[];
  overflow: MainTabId[];
};

const LEFT_PRIORITY: MainTabId[] = ["home", "matchs", "feed", "recrutement"];
const SECONDARY_PRIORITY: MainTabId[] = [
  "recrutement",
  "matchs",
  "covoiturage",
  "sante",
  "feed",
  "famille",
  "shop",
];

/** Rôles par défaut pour la démo web. alignés sur `getVisibleMainTabs`. */
function defaultRoleForUniverse(universe: ProductLineWeb): "player" | "coach" | "physio" {
  if (universe === "sante") return "physio";
  if (universe === "pro" || universe === "amateur") return "coach";
  return "player";
}

function injectCommunityFeedTab(tabs: MainTabId[], role: "player" | "coach" | "physio"): MainTabId[] {
  const canParticipate = role === "player" || role === "coach" || role === "physio";
  if (!canParticipate || tabs.includes("feed")) return tabs;
  const reelsIndex = tabs.indexOf("reels");
  const anchor = reelsIndex >= 0 ? reelsIndex : tabs.indexOf("matchs");
  const insertAt = anchor >= 0 ? anchor + 1 : tabs.length;
  const next = [...tabs];
  next.splice(insertAt, 0, "feed");
  return next;
}

/**
 * Onglets visibles selon pôle. même logique que l'app (`poleExperience.getVisibleMainTabs`)
 * sans profil connecté (pas d'onglet Famille sur la démo).
 */
export function getVisibleMainTabsForWeb(universe: ProductLineWeb): MainTabId[] {
  const role = defaultRoleForUniverse(universe);
  let tabs: MainTabId[];

  if (universe === "sante") {
    tabs = ["home", "matchs", "feed", "reels", "messages", "profil"];
  } else if (universe === "supporter") {
    tabs = ["home", "matchs", "reels", "feed", "messages", "shop", "profil"];
  } else if (universe === "amateur") {
    tabs = ["home", "recrutement", "matchs", "reels", "covoiturage", "shop", "messages", "profil"];
  } else if (universe === "pro") {
    tabs = ["home", "recrutement", "matchs", "reels", "covoiturage", "shop", "messages", "profil"];
  } else if (role === "player") {
    tabs = [
      "home",
      "recrutement",
      "matchs",
      "reels",
      "covoiturage",
      "sante",
      "shop",
      "messages",
      "profil",
    ];
  } else {
    tabs = ["home", "recrutement", "matchs", "reels", "feed", "shop", "messages", "profil"];
  }

  return injectCommunityFeedTab(tabs, role);
}

/** Shells app réels. un set d’onglets par pôle démo. */
export function getVisibleMainTabsForDemoPole(pole: DemoPoleId): MainTabId[] {
  switch (pole) {
    case "amateur":
      return [
        "home",
        "covoiturage",
        "recrutement",
        "shop",
        "profil",
        "matchs",
        "messages",
        "reels",
        "sante",
        "feed",
      ];
    case "supporter":
      return ["home", "matchs", "feed", "messages", "reels", "shop", "profil"];
    case "sante":
      return ["home", "matchs", "feed", "reels", "messages", "profil"];
    case "pro_joueur":
      return ["home", "recrutement", "reels", "matchs", "shop", "profil"];
    case "pro_club":
      return ["home", "recrutement", "matchs", "messages", "shop", "profil"];
    case "pro_staff":
      return ["home", "matchs", "recrutement", "covoiturage", "messages", "shop", "profil"];
  }
}

/** Même algo que `src/navigation/mobileTabConfig.ts`. */
export function getMobileRailLayoutForWeb(visible: MainTabId[]): MobileRailLayout {
  const left: MainTabId[] = [];

  for (const id of LEFT_PRIORITY) {
    if (visible.includes(id) && !left.includes(id)) {
      left.push(id);
    }
    if (left.length >= 2) break;
  }

  if (left.length < 2) {
    for (const id of SECONDARY_PRIORITY) {
      if (visible.includes(id) && !left.includes(id)) {
        left.push(id);
      }
      if (left.length >= 2) break;
    }
  }

  const center = visible.includes("reels") ? "reels" : null;
  const right: MainTabId[] = [];
  if (visible.includes("messages")) right.push("messages");
  if (visible.includes("profil")) right.push("profil");
  if (right.length === 0 && visible.includes("shop")) right.push("shop");

  const inRail = new Set<MainTabId>([
    ...left,
    ...(center ? ([center] as MainTabId[]) : []),
    ...right,
  ]);
  const overflow = visible.filter((id) => !inRail.has(id));

  return { left, center, right, overflow };
}

const DEFAULT_LABELS: Record<MainTabId, string> = {
  home: "Accueil",
  recrutement: "Mercato",
  matchs: "Matchs",
  covoiturage: "Covoiturage",
  shop: "Shop",
  sante: "Santé",
  feed: "Fil",
  reels: "Reels",
  famille: "Famille",
  messages: "Messages",
  profil: "Profil",
};

/** Labels courts. shells pôle (démo). */
export function getTabLabelForDemoPole(tab: MainTabId, pole: DemoPoleId): string {
  if (pole === "sante") {
    switch (tab) {
      case "home":
        return "Accueil";
      case "matchs":
        return "Agenda";
      case "feed":
        return "Demandes";
      case "reels":
        return "Vidéos";
      case "messages":
        return "Messages";
      case "profil":
        return "Cabinet";
      default:
        break;
    }
  }
  if (pole === "amateur") {
    if (tab === "home") return "Équipe";
    if (tab === "covoiturage") return "Trajets";
    if (tab === "recrutement") return "Club";
    if (tab === "profil") return "Moi";
  }
  if (pole === "supporter") {
    if (tab === "home") return "Tribune";
    if (tab === "feed") return "Suivis";
    if (tab === "messages") return "Débats";
    if (tab === "reels") return "Moments";
    if (tab === "profil") return "Compte";
  }
  if (pole === "pro_joueur") {
    if (tab === "home") return "Carrière";
    if (tab === "recrutement") return "Opportunités";
    if (tab === "matchs") return "Groupe";
    if (tab === "profil") return "Moi";
  }
  if (pole === "pro_club") {
    if (tab === "home") return "Structure";
    if (tab === "recrutement") return "Recrutement";
    if (tab === "matchs") return "Calendrier";
    if (tab === "messages") return "Comm.";
    if (tab === "profil") return "Vitrine";
  }
  if (pole === "pro_staff") {
    if (tab === "home") return "Équipe";
    if (tab === "matchs") return "Calendrier";
    if (tab === "recrutement") return "Mercato";
  }
  return DEFAULT_LABELS[tab];
}

/** Labels courts. alignés sur `getTabShortLabel` pour la démo. */
export function getTabLabelForWeb(tab: MainTabId, universe: ProductLineWeb): string {
  if (universe === "sante") {
    switch (tab) {
      case "home":
        return "Accueil";
      case "matchs":
        return "Agenda";
      case "feed":
        return "Demandes";
      case "reels":
        return "Vidéos";
      case "messages":
        return "Messages";
      case "profil":
        return "Cabinet";
      default:
        break;
    }
  }

  if (tab === "recrutement") return mercatoTabLabelForWeb(universe);
  return DEFAULT_LABELS[tab];
}

export function getVisibleTabsWithLabels(universe: ProductLineWeb) {
  return getVisibleMainTabsForWeb(universe).map((id) => ({
    id,
    label: getTabLabelForWeb(id, universe),
  }));
}

export function getVisibleTabsWithLabelsForDemoPole(pole: DemoPoleId) {
  return getVisibleMainTabsForDemoPole(pole).map((id) => ({
    id,
    label: getTabLabelForDemoPole(id, pole),
  }));
}

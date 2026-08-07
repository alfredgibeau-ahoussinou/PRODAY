/**
 * Passeport numérique ProDay — niveaux, badges performance, stats.
 * Identité propre (pas une copie FIFA) : UT × dashboard × passeport.
 */

import type { ProDayPlayerCardData } from "./prodayCards";

export type PassportTierId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "legend"
  | "premium";

export type PassportBadgeId =
  | "in_form"
  | "rising"
  | "scorer"
  | "defender"
  | "passer"
  | "captain"
  | "talent"
  | "motm"
  | "comeback"
  | "marathon";

export type PassportStatKey =
  | "pace"
  | "shooting"
  | "technique"
  | "vision"
  | "defense"
  | "physical";

export type PassportStat = {
  key: PassportStatKey;
  label: string;
  icon: string;
  value: number;
};

export type PassportTierTheme = {
  id: PassportTierId;
  label: string;
  frame: [string, string, string];
  face: [string, string, string];
  ink: string;
  inkMuted: string;
  accent: string;
  glow: string;
  holographic: boolean;
  neon?: string;
  carbon?: boolean;
};

export const PASSPORT_TIERS: Record<PassportTierId, PassportTierTheme> = {
  bronze: {
    id: "bronze",
    label: "Bronze",
    frame: ["#f0d0a8", "#b06a35", "#4a2e14"],
    face: ["#e8b888", "#c0844a", "#7a4a22"],
    ink: "#1f1208",
    inkMuted: "rgba(31,18,8,0.72)",
    accent: "#d4894a",
    glow: "rgba(200,130,60,0.55)",
    holographic: false,
  },
  silver: {
    id: "silver",
    label: "Argent",
    frame: ["#ffffff", "#a8b4c4", "#4a5568"],
    face: ["#eef2f7", "#c5ced9", "#8e9aab"],
    ink: "#12151c",
    inkMuted: "rgba(18,21,28,0.7)",
    accent: "#94a3b8",
    glow: "rgba(180,195,220,0.55)",
    holographic: false,
  },
  gold: {
    id: "gold",
    label: "Or",
    frame: ["#ffe9a0", "#d4a017", "#6b5010"],
    face: ["#f7e48a", "#e8c547", "#c9a017"],
    ink: "#1a1408",
    inkMuted: "rgba(26,20,8,0.72)",
    accent: "#e8c547",
    glow: "rgba(232,197,71,0.65)",
    holographic: true,
  },
  platinum: {
    id: "platinum",
    label: "Platine",
    frame: ["#f8fbff", "#c9d7e8", "#5b6b82"],
    face: ["#e8f0fa", "#b8c9dc", "#7a8fa8"],
    ink: "#0f172a",
    inkMuted: "rgba(15,23,42,0.7)",
    accent: "#7dd3fc",
    glow: "rgba(125,211,252,0.55)",
    holographic: true,
  },
  diamond: {
    id: "diamond",
    label: "Diamant",
    frame: ["#e0f7ff", "#5eead4", "#0e7490"],
    face: ["#cffafe", "#22d3ee", "#0891b2"],
    ink: "#042f2e",
    inkMuted: "rgba(4,47,46,0.75)",
    accent: "#22d3ee",
    glow: "rgba(34,211,238,0.6)",
    holographic: true,
  },
  legend: {
    id: "legend",
    label: "Légende",
    frame: ["#f5d0fe", "#a855f7", "#4c1d95"],
    face: ["#e9d5ff", "#c084fc", "#7c3aed"],
    ink: "#1e1033",
    inkMuted: "rgba(30,16,51,0.75)",
    accent: "#e879f9",
    glow: "rgba(232,121,249,0.55)",
    holographic: true,
  },
  premium: {
    id: "premium",
    label: "ProDay Premium",
    frame: ["#ff8a3d", "#1a1a1a", "#050505"],
    face: ["#1c1c1c", "#0c0c0c", "#000000"],
    ink: "#fff7ed",
    inkMuted: "rgba(255,247,237,0.75)",
    accent: "#FF6A00",
    glow: "rgba(255,106,0,0.65)",
    holographic: true,
    neon: "#FF6A00",
    carbon: true,
  },
};

export const PASSPORT_BADGE_META: Record<
  PassportBadgeId,
  { label: string; icon: string }
> = {
  in_form: { label: "En forme", icon: "🔥" },
  rising: { label: "Progression rapide", icon: "🚀" },
  scorer: { label: "Buteur", icon: "🎯" },
  defender: { label: "Défenseur solide", icon: "🛡" },
  passer: { label: "Passeur", icon: "⚽" },
  captain: { label: "Capitaine", icon: "👑" },
  talent: { label: "Talent", icon: "💎" },
  motm: { label: "Joueur du match", icon: "⭐" },
  comeback: { label: "Retour de blessure", icon: "🚑" },
  marathon: { label: "Marathonien", icon: "🏃" },
};

/** Silhouette ProDay — découpe moderne (pas un bouclier FIFA). */
export const PASSPORT_CLIP =
  "polygon(8% 0%, 92% 0%, 100% 8%, 100% 88%, 92% 100%, 8% 100%, 0% 88%, 0% 8%)";

export function clamp99(n: number) {
  return Math.max(40, Math.min(99, Math.round(n)));
}

export function statColor(value: number): string {
  if (value >= 90) return "#22c55e";
  if (value >= 80) return "#84cc16";
  if (value >= 70) return "#eab308";
  if (value >= 60) return "#f97316";
  return "#ef4444";
}

export function resolvePassportTier(
  card: ProDayPlayerCardData,
  override?: PassportTierId,
): PassportTierTheme {
  if (override) return PASSPORT_TIERS[override];
  if (card.skinId === "neon" || card.tier === "legend") return PASSPORT_TIERS.legend;
  if (card.overall >= 90) return PASSPORT_TIERS.diamond;
  if (card.overall >= 86) return PASSPORT_TIERS.platinum;
  if (card.tier === "gold" || card.overall >= 80) return PASSPORT_TIERS.gold;
  if (card.tier === "silver" || card.overall >= 70) return PASSPORT_TIERS.silver;
  if (card.tier === "elite") return PASSPORT_TIERS.premium;
  return PASSPORT_TIERS.bronze;
}

export function buildPassportStats(card: ProDayPlayerCardData): PassportStat[] {
  const o = card.overall;
  return [
    {
      key: "pace",
      label: "Vitesse",
      icon: "⚡",
      value: clamp99(o - 2 + (card.maxSpeedKmh > 32 ? 4 : 0) + (card.formPct > 85 ? 2 : 0)),
    },
    {
      key: "shooting",
      label: "Tir",
      icon: "🎯",
      value: clamp99(o - 6 + card.goals * 1.2),
    },
    {
      key: "technique",
      label: "Technique",
      icon: "🎮",
      value: clamp99(o - 1),
    },
    {
      key: "vision",
      label: "Vision",
      icon: "🧠",
      value: clamp99(o - 4 + card.assists * 1.1),
    },
    {
      key: "defense",
      label: "Défense",
      icon: "🛡",
      value: clamp99(o - 16 + (card.primaryPosition.startsWith("D") ? 12 : 0)),
    },
    {
      key: "physical",
      label: "Physique",
      icon: "💪",
      value: clamp99(card.formPct * 0.92 + (card.weightKg > 75 ? 2 : 0)),
    },
  ];
}

export function resolvePerformanceBadges(card: ProDayPlayerCardData): PassportBadgeId[] {
  const out: PassportBadgeId[] = [];
  if (card.formPct >= 85) out.push("in_form");
  if (card.potential - card.overall >= 5 || card.progressLabel.includes("+")) out.push("rising");
  if (card.goals >= 5) out.push("scorer");
  if (card.primaryPosition.startsWith("D") || card.primaryPosition === "MDC") out.push("defender");
  if (card.assists >= 5) out.push("passer");
  if (card.skillBadges.some((b) => /leader|capitaine/i.test(b))) out.push("captain");
  if (card.age <= 21 && card.potential >= 88) out.push("talent");
  if (/mvp|motm|match/i.test(card.lastMatchLabel)) out.push("motm");
  if (card.minutesPlayed >= 1200) out.push("marathon");
  return out.slice(0, 5);
}

export function footIcon(foot: ProDayPlayerCardData["strongFoot"]): string {
  if (foot === "Gauche") return "🦶 L";
  if (foot === "Les deux") return "⚡ 2P";
  return "🦶 R";
}

export type PassportExtras = {
  formPct: number;
  potential: number;
  aiProgressLabel: string;
  lastMatches: string[];
  heatmapHint: string;
  physicalState: string;
  recruiterVisibility: string;
  estimatedValue: string;
  objectives: string[];
  disciplineScore: number;
  attendancePct: number;
  recruitmentStatus: string;
};

export function buildPassportExtras(card: ProDayPlayerCardData): PassportExtras {
  return {
    formPct: card.formPct,
    potential: card.potential,
    aiProgressLabel: card.progressLabel,
    lastMatches: [
      card.lastMatchLabel,
      "Nul 1-1 · Mer.",
      "Victoire 3-0 · Dim.",
    ],
    heatmapHint: card.heatmapHint,
    physicalState: card.formPct >= 80 ? "Disponible · charge optimale" : "Surveillance charge",
    recruiterVisibility: card.verified ? "Haute · profil vérifié" : "Standard",
    estimatedValue: card.estimatedValueLabel,
    objectives: card.aiObjectives,
    disciplineScore: clamp99(78 + (card.formPct > 80 ? 8 : 0)),
    attendancePct: Math.min(100, Math.round(72 + card.matches * 0.9)),
    recruitmentStatus: card.recruitmentStatus,
  };
}

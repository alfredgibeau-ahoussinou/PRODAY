/**
 * Skins FUT ProDay : styles CSS propres (type Ultimate Team).
 * Pas de découpes d’image : gradients + motifs fidèles.
 */

export type FutSkinId =
  | "gold"
  | "silver"
  | "bronze"
  | "totw"
  | "special-pink"
  | "special-purple"
  | "special-blue"
  | "ice"
  | "magma"
  | "emerald"
  | "marble"
  | "neon";

export type FutSkinMeta = {
  id: FutSkinId;
  label: string;
  /** Fond principal (haut → bas) */
  face: [string, string, string];
  /** Cadre métallique */
  frame: [string, string, string];
  ink: string;
  inkMuted: string;
  divider: string;
  glow: string;
  pattern: "rays" | "metal" | "totw" | "hex" | "shards" | "neon" | "ice" | "fire" | "marble";
  lightInk: boolean;
};

export const FUT_SKINS: FutSkinMeta[] = [
  {
    id: "gold",
    label: "Rare Gold",
    face: ["#f5e08a", "#e8c547", "#c9a017"],
    frame: ["#d4b44a", "#a07818", "#6b5010"],
    ink: "#1a1408",
    inkMuted: "rgba(26,20,8,0.7)",
    divider: "rgba(26,20,8,0.35)",
    glow: "rgba(232,197,71,0.7)",
    pattern: "rays",
    lightInk: false,
  },
  {
    id: "silver",
    label: "Rare Silver",
    face: ["#f0f3f7", "#c5ced9", "#8e9aab"],
    frame: ["#ffffff", "#a8b4c4", "#4a5568"],
    ink: "#12151c",
    inkMuted: "rgba(18,21,28,0.72)",
    divider: "rgba(18,21,28,0.32)",
    glow: "rgba(200,210,230,0.65)",
    pattern: "metal",
    lightInk: false,
  },
  {
    id: "bronze",
    label: "Rare Bronze",
    face: ["#e0b080", "#c0844a", "#8a5528"],
    frame: ["#f0d0a8", "#b06a35", "#4a2e14"],
    ink: "#241408",
    inkMuted: "rgba(36,20,8,0.75)",
    divider: "rgba(36,20,8,0.38)",
    glow: "rgba(200,130,60,0.65)",
    pattern: "metal",
    lightInk: false,
  },
  {
    id: "totw",
    label: "TOTW",
    face: ["#222222", "#111111", "#000000"],
    frame: ["#ffe08a", "#c9a018", "#0a0a0a"],
    ink: "#ffe08a",
    inkMuted: "rgba(255,224,138,0.82)",
    divider: "rgba(255,224,138,0.4)",
    glow: "rgba(255,210,80,0.6)",
    pattern: "totw",
    lightInk: true,
  },
  {
    id: "special-pink",
    label: "Special Pink",
    face: ["#ec4899", "#be185d", "#701a75"],
    frame: ["#fbcfe8", "#db2777", "#86198f"],
    ink: "#fff1f2",
    inkMuted: "rgba(255,241,242,0.85)",
    divider: "rgba(255,241,242,0.35)",
    glow: "rgba(244,114,182,0.65)",
    pattern: "hex",
    lightInk: true,
  },
  {
    id: "special-purple",
    label: "Special Purple",
    face: ["#6d28d9", "#4c1d95", "#1e0a4a"],
    frame: ["#ddd6fe", "#8b5cf6", "#3b0764"],
    ink: "#f5f3ff",
    inkMuted: "rgba(245,243,255,0.85)",
    divider: "rgba(245,243,255,0.35)",
    glow: "rgba(167,139,250,0.65)",
    pattern: "shards",
    lightInk: true,
  },
  {
    id: "special-blue",
    label: "Champions",
    face: ["#0891b2", "#0e7490", "#083344"],
    frame: ["#a5f3fc", "#22d3ee", "#155e75"],
    ink: "#ecfeff",
    inkMuted: "rgba(236,254,255,0.85)",
    divider: "rgba(236,254,255,0.35)",
    glow: "rgba(34,211,238,0.6)",
    pattern: "hex",
    lightInk: true,
  },
  {
    id: "ice",
    label: "Ice",
    face: ["#f0f9ff", "#7dd3fc", "#0ea5e9"],
    frame: ["#ffffff", "#38bdf8", "#0369a1"],
    ink: "#0c4a6e",
    inkMuted: "rgba(12,74,110,0.78)",
    divider: "rgba(12,74,110,0.32)",
    glow: "rgba(125,211,252,0.6)",
    pattern: "ice",
    lightInk: false,
  },
  {
    id: "magma",
    label: "Magma",
    face: ["#fb923c", "#ea580c", "#7c2d12"],
    frame: ["#fed7aa", "#f97316", "#431407"],
    ink: "#fff7ed",
    inkMuted: "rgba(255,247,237,0.88)",
    divider: "rgba(255,247,237,0.35)",
    glow: "rgba(251,146,60,0.65)",
    pattern: "fire",
    lightInk: true,
  },
  {
    id: "emerald",
    label: "Emerald",
    face: ["#047857", "#065f46", "#022c22"],
    frame: ["#6ee7b7", "#10b981", "#064e3b"],
    ink: "#ecfdf5",
    inkMuted: "rgba(236,253,245,0.85)",
    divider: "rgba(236,253,245,0.35)",
    glow: "rgba(52,211,153,0.6)",
    pattern: "shards",
    lightInk: true,
  },
  {
    id: "marble",
    label: "Marble Gold",
    face: ["#fafaf9", "#e7e5e4", "#d6d3d1"],
    frame: ["#fef3c7", "#d4af37", "#78350f"],
    ink: "#1c1917",
    inkMuted: "rgba(28,25,23,0.78)",
    divider: "rgba(28,25,23,0.32)",
    glow: "rgba(212,175,55,0.6)",
    pattern: "marble",
    lightInk: false,
  },
  {
    id: "neon",
    label: "Neon",
    face: ["#312e81", "#1e1b4b", "#0f172a"],
    frame: ["#f472b6", "#22d3ee", "#6366f1"],
    ink: "#fce7f3",
    inkMuted: "rgba(252,231,243,0.85)",
    divider: "rgba(252,231,243,0.35)",
    glow: "rgba(244,114,182,0.6)",
    pattern: "neon",
    lightInk: true,
  },
];

export const FUT_SKIN_BY_ID = Object.fromEntries(
  FUT_SKINS.map((s) => [s.id, s]),
) as Record<FutSkinId, FutSkinMeta>;

export const TIER_DEFAULT_SKIN: Record<
  "bronze" | "silver" | "gold" | "elite" | "legend",
  FutSkinId
> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  elite: "totw",
  legend: "special-purple",
};

export function resolveFutSkin(
  tier: "bronze" | "silver" | "gold" | "elite" | "legend",
  skinId?: FutSkinId | null,
): FutSkinMeta {
  if (skinId && FUT_SKIN_BY_ID[skinId]) return FUT_SKIN_BY_ID[skinId];
  return FUT_SKIN_BY_ID[TIER_DEFAULT_SKIN[tier]];
}

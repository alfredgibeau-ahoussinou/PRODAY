"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  RotateCcw,
  Share2,
  Check,
  Flame,
  Shield,
  Zap,
  Target,
  Activity,
  Award,
  Sliders,
  User,
} from "lucide-react";
import {
  FutBackDetails,
  FutCardShell,
  FutFaceLayout,
  StatBar,
  StatChip,
  nationCode,
} from "@/components/cards/FutCardShell";
import { FUT_SKINS, resolveFutSkin, type FutSkinId } from "@/lib/futSkins";
import type {
  ProDayCardTier,
  ProDayPlayerCardData,
} from "@/lib/prodayCards";

export type FutStatKey = "pac" | "sho" | "pas" | "dri" | "def" | "phy";

export type FutCustomCardState = {
  firstName: string;
  lastName: string;
  clubName: string;
  league: string;
  nationality: string;
  position: string;
  secondaryPosition: string;
  overall: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  skinId: FutSkinId;
  tier: ProDayCardTier;
  photoUrl: string;
  editionLabel: string;
  strongFoot: "Droit" | "Gauche" | "Les deux";
  heightCm: number;
  weightKg: number;
  age: number;
};

const POSITIONS = [
  { id: "BU", label: "BU · Buteur", cat: "ATT" },
  { id: "AG", label: "AG · Ailier Gauche", cat: "ATT" },
  { id: "AD", label: "AD · Ailier Droit", cat: "ATT" },
  { id: "MOC", label: "MOC · Milieu Offensif", cat: "MIL" },
  { id: "MC", label: "MC · Milieu Central", cat: "MIL" },
  { id: "MDC", label: "MDC · Milieu Défensif", cat: "MIL" },
  { id: "DG", label: "DG · Défenseur Gauche", cat: "DEF" },
  { id: "DC", label: "DC · Défenseur Central", cat: "DEF" },
  { id: "DD", label: "DD · Défenseur Droit", cat: "DEF" },
  { id: "GB", label: "GB · Gardien de But", cat: "GAR" },
] as const;

const NATIONALITIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "ES", name: "Espagne" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italie" },
  { code: "DE", name: "Allemagne" },
  { code: "BR", name: "Brésil" },
  { code: "MA", name: "Maroc" },
  { code: "SN", name: "Sénégal" },
  { code: "DZ", name: "Algérie" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroun" },
] as const;

const PHOTO_PRESETS = [
  { id: "p1", label: "Joueur 1", url: "/images/card-player-01.jpg" },
  { id: "p2", label: "Joueur Pro", url: "/images/football-pro-01.jpg" },
  { id: "p3", label: "Coach Sarah", url: "/images/card-coach-01.jpg" },
  { id: "p4", label: "Supporter", url: "/images/card-supporter-01.jpg" },
] as const;

const ARCHETYPES: Array<{
  id: string;
  name: string;
  pos: string;
  ovr: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  skin: FutSkinId;
  edition: string;
}> = [
  {
    id: "striker",
    name: "Buteur Clinique",
    pos: "BU",
    ovr: 91,
    pac: 93,
    sho: 94,
    pas: 82,
    dri: 89,
    def: 42,
    phy: 86,
    skin: "totw",
    edition: "Buteur Élite",
  },
  {
    id: "maestro",
    name: "Meneur Maestro",
    pos: "MOC",
    ovr: 89,
    pac: 84,
    sho: 86,
    pas: 95,
    dri: 93,
    def: 62,
    phy: 75,
    skin: "gold",
    edition: "Playmaker Gold",
  },
  {
    id: "winger",
    name: "Ailier Fusée",
    pos: "AG",
    ovr: 88,
    pac: 97,
    sho: 84,
    pas: 83,
    dri: 92,
    def: 45,
    phy: 76,
    skin: "special-pink",
    edition: "Édition Vitesse",
  },
  {
    id: "destroyer",
    name: "Sentinelle Infranchissable",
    pos: "MDC",
    ovr: 87,
    pac: 78,
    sho: 71,
    pas: 85,
    dri: 82,
    def: 91,
    phy: 92,
    skin: "special-blue",
    edition: "Muraille Défensive",
  },
  {
    id: "rock",
    name: "Roc Défensif",
    pos: "DC",
    ovr: 88,
    pac: 82,
    sho: 54,
    pas: 77,
    dri: 74,
    def: 93,
    phy: 91,
    skin: "marble",
    edition: "Colosse",
  },
  {
    id: "keeper",
    name: "Gardien Muraille",
    pos: "GB",
    ovr: 90,
    pac: 88,
    sho: 89,
    pas: 85,
    dri: 91,
    def: 52,
    phy: 89,
    skin: "totw",
    edition: "Gant d'Or",
  },
];

const INITIAL_CARD: FutCustomCardState = {
  firstName: "Amine",
  lastName: "Khelifi",
  clubName: "FC ProDay",
  league: "Régional 1",
  nationality: "France",
  position: "MC",
  secondaryPosition: "MOC",
  overall: 86,
  pac: 84,
  sho: 82,
  pas: 88,
  dri: 87,
  def: 74,
  phy: 80,
  skinId: "gold",
  tier: "gold",
  photoUrl: "/images/card-player-01.jpg",
  editionLabel: "Édition Personnalisée",
  strongFoot: "Droit",
  heightCm: 178,
  weightKg: 72,
  age: 22,
};

type Props = {
  headline?: string;
  subtitle?: string;
};

export function FutCardStudio({
  headline = "Simulateur de Carte FUT 3D en Temps Réel",
  subtitle = "Ajuste chaque curseur statistique, choisis ton poste, change de skin et admire le rendu interactif 3D avec reflets et verso holographique.",
}: Props) {
  const [card, setCard] = useState<FutCustomCardState>(INITIAL_CARD);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "identity" | "skins">("stats");

  const statSliders: Array<{
    id: FutStatKey;
    label: string;
    fullName: string;
    icon: typeof Zap;
    color: string;
  }> = [
    { id: "pac", label: "PAC", fullName: "Vitesse / Accélération", icon: Zap, color: "#F59E0B" },
    { id: "sho", label: "SHO", fullName: "Tir / Finition", icon: Target, color: "#EF4444" },
    { id: "pas", label: "PAS", fullName: "Passe / Vision de jeu", icon: Activity, color: "#3B82F6" },
    { id: "dri", label: "DRI", fullName: "Dribble / Agilité", icon: Sparkles, color: "#EC4899" },
    { id: "def", label: "DEF", fullName: "Défense / Interceptions", icon: Shield, color: "#10B981" },
    { id: "phy", label: "PHY", fullName: "Physique / Puissance", icon: Flame, color: "#8B5CF6" },
  ];

  const updateStat = (key: FutStatKey, val: number) => {
    setCard((prev) => {
      const next = { ...prev, [key]: val };
      return next;
    });
  };

  const calculatedAverage = useMemo(() => {
    return Math.round(
      (card.pac + card.sho + card.pas + card.dri + card.def + card.phy) / 6
    );
  }, [card.pac, card.sho, card.pas, card.dri, card.def, card.phy]);

  const applyArchetype = (arch: (typeof ARCHETYPES)[number]) => {
    setCard((prev) => ({
      ...prev,
      position: arch.pos,
      overall: arch.ovr,
      pac: arch.pac,
      sho: arch.sho,
      pas: arch.pas,
      dri: arch.dri,
      def: arch.def,
      phy: arch.phy,
      skinId: arch.skin,
      tier: arch.skin === "gold" ? "gold" : arch.skin === "totw" ? "elite" : "legend",
      editionLabel: arch.edition,
    }));
  };

  const syncOvrWithAverage = () => {
    setCard((prev) => ({ ...prev, overall: calculatedAverage }));
  };

  // Convert custom card state to ProDayPlayerCardData format for FutCardShell
  const proDayCardData = useMemo<ProDayPlayerCardData>(() => {
    const skinMeta = resolveFutSkin(card.tier, card.skinId);
    return {
      id: "custom-sim-card",
      role: "player",
      tier: card.tier,
      skinId: card.skinId,
      displayName: `${card.firstName} ${card.lastName}`.trim() || "Joueur ProDay",
      firstName: card.firstName,
      lastName: card.lastName || "ProDay",
      photoUrl: card.photoUrl,
      verified: true,
      accentHex: skinMeta.frame[0] || "#FF6A00",
      deepHex: skinMeta.frame[2] || "#8b5a2b",
      actions: ["view_profile", "share", "follow"],
      editionLabel: card.editionLabel,
      age: card.age,
      gender: "M",
      nationality: card.nationality,
      clubName: card.clubName,
      primaryPosition: card.position,
      secondaryPosition: card.secondaryPosition,
      strongFoot: card.strongFoot,
      heightCm: card.heightCm,
      weightKg: card.weightKg,
      levelLabel: card.league,
      league: card.league,
      levelBadge: "Centre",
      overall: card.overall,
      formPct: Math.min(99, Math.round((card.overall / 99) * 100)),
      potential: Math.min(99, card.overall + 4),
      estimatedValueLabel: "Évaluation ProDay",
      matches: 24,
      goals: Math.round((card.sho / 10) * 1.5),
      assists: Math.round((card.pas / 10) * 1.6),
      minutesPlayed: 1890,
      lastMatchLabel: "Note 8.8 / 10",
      maxSpeedKmh: Number((26 + (card.pac / 99) * 8.5).toFixed(1)),
      progressLabel: `Forme ${card.overall > 85 ? "Exceptionnelle" : "Régulière"} · Potentiel ${Math.min(99, card.overall + 4)}`,
      skillBadges: [
        card.overall >= 88 ? "Star Élite" : "Joueur Pro",
        card.pac >= 90 ? "Vitesse Éclair" : null,
        card.sho >= 88 ? "Sniper" : null,
        card.pas >= 88 ? "Vision Maestro" : null,
        card.def >= 88 ? "Muraille" : null,
        card.phy >= 88 ? "Guerrier" : null,
        "Certifié ProDay",
      ].filter(Boolean) as string[],
      aiObjectives: [
        `Maintenir ${card.overall} OVR en match officiel`,
        `Optimiser l'apport en ${card.position}`,
        "Séance vidéo & data personnalisée",
      ],
      recruitmentStatus: "Profil Actif · Ouvert aux détections",
      heatmapHint: `Zone préférentielle : ${card.position}`,
    };
  }, [card]);

  const statsList = [
    { label: "PAC", value: card.pac },
    { label: "SHO", value: card.sho },
    { label: "PAS", value: card.pas },
    { label: "DRI", value: card.dri },
    { label: "DEF", value: card.def },
    { label: "PHY", value: card.phy },
  ];

  const handleShare = () => {
    const text = `Ma carte ProDay FUT : ${card.firstName} ${card.lastName} (${card.position} - ${card.overall} OVR | PAC ${card.pac} | SHO ${card.sho} | PAS ${card.pas} | DRI ${card.dri} | DEF ${card.def} | PHY ${card.phy})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  const skin = resolveFutSkin(card.tier, card.skinId);

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#04060c] px-4 py-16 sm:px-6 sm:py-24">
      {/* Background glow ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 20% 10%, rgba(245, 208, 74, 0.15), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255, 106, 0, 0.12), transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#F5D04A] animate-pulse" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5D04A]">
              Générateur de Cartes FUT 3D
            </p>
          </div>
          <h2 className="font-display text-[clamp(1.75rem,3.8vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
            {headline}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-white/60">
            {subtitle}
          </p>
        </div>

        {/* Archetype Quick Selectors */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">
            Archétypes Préréglés :
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => applyArchetype(arch)}
                className="group shrink-0 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:border-[#F5D04A] hover:bg-[#F5D04A]/10 hover:text-white"
              >
                <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#F5D04A] group-hover:bg-[#F5D04A] group-hover:text-black transition">
                  {arch.pos} · {arch.ovr}
                </span>
                <span>{arch.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Studio Grid : Controls on Left, 3D Card on Right */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_minmax(320px,0.9fr)] xl:grid-cols-[1.2fr_0.8fr] items-start">
          
          {/* CONTROL PANEL */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 backdrop-blur-md">
            
            {/* Tabs */}
            <div className="flex flex-wrap border-b border-white/10 pb-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "stats"
                    ? "bg-[#F5D04A] text-black shadow-lg shadow-[#F5D04A]/20"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Sliders size={14} />
                Curseurs Stats ({card.overall} OVR)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("identity")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "identity"
                    ? "bg-[#F5D04A] text-black shadow-lg shadow-[#F5D04A]/20"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <User size={14} />
                Identité & Poste ({card.position})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("skins")}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "skins"
                    ? "bg-[#F5D04A] text-black shadow-lg shadow-[#F5D04A]/20"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Award size={14} />
                Skins & Hologramme
              </button>
            </div>

            {/* TAB CONTENT: STATS CURSORS */}
            {activeTab === "stats" && (
              <div className="mt-6 space-y-6">
                {/* Global OVR Slider */}
                <div className="rounded-xl border border-[#F5D04A]/30 bg-[#F5D04A]/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5D04A] text-black font-black text-sm">
                        {card.overall}
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Note Globale (OVR)
                        </span>
                        <p className="text-[10px] text-white/50">
                          Moyenne calculée des 6 attributs : {calculatedAverage}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={syncOvrWithAverage}
                      className="rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold text-white/80 hover:border-[#F5D04A] hover:text-[#F5D04A] transition"
                    >
                      Ajuster sur moyenne
                    </button>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="99"
                    value={card.overall}
                    onChange={(e) =>
                      setCard((prev) => ({ ...prev, overall: Number(e.target.value) }))
                    }
                    className="mt-3 w-full accent-[#F5D04A] h-2 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* 6 Realtime Attribute Sliders */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {statSliders.map((s) => {
                    const val = card[s.id];
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                              style={{ backgroundColor: `${s.color}25`, color: s.color }}
                            >
                              <Icon size={13} />
                            </div>
                            <span className="font-bold text-xs uppercase tracking-wide text-white">
                              {s.label}
                            </span>
                            <span className="text-[10px] text-white/40 hidden sm:inline truncate max-w-[90px]">
                              {s.fullName.split("/")[0]}
                            </span>
                          </div>
                          <span
                            className="font-black text-sm tabular-nums"
                            style={{ color: val >= 85 ? s.color : "#FFFFFF" }}
                          >
                            {val}
                          </span>
                        </div>

                        <input
                          type="range"
                          min="40"
                          max="99"
                          value={val}
                          onChange={(e) => updateStat(s.id, Number(e.target.value))}
                          className="mt-2.5 w-full h-1.5 bg-white/15 rounded-lg cursor-pointer"
                          style={{ accentColor: s.color }}
                        />
                        <div className="flex justify-between text-[8px] font-mono text-white/30 mt-1">
                          <span>40</span>
                          <span>70</span>
                          <span>99</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: IDENTITY & POSITION */}
            {activeTab === "identity" && (
              <div className="mt-6 space-y-6">
                {/* Position Selection */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">
                    Poste sur le terrain
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {POSITIONS.map((pos) => {
                      const active = card.position === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setCard((p) => ({ ...p, position: pos.id }))}
                          className={`rounded-lg border p-2 text-left transition ${
                            active
                              ? "border-[#F5D04A] bg-[#F5D04A]/15 text-white"
                              : "border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25"
                          }`}
                        >
                          <p className="font-black text-xs">{pos.id}</p>
                          <p className="text-[9px] truncate text-white/40">{pos.cat}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Name & Club */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1.5">
                      Prénom & Nom
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={card.firstName}
                        placeholder="Prénom"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, firstName: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F5D04A] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={card.lastName}
                        placeholder="Nom"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, lastName: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F5D04A] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1.5">
                      Club & Niveau
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={card.clubName}
                        placeholder="Club"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, clubName: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F5D04A] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={card.league}
                        placeholder="Ligue / Catégorie"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, league: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-[#F5D04A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Nationality & Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1.5">
                      Nationalité
                    </label>
                    <select
                      value={card.nationality}
                      onChange={(e) =>
                        setCard((p) => ({ ...p, nationality: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#F5D04A] focus:outline-none"
                    >
                      {NATIONALITIES.map((n) => (
                        <option key={n.code} value={n.name} className="bg-neutral-900 text-white">
                          {n.name} ({n.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1.5">
                      Pied Fort & Gabarit
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={card.strongFoot}
                        onChange={(e) =>
                          setCard((p) => ({
                            ...p,
                            strongFoot: e.target.value as "Droit" | "Gauche" | "Les deux",
                          }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-xs text-white focus:border-[#F5D04A] focus:outline-none"
                      >
                        <option value="Droit" className="bg-neutral-900">Droit</option>
                        <option value="Gauche" className="bg-neutral-900">Gauche</option>
                        <option value="Les deux" className="bg-neutral-900">2 Pieds</option>
                      </select>
                      <input
                        type="number"
                        value={card.heightCm}
                        placeholder="Taille (cm)"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, heightCm: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-xs text-white focus:border-[#F5D04A] focus:outline-none"
                      />
                      <input
                        type="number"
                        value={card.weightKg}
                        placeholder="Poids (kg)"
                        onChange={(e) =>
                          setCard((p) => ({ ...p, weightKg: Number(e.target.value) }))
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/50 px-2 py-2 text-xs text-white focus:border-[#F5D04A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">
                    Photo / Visuel Joueur
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PHOTO_PRESETS.map((ph) => {
                      const active = card.photoUrl === ph.url;
                      return (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => setCard((p) => ({ ...p, photoUrl: ph.url }))}
                          className={`relative overflow-hidden rounded-lg border p-1 transition ${
                            active ? "border-[#F5D04A] ring-2 ring-[#F5D04A]/30" : "border-white/10 opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ph.url}
                            alt={ph.label}
                            className="h-14 w-full rounded object-cover"
                          />
                          <p className="mt-1 text-[9px] text-center truncate text-white/80 font-bold">
                            {ph.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKINS & HOLOGRAPHIC CHROME */}
            {activeTab === "skins" && (
              <div className="mt-6 space-y-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2">
                    Design Holographique / Skin FUT (12 Styles)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {FUT_SKINS.map((s) => {
                      const active = card.skinId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setCard((p) => ({
                              ...p,
                              skinId: s.id,
                              tier:
                                s.id === "gold"
                                  ? "gold"
                                  : s.id === "silver"
                                  ? "silver"
                                  : s.id === "bronze"
                                  ? "bronze"
                                  : s.id === "totw"
                                  ? "elite"
                                  : "legend",
                              editionLabel: s.label,
                            }))
                          }
                          className={`relative flex flex-col items-center rounded-xl border p-2 text-center transition ${
                            active
                              ? "border-white ring-2 ring-white/50 scale-[1.03]"
                              : "border-white/10 opacity-70 hover:opacity-100"
                          }`}
                          style={{
                            background: `linear-gradient(145deg, ${s.face[0]}, ${s.face[1]} 60%, ${s.face[2]})`,
                          }}
                        >
                          <div className="h-6 w-full rounded-md flex items-center justify-center">
                            <span
                              className="text-[9px] font-black uppercase tracking-wider"
                              style={{ color: s.ink }}
                            >
                              {s.label.split(" ")[0]}
                            </span>
                          </div>
                          <span
                            className="mt-1 text-[8px] font-bold uppercase truncate max-w-full"
                            style={{ color: s.inkMuted }}
                          >
                            {s.pattern}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Edition Label */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1.5">
                    Titre de l&apos;Édition
                  </label>
                  <input
                    type="text"
                    value={card.editionLabel}
                    onChange={(e) =>
                      setCard((p) => ({ ...p, editionLabel: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white focus:border-[#F5D04A] focus:outline-none"
                    placeholder="Ex: MVP Saison 2026, Carte Bêta, etc."
                  />
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setCard(INITIAL_CARD)}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition"
              >
                <RotateCcw size={12} />
                Réinitialiser
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                  {copied ? "Stats Copiées !" : "Partager les stats"}
                </button>
              </div>
            </div>

          </div>

          {/* 3D INTERACTIVE CARD PREVIEW */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[340px]">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Rendu 3D Interactif (Tilt & Flip)
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F5D04A]">
                  <Sparkles size={11} />
                  {skin.label}
                </span>
              </div>

              {/* LIVE FUT 3D CARD SHELL */}
              <FutCardShell
                card={proDayCardData}
                formationLabel={card.position}
                front={
                  <FutFaceLayout
                    rating={card.overall}
                    position={card.position}
                    flagLabel={nationCode(card.nationality)}
                    clubLabel={card.clubName}
                    leagueLabel={card.league}
                    photoUrl={card.photoUrl}
                    name={card.lastName || "JOUEUR"}
                    stats={statsList}
                    ink={skin.ink}
                    inkMuted={skin.inkMuted}
                    divider={skin.divider}
                    upgrade={Math.max(0, proDayCardData.potential - card.overall)}
                  />
                }
                back={
                  <FutBackDetails ink={skin.ink}>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-60">
                      {card.editionLabel}
                    </p>
                    <p className="mt-1 text-xl font-black uppercase leading-tight">
                      {card.firstName} {card.lastName}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold opacity-70">
                      {card.age} ans · {card.strongFoot} · {card.heightCm} cm · {card.weightKg} kg
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <StatChip label="Note OVR" value={card.overall} accent="#fbbf24" animate />
                      <StatChip label="Potentiel" value={Math.min(99, card.overall + 4)} animate />
                      <StatChip label="Vitesse Max" value={`${(26 + (card.pac / 99) * 8.5).toFixed(1)} km/h`} animate />
                      <StatChip label="Forme" value={`${card.overall}%`} animate />
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {statsList.map((s) => (
                        <StatBar key={s.label} label={s.label} value={s.value} ink={skin.ink} />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {proDayCardData.skillBadges.slice(0, 4).map((b) => (
                        <span
                          key={b}
                          className="rounded-full px-2 py-0.5 text-[7px] font-black uppercase"
                          style={{ background: "rgba(0,0,0,0.18)", color: skin.ink }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>

                    <p className="mt-auto pt-2 text-[8px] font-bold opacity-60">
                      Simulateur temps réel · ProDay Engine
                    </p>
                  </FutBackDetails>
                }
              />

              {/* Dynamic Summary Callout */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F5D04A]">
                  Profil Sportif Détecté
                </p>
                <h4 className="mt-1 font-display text-sm font-medium text-white">
                  {card.overall >= 88
                    ? "Athlète Haut Niveau / Élite"
                    : card.overall >= 80
                    ? "Joueur Confirmé / Compétiteur"
                    : "Potentiel en Développement"}
                  {" · "}
                  Point fort : {
                    card.pac >= Math.max(card.sho, card.pas, card.dri, card.def, card.phy)
                      ? "Vitesse pure"
                      : card.sho >= Math.max(card.pac, card.pas, card.dri, card.def, card.phy)
                      ? "Finition devant le but"
                      : card.pas >= Math.max(card.pac, card.sho, card.dri, card.def, card.phy)
                      ? "Création et passes laser"
                      : card.dri >= Math.max(card.pac, card.sho, card.pas, card.def, card.phy)
                      ? "Dribble et percussion"
                      : card.def >= Math.max(card.pac, card.sho, card.pas, card.dri, card.phy)
                      ? "Solidité défensive"
                      : "Impact physique et duels"
                  }
                </h4>
                <p className="mt-2 text-xs text-white/50">
                  Dans l’application ProDay, ces valeurs sont générées à partir de tes données réelles de match, séances coach et capteurs vidéo.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

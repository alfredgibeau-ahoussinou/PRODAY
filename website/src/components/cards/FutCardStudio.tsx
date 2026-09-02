"use client";

import { useState } from "react";
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
import type {
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
};

const DEFAULT_STATE: FutCustomCardState = {
  firstName: "A.",
  lastName: "KHELIFI",
  clubName: "FC ProDay",
  league: "Ligue Paris IDF",
  nationality: "France",
  position: "MC",
  secondaryPosition: "MOC",
  overall: 84,
  pac: 88,
  sho: 85,
  pas: 83,
  dri: 90,
  def: 68,
  phy: 81,
};

export function FutCardStudio({
  headline = "Studio Simulateur",
  subtitle = "Modifie les stats en temps réel et observe la carte 3D se mettre à jour.",
}: {
  headline?: string;
  subtitle?: string;
}) {
  const [state, setState] = useState<FutCustomCardState>(DEFAULT_STATE);
  const [copied, setCopied] = useState(false);

  function reset() {
    setState(DEFAULT_STATE);
  }

  function handleShare() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cardData: any = {
    id: "studio-custom",
    role: "player",
    tier: "elite",
    skinId: "gold",
    firstName: state.firstName,
    lastName: state.lastName,
    displayName: state.lastName,
    nationality: state.nationality,
    clubName: state.clubName,
    league: state.league,
    primaryPosition: state.position,
    secondaryPosition: state.secondaryPosition,
    overall: state.overall,
    potential: Math.min(99, state.overall + 5),
    formPct: 92,
    photoUrl: "/images/card-player-01.jpg",
    age: 22,
    heightCm: 178,
    weightKg: 72,
    matches: 24,
    goals: Math.round(state.sho / 4),
    assists: Math.round(state.pas / 3),
    verified: false,
    accentHex: "#00E676",
    deepHex: "#052424",
    actions: ["view_profile", "share"],
  };

  const statsList = [
    { label: "PAC", value: state.pac },
    { label: "SHO", value: state.sho },
    { label: "PAS", value: state.pas },
    { label: "DRI", value: state.dri },
    { label: "DEF", value: state.def },
    { label: "PHY", value: state.phy },
  ];

  return (
    <section className="bg-[#050505] py-20 text-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        <div className="mb-16 md:text-center">
          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            {headline}
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-start">
          
          {/* Card Preview Container */}
          <div className="sticky top-24 flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
            <FutCardShell
              card={cardData}
              formationLabel={state.position}
              front={
                <FutFaceLayout
                  rating={state.overall}
                  position={state.position}
                  flagLabel={nationCode(state.nationality)}
                  clubLabel={state.clubName}
                  name={state.lastName}
                  stats={statsList}
                  ink="#FFF"
                  inkMuted="rgba(255,255,255,0.6)"
                  divider="rgba(255,255,255,0.1)"
                  photoUrl={cardData.photoUrl}
                />
              }
              back={
                <FutBackDetails ink="#FFF">
                  <p className="mt-1 text-xl font-black uppercase leading-tight">{state.lastName}</p>
                  <p className="mt-1 text-[10px] font-semibold opacity-70">
                    {state.clubName} · {state.position}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                    {statsList.map((s) => (
                      <StatBar key={s.label} label={s.label} value={s.value} ink="#FFF" />
                    ))}
                  </div>
                </FutBackDetails>
              }
            />

            <div className="mt-10 flex gap-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-transform active:scale-95"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? "Copié" : "Partager"}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-8">
            {/* Main Stats Sliders */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#00E676]">
                <Activity size={16} /> Capacités Techniques
              </h3>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {(Object.keys(state) as Array<keyof FutCustomCardState>)
                  .filter((k) => ["overall", "pac", "sho", "pas", "dri", "def", "phy"].includes(k))
                  .map((k) => (
                    <div key={k}>
                      <div className="mb-2 flex justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                          {k}
                        </label>
                        <span className="font-mono text-sm font-bold text-white">
                          {state[k as keyof FutCustomCardState]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="99"
                        value={state[k as keyof FutCustomCardState]}
                        onChange={(e) =>
                          setState({ ...state, [k]: parseInt(e.target.value, 10) })
                        }
                        className="w-full accent-[#00E676]"
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Identity Inputs */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#00E676]">
                <User size={16} /> Identité Joueur
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nom"
                  value={state.lastName}
                  onChange={(v) => setState({ ...state, lastName: v })}
                />
                <Input
                  label="Prénom"
                  value={state.firstName}
                  onChange={(v) => setState({ ...state, firstName: v })}
                />
                <Input
                  label="Club"
                  value={state.clubName}
                  onChange={(v) => setState({ ...state, clubName: v })}
                />
                <Input
                  label="Poste"
                  value={state.position}
                  onChange={(v) => setState({ ...state, position: v })}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm font-semibold text-white focus:border-[#00E676] focus:outline-none"
      />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Eye, Users, Trophy, Target, Sparkles, TrendingUp } from "lucide-react";
import { calculateSponsorVisibility } from "@/lib/sponsorVisibility";

interface SponsorVisibilityWidgetProps {
  packageTier: string;
  regions: string[];
  sports: string[];
  budget?: string;
  title?: string;
  className?: string;
}

export function SponsorVisibilityWidget({
  packageTier,
  regions,
  sports,
  budget,
  title = "Impact & Visibilité estimée en direct",
  className = "",
}: SponsorVisibilityWidgetProps) {
  const estimate = useMemo(() => {
    return calculateSponsorVisibility(
      packageTier,
      regions.length,
      sports.length,
      budget
    );
  }, [packageTier, regions.length, sports.length, budget]);

  return (
    <div
      className={`rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/20 via-[#0a0a0f] to-black p-5 sm:p-6 text-white shadow-xl ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-amber-500/15 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
            <Eye size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400/70">
              Moteur de simulation locale
            </p>
            <h4 className="font-display text-sm font-bold text-white sm:text-base">
              {title}
            </h4>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/20">
          <Sparkles size={12} />
          {estimate.coverageLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/40 text-xs">
            <Users size={14} className="text-amber-400" />
            <span>Joueurs touchés</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
            ~{estimate.playersReached.toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px] text-white/40">Joueurs & licenciés actifs</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/40 text-xs">
            <TrendingUp size={14} className="text-amber-400" />
            <span>Impressions / mois</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-amber-300 sm:text-2xl">
            {estimate.monthlyImpressions.toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px] text-white/40">Vues profils & fils d&apos;actualité</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/40 text-xs">
            <Trophy size={14} className="text-amber-400" />
            <span>Clubs qualifiés</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
            {estimate.activeClubs}
          </p>
          <p className="text-[10px] text-white/40">Structures & équipes</p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-white/40 text-xs">
            <Target size={14} className="text-amber-400" />
            <span>Clics & Leads est.</span>
          </div>
          <p className="mt-1 font-display text-xl font-bold text-emerald-300 sm:text-2xl">
            ~{estimate.estimatedClickLeads}
          </p>
          <p className="text-[10px] text-white/40">Interactions directes / mois</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-white/40 text-center sm:text-left">
        * Estimation temps réel basée sur le réseau de clubs ProDay et les paramètres sélectionnés (régions : {regions.length || "toutes"}, disciplines : {sports.length || "toutes"}).
      </p>
    </div>
  );
}

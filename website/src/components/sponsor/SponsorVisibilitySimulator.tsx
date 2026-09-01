"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Sparkles, MapPin, Target, Users, TrendingUp } from "lucide-react";
import { calculateSponsorVisibility } from "@/lib/sponsorVisibility";
import { SPONSOR_REGIONS, SPONSOR_SPORTS, type SponsorPackageTier } from "@/lib/sponsorContent";
import { ROUTES } from "@/lib/routes";

export function SponsorVisibilitySimulator() {
  const [tier, setTier] = useState<SponsorPackageTier>("territorial");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Île de France"]);
  const [selectedSports, setSelectedSports] = useState<string[]>(["Football amateur"]);

  const estimate = useMemo(() => {
    return calculateSponsorVisibility(
      tier,
      selectedRegions.length,
      selectedSports.length
    );
  }, [tier, selectedRegions.length, selectedSports.length]);

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.length > 1
          ? prev.filter((r) => r !== region)
          : prev
        : [...prev, region]
    );
  };

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.length > 1
          ? prev.filter((s) => s !== sport)
          : prev
        : [...prev, sport]
    );
  };

  return (
    <section className="relative border-t border-white/10 bg-[#080706] px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#EF4444)]">
              Simulateur d&apos;impact
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
              Estimez votre visibilité locale en direct
            </h2>
            <p className="mt-2 text-sm text-white/55 max-w-xl">
              Choisissez votre formule, vos territoires et vos disciplines cibles. Notre algorithme calcule votre portée auprès des clubs et joueurs.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 ring-1 ring-red-500/30">
            <Sparkles size={15} />
            <span>Données réseau ProDay certifiées</span>
          </div>
        </div>

        {/* Configuration du simulateur */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Panneau de gauche: réglages */}
          <div className="lg:col-span-5 space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                1. Formule de partenariat
              </label>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "starter", name: "Découverte", price: "0 €" },
                    { id: "territorial", name: "Territorial", price: "49 €" },
                    { id: "national", name: "National Pro", price: "99 €" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={`rounded-xl border p-3 text-center transition ${
                      tier === t.id
                        ? "border-[var(--pole-accent,#EF4444)] bg-[var(--pole-accent,#EF4444)]/15 text-white ring-1 ring-[var(--pole-accent,#EF4444)]"
                        : "border-white/10 bg-black/40 text-white/60 hover:border-white/25"
                    }`}
                  >
                    <p className="text-xs font-bold">{t.name}</p>
                    <p className="mt-1 text-[11px] text-[var(--pole-accent,#EF4444)] font-mono font-bold">
                      {t.price}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-white/60">
                  2. Territoires prioritaires ({selectedRegions.length})
                </label>
                <span className="text-[11px] text-white/40">Cliquez pour ajouter</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {SPONSOR_REGIONS.slice(0, 8).map((reg) => {
                  const active = selectedRegions.includes(reg);
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => toggleRegion(reg)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-[var(--pole-accent,#EF4444)] text-black font-semibold"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-white/60">
                  3. Disciplines ciblées ({selectedSports.length})
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {SPONSOR_SPORTS.slice(0, 5).map((sport) => {
                  const active = selectedSports.includes(sport);
                  return (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-amber-400 text-black font-semibold"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {sport}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panneau de droite: résultats calculés */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#120808] via-[#090707] to-black p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-mono uppercase tracking-wider">
                  <MapPin size={16} />
                  <span>Rayonnement : {estimate.coverageLabel}</span>
                </div>
                <span className="text-xs text-white/40">Projection mensuelle</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <Users size={16} className="text-[var(--pole-accent,#EF4444)]" />
                    <span>Joueurs & Licenciés touchés</span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-extrabold text-white">
                    {estimate.playersReached.toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-1 text-xs text-white/40">Profils actifs dans vos zones</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <Eye size={16} className="text-amber-400" />
                    <span>Impressions marque / mois</span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-extrabold text-amber-300">
                    {estimate.monthlyImpressions.toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-1 text-xs text-white/40">Dans l&apos;app et sur les fiches clubs</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span>Clubs & Équipes qualifiés</span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-extrabold text-emerald-300">
                    {estimate.activeClubs}
                  </p>
                  <p className="mt-1 text-xs text-white/40">Structures éligibles aux partenariats</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-white/50 text-xs">
                    <Target size={16} className="text-sky-400" />
                    <span>Interactions & Leads / mois</span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-extrabold text-sky-300">
                    ~{estimate.estimatedClickLeads}
                  </p>
                  <p className="mt-1 text-xs text-white/40">Clics vers vos offres & prises de contact</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="text-center sm:text-left text-xs text-white/60">
                Prêt à activer ce dispositif auprès des clubs ?
              </div>
              <Link
                href={`${ROUTES.sponsorDevis}?package=${tier}`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-amber-300"
              >
                Générer mon devis avec ce ciblage
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

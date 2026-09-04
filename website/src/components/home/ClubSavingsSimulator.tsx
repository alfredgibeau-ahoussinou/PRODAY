"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, CheckCircle2, Zap, Clock, Euro } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function ClubSavingsSimulator() {
  const [licencies, setLicencies] = useState(250);

  // Approximate number of teams (1 team ~ 16 players)
  const teams = Math.max(2, Math.round(licencies / 16));

  // SportEasy Club approximate cost (~150€ per team / year)
  const sporteasyCost = teams * 150;

  // ProDay Club cost (3€ per member / year)
  const prodayCost = licencies * 3;

  // Yearly Savings
  const savings = Math.max(0, sporteasyCost - prodayCost);

  // Estimated hours saved per month by volunteers
  const hoursSavedMonth = Math.round(licencies * 0.08);

  // Potential local sponsor revenue generated with ProDay Partner Hub
  const sponsorRevenuePotential = Math.round((licencies / 50) * 800);

  return (
    <section className="relative bg-[#090D16] py-24 sm:py-32 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Explanations & Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#00E676]">
              <Calculator className="h-3.5 w-3.5" />
              SIMULATEUR DE RENTABILITÉ CLUB
            </div>

            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
              Calculez les économies réelles pour{" "}
              <span className="bg-gradient-to-r from-[#00E676] to-[#38BDF8] bg-clip-text text-transparent">
                votre club
              </span>
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Contrairement aux solutions qui facturent chaque équipe individuellement (jusqu&apos;à 150 € / équipe / an),
              ProDay propose un forfait global transparent de <strong>3 € / licencié</strong> qui équipe l&apos;intégralité de vos catégories.
            </p>

            {/* Licencies Slider */}
            <div className="rounded-2xl border border-slate-800 bg-[#0E1422] p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-baseline">
                <label htmlFor="licencies-slider" className="text-sm font-bold text-white">
                  Nombre de licenciés dans votre club :
                </label>
                <span className="font-mono text-2xl font-black text-[#00E676]">
                  {licencies} <span className="text-xs font-normal text-slate-400">licenciés</span>
                </span>
              </div>

              <input
                id="licencies-slider"
                type="range"
                min="50"
                max="800"
                step="10"
                value={licencies}
                onChange={(e) => setLicencies(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-800 accent-[#00E676] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>50 (Petit club de village)</span>
                <span>250 (Moyen club)</span>
                <span>800+ (Grand club urbain)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00E676]" />
                <span>Accès illimité pour tous vos éducateurs, dirigeants, joueurs et parents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00E676]" />
                <span>Sans engagement de durée · Essai gratuit de 30 jours sans CB</span>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Results Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border-2 border-[#00E676]/30 bg-gradient-to-b from-[#0F1829] to-[#0A0E17] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                BILAN COMPARATIF ESTIMÉ
              </h3>

              {/* Big Savings Number */}
              <div className="mt-4 border-b border-slate-800 pb-6">
                <p className="text-sm font-semibold text-slate-300">Économie financière annuelle vs SportEasy :</p>
                <p className="mt-2 font-display text-4xl sm:text-5xl font-black text-[#00E676]">
                  +{savings.toLocaleString("fr-FR")} €{" "}
                  <span className="text-base sm:text-lg font-normal text-slate-400">/ an</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Coût SportEasy (~{sporteasyCost} €) vs ProDay ({prodayCost} €)
                </p>
              </div>

              {/* 2 Key Value Metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Temps Épargné</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">~{hoursSavedMonth}h <span className="text-xs text-slate-400">/ mois</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Moins de gestion manuelle sur les licences et convocations
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="flex items-center gap-2 text-[#38BDF8]">
                    <Euro className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Recettes Sponsors</span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-white">+{sponsorRevenuePotential} € <span className="text-xs text-slate-400">/ an</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Potentiel de financements locaux via le Hub ProDay
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-8">
                <Link
                  href={ROUTES.proClub}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00C853] py-4 text-base font-bold text-black shadow-lg shadow-[#00E676]/20 transition hover:scale-[1.01]"
                >
                  <Zap className="h-5 w-5 fill-black" />
                  Démarrer les 30 Jours d&apos;Essai Gratuit
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Configuration de votre club assistée en moins de 10 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

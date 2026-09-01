"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Clock, Euro, Car, ShieldCheck, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface ClubRoiCalculatorProps {
  initialMembers?: number;
  showCta?: boolean;
  ctaHref?: string;
  className?: string;
  compact?: boolean;
}

export function ClubRoiCalculator({
  initialMembers = 220,
  showCta = true,
  ctaHref = ROUTES.clubDevis,
  className = "",
}: ClubRoiCalculatorProps) {
  const [members, setMembers] = useState<number>(initialMembers);
  const [cotisation, setCotisation] = useState<number>(180);
  const [unpaidRate, setUnpaidRate] = useState<number>(12);
  const [hourlyRate] = useState<number>(20);

  const stats = useMemo(() => {
    // 1. Gain de temps administratif
    const hoursSavedPerMonth = Math.round((members / 25) * 2.8);
    const hoursSavedPerYear = hoursSavedPerMonth * 10;
    const adminSavingsValue = hoursSavedPerYear * hourlyRate;

    // 2. Récupération des cotisations & impayés
    const totalCotisationsPotential = members * cotisation;
    const unpaidLostWithoutProday = totalCotisationsPotential * (unpaidRate / 100);
    const cotisationsRecoveredYear = Math.round(unpaidLostWithoutProday * 0.82);

    // 3. Économies covoiturage & déplacements familles
    const covoiturageTripsOptimized = Math.round(members * 14);
    const co2SavedKg = Math.round(covoiturageTripsOptimized * 3.8);
    const communityFuelSavings = Math.round(members * 65);

    // 4. Coût ProDay estimé
    const prodayCostEstimateYear = Math.round(members * (members > 300 ? 3.0 : members > 150 ? 3.5 : 4.0));

    // 5. Bilan net club
    const clubDirectGains = cotisationsRecoveredYear + adminSavingsValue;
    const netClubGain = clubDirectGains - prodayCostEstimateYear;
    const roiMultiplier = prodayCostEstimateYear > 0 ? (clubDirectGains / prodayCostEstimateYear).toFixed(1) : "10";

    return {
      hoursSavedPerMonth,
      hoursSavedPerYear,
      adminSavingsValue,
      cotisationsRecoveredYear,
      communityFuelSavings,
      co2SavedKg,
      prodayCostEstimateYear,
      clubDirectGains,
      netClubGain,
      roiMultiplier,
    };
  }, [members, cotisation, unpaidRate, hourlyRate]);

  return (
    <div
      className={`rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#120f06] via-[#090805] to-black p-6 sm:p-8 text-white shadow-2xl backdrop-blur-xl ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/15 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30">
            <Calculator className="text-amber-400" size={22} />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400/70">
              Simulateur & Rentabilité
            </p>
            <h3 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              Calculatrice d’économies Club
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/25">
          <Sparkles size={14} />
          <span>Rentabilité estimée : {stats.roiMultiplier}x l’investissement</span>
        </div>
      </div>

      {/* Sliders d'ajustement */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Curseur 1: Nombre de licenciés */}
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-white/70">Licenciés / adhérents</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{members}</span>
          </div>
          <input
            type="range"
            min={30}
            max={800}
            step={10}
            value={members}
            onChange={(e) => setMembers(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>30</span>
            <span>250</span>
            <span>500</span>
            <span>800+</span>
          </div>
        </div>

        {/* Curseur 2: Prix moyen cotisation */}
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-white/70">Cotisation moyenne / joueur</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{cotisation} €</span>
          </div>
          <input
            type="range"
            min={80}
            max={350}
            step={10}
            value={cotisation}
            onChange={(e) => setCotisation(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>80 €</span>
            <span>180 €</span>
            <span>350 €</span>
          </div>
        </div>

        {/* Curseur 3: Taux d'impayés évités */}
        <div className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-white/70">Taux d&apos;impayés / retards sans outil</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{unpaidRate} %</span>
          </div>
          <input
            type="range"
            min={5}
            max={25}
            step={1}
            value={unpaidRate}
            onChange={(e) => setUnpaidRate(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>5 %</span>
            <span>12 %</span>
            <span>25 %</span>
          </div>
        </div>
      </div>

      {/* 3 Blocs Métriques Clés */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Gain 1 : Temps administratif */}
        <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-b from-amber-500/5 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Clock size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Temps administratif</span>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-white">
              +{stats.hoursSavedPerYear}h
              <span className="text-xs font-normal text-white/50 ml-1.5">/ saison</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Soit env. <strong className="text-amber-200">{stats.hoursSavedPerMonth}h par mois</strong> gagnées sur les convocations, pointages et relances.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-amber-400/80 font-mono">
            Valorisation : ~{stats.adminSavingsValue.toLocaleString("fr-FR")} €
          </div>
        </div>

        {/* Gain 2 : Cotisations sécurisées */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <Euro size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Cotisations récupérées</span>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-emerald-300">
              +{stats.cotisationsRecoveredYear.toLocaleString("fr-FR")} €
              <span className="text-xs font-normal text-white/50 ml-1.5">/ an</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Paiement en ligne, rappels automatiques et suivi en direct des licences impayées.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-emerald-400/80 font-mono">
            Zéro trou de trésorerie en début d&apos;année
          </div>
        </div>

        {/* Gain 3 : Covoiturage & Familles */}
        <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-2.5 text-sky-400">
            <Car size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Covoiturage & Pouvoir d&apos;achat</span>
          </div>
          <div className="mt-3">
            <p className="font-display text-3xl font-extrabold text-sky-300">
              +{stats.communityFuelSavings.toLocaleString("fr-FR")} €
              <span className="text-xs font-normal text-white/50 ml-1.5">pour vos familles</span>
            </p>
            <p className="mt-1 text-xs text-white/60">
              Organisation fluide des déplacements et {stats.co2SavedKg} kg de CO₂ économisés.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-sky-400/80 font-mono">
            Fidélisation parents & éco-responsabilité
          </div>
        </div>
      </div>

      {/* Résumé Financier Net */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-5 sm:p-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="text-amber-400" size={20} />
            <span className="font-display text-lg font-bold text-white">
              Bilan net annuel pour votre club
            </span>
          </div>
          <p className="text-xs text-white/60 max-w-xl">
            Pour ~{members} licenciés, l&apos;investissement ProDay (~{stats.prodayCostEstimateYear} €/an) génère{" "}
            <strong className="text-amber-200">{stats.clubDirectGains.toLocaleString("fr-FR")} € de valeur directe</strong> (temps dirigeant préservé + cotisations recouvrées).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <div className="text-center sm:text-right">
            <span className="block text-[10px] uppercase font-mono tracking-wider text-amber-400/70">
              Gain direct estimé
            </span>
            <span className="font-display text-2xl sm:text-3xl font-black text-amber-300">
              +{stats.netClubGain.toLocaleString("fr-FR")} € net
            </span>
          </div>

          {showCta && (
            <Link
              href={`${ctaHref}?members=${members}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-amber-300"
            >
              Demander mon devis club
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  SPONSOR_PRICING_TIERS,
  SUBSCRIPTION_PLANS_WEB,
  type ProductLineWeb,
} from "@/lib/content";
import { formatPriceEur, yearlyPriceFromMonthly } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

const UNIVERSE_LABELS: Record<ProductLineWeb, string> = {
  homme: "Man",
  woman: "Woman",
  amateur: "Amateur",
  supporter: "Supporter",
  pro: "Pro",
  sante: "Santé",
};

export function PricingOverview() {
  const appPlans = SUBSCRIPTION_PLANS_WEB;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Vue d&apos;ensemble
      </p>
      <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
        Tous les tarifs ProDay
      </h2>
      <p className="mt-3 max-w-2xl text-white/55">
        Compte gratuit pour chaque rôle — upgrade Pro au tarif mensuel de base, ou annuel
        avec 20 % de remise. Partenaires : trois formules (dont gratuite et devis).
      </p>

      <div className="card-premium mt-10 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-white/45">
              <th className="px-4 py-3 font-semibold">Formule</th>
              <th className="px-4 py-3 font-semibold">Univers</th>
              <th className="px-4 py-3 font-semibold">Mensuel</th>
              <th className="px-4 py-3 font-semibold">Annuel (−20 %)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {appPlans.map((plan) => {
              const yearly = yearlyPriceFromMonthly(plan.monthlyEur);
              const universes = plan.universes.map((u) => UNIVERSE_LABELS[u]).join(" · ");
              return (
                <tr key={plan.id} className="text-white/80">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{plan.label}</span>
                    <p className="mt-0.5 text-xs text-white/45">{plan.tagline}</p>
                  </td>
                  <td className="px-4 py-3 text-white/60">{universes}</td>
                  <td className="px-4 py-3 font-medium tabular-nums text-white">
                    {formatPriceEur(plan.monthlyEur)} €
                  </td>
                  <td className="px-4 py-3 tabular-nums text-white/60">
                    {formatPriceEur(yearly)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
          Espace partenaires
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SPONSOR_PRICING_TIERS.map((tier) => (
            <div key={tier.id} className="card-premium rounded-xl p-4">
              <p className="font-semibold text-white">{tier.name}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {tier.monthlyEur === 0
                  ? "Gratuit"
                  : `${formatPriceEur(tier.monthlyEur)} €/mois`}
              </p>
              <p className="mt-1 text-xs text-white/45">{tier.tagline}</p>
            </div>
          ))}
        </div>
        <Link
          href={ROUTES.sponsor}
          className="mt-4 inline-block text-sm font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200"
        >
          Détail des formules sponsor →
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-white/35">
        Tarifs HT · IAP en déploiement progressif · bêta gratuite pendant le lancement
      </p>
    </div>
  );
}

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
  pro: "Pro",
  sante: "Santé",
};

export function PricingOverview() {
  const appPlans = SUBSCRIPTION_PLANS_WEB;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Vue d&apos;ensemble
      </p>
      <h2 className="font-display mt-2 text-2xl font-bold text-neutral-950 sm:text-3xl">
        Tous les tarifs ProDay
      </h2>
      <p className="mt-3 max-w-2xl text-neutral-600">
        Compte gratuit pour chaque rôle — upgrade Pro au tarif mensuel de base, ou annuel
        avec 20 % de remise. Partenaires : trois formules (dont gratuite et devis).
      </p>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-semibold">Formule</th>
              <th className="px-4 py-3 font-semibold">Univers</th>
              <th className="px-4 py-3 font-semibold">Mensuel</th>
              <th className="px-4 py-3 font-semibold">Annuel (−20 %)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {appPlans.map((plan) => {
              const yearly = yearlyPriceFromMonthly(plan.monthlyEur);
              const universes = plan.universes.map((u) => UNIVERSE_LABELS[u]).join(" · ");
              return (
                <tr key={plan.id} className="text-neutral-800">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-neutral-950">{plan.label}</span>
                    <p className="mt-0.5 text-xs text-neutral-500">{plan.tagline}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{universes}</td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {formatPriceEur(plan.monthlyEur)} €
                  </td>
                  <td className="px-4 py-3 tabular-nums text-neutral-600">
                    {formatPriceEur(yearly)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          Espace partenaires
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {SPONSOR_PRICING_TIERS.map((tier) => (
            <div key={tier.id} className="rounded-xl border border-blue-100 bg-white p-4">
              <p className="font-semibold text-neutral-950">{tier.name}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">
                {tier.monthlyEur === 0
                  ? "Gratuit"
                  : `${formatPriceEur(tier.monthlyEur)} €/mois`}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{tier.tagline}</p>
            </div>
          ))}
        </div>
        <Link
          href={ROUTES.partenaires}
          className="mt-4 inline-block text-sm font-semibold text-blue-800 underline underline-offset-4"
        >
          Détail des formules partenaires →
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-500">
        Tarifs HT · IAP en déploiement progressif · bêta gratuite pendant le lancement
      </p>
    </div>
  );
}

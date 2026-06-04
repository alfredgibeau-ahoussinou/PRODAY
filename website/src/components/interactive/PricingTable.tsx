"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS_WEB } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function PricingTable() {
  const [yearly, setYearly] = useState(false);
  const [activePlan, setActivePlan] = useState(0);
  const plan = SUBSCRIPTION_PLANS_WEB[activePlan];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              !yearly ? "bg-white shadow-sm" : ""
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              yearly ? "bg-white shadow-sm" : ""
            }`}
          >
            Annuel (-20%)
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {SUBSCRIPTION_PLANS_WEB.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePlan(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activePlan === i
                ? "bg-proday-ink text-white"
                : "bg-neutral-100 text-proday-muted hover:bg-neutral-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <motion.div
        key={plan.id + String(yearly)}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg"
      >
        <div className="border-b border-neutral-100 bg-neutral-50 p-8 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">{plan.label}</h3>
              <p className="mt-1 text-proday-muted">{plan.tagline}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold">
                {yearly ? plan.yearlyEur : plan.monthlyEur}€
              </span>
              <span className="text-proday-muted">
                /{yearly ? "an" : "mois"}
              </span>
              {plan.storeAvailable && (
                <p className="mt-1 text-xs font-medium text-proday-success">
                  Disponible en store
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-neutral-100 p-8 sm:border-b-0 sm:border-r">
            <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
              Gratuit
            </p>
            <ul className="mt-4 space-y-3">
              {plan.freeIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm">
                  <Check size={16} className="shrink-0 text-neutral-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-proday-ink">
              Pro
            </p>
            <ul className="mt-4 space-y-3">
              {plan.proIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm font-medium">
                  <Check size={16} className="shrink-0 text-proday-success" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-100 bg-neutral-50 p-6 text-center">
          <p className="text-sm text-proday-muted">
            IAP en cours de déploiement — bêta gratuite. Inscrits informés
            quotidiennement de l&apos;avancement.
          </p>
          <Link
            href={ROUTES.beta}
            className="mt-4 inline-block rounded-full bg-proday-ink px-8 py-3 text-sm font-semibold text-white"
          >
            Rejoindre la beta
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

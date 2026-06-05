"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  isPremiumWebPlan,
  plansForUniverse,
  UNIVERSE_LOGOS,
  type ProductLineWeb,
  type WebSubscriptionPlan,
} from "@/lib/content";
import {
  ANNUAL_DISCOUNT_PERCENT,
  annualSavingsFromMonthly,
  formatPriceEur,
  fullAnnualPrice,
  monthlyEquivalentFromYearly,
} from "@/lib/pricing";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { ROUTES } from "@/lib/routes";

const UNIVERSE_OPTIONS: { id: ProductLineWeb; label: string }[] = [
  { id: "homme", label: "Man" },
  { id: "woman", label: "Woman" },
  { id: "pro", label: "Pro" },
];

function PlanPriceBlock({
  plan,
  yearly,
  premium,
}: {
  plan: WebSubscriptionPlan;
  yearly: boolean;
  premium: boolean;
}) {
  const fullYear = fullAnnualPrice(plan.monthlyEur);
  const savings = annualSavingsFromMonthly(plan.monthlyEur);
  const monthlyFromYearly = monthlyEquivalentFromYearly(plan.yearlyEur);

  const priceShell = premium
    ? "w-full rounded-2xl bg-white/10 p-6 text-left sm:w-auto sm:min-w-[260px] sm:text-right"
    : "text-right";

  const mutedClass = premium ? "text-blue-100" : "text-proday-muted";
  const accentClass = premium ? "text-white" : "text-proday-ink";
  const savingsClass = premium ? "text-amber-300" : "text-proday-success";

  return (
    <div className={priceShell}>
      {premium && (
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
          Tarif {plan.label}
        </p>
      )}

      {yearly ? (
        <>
          <p className={`text-xs font-semibold uppercase tracking-wider ${premium ? "text-amber-300" : "text-proday-muted"}`}>
            Facturation annuelle · −{ANNUAL_DISCOUNT_PERCENT} %
          </p>
          <p className={`mt-2 tabular-nums ${premium ? "" : ""}`}>
            <span
              className={`font-bold tabular-nums ${premium ? "text-5xl font-black" : "text-4xl"}`}
            >
              {formatPriceEur(plan.yearlyEur)} €
            </span>
            <span className={`text-lg ${mutedClass}`}> /an</span>
          </p>
          <p className={`mt-2 text-sm ${mutedClass}`}>
            soit{" "}
            <span className={`font-semibold ${accentClass}`}>
              {formatPriceEur(monthlyFromYearly)} €/mois
            </span>{" "}
            en facturation annuelle
          </p>
          <p className={`mt-2 text-sm font-medium ${savingsClass}`}>
            −{ANNUAL_DISCOUNT_PERCENT} % · économisez {formatPriceEur(savings)} €
            <span className={`font-normal ${mutedClass}`}>
              {" "}
              vs {formatPriceEur(fullYear)} € (12 ×{" "}
              {formatPriceEur(plan.monthlyEur)} €)
            </span>
          </p>
          <p className={`mt-1 text-xs ${premium ? "text-blue-200/80" : "text-proday-muted"}`}>
            ou {formatPriceEur(plan.monthlyEur)} €/mois sans engagement
          </p>
        </>
      ) : (
        <>
          <p className={`text-xs font-semibold uppercase tracking-wider ${premium ? "text-amber-300" : "text-proday-muted"}`}>
            Tarif de base · mensuel
          </p>
          <p className="mt-2 tabular-nums">
            <span
              className={`font-bold tabular-nums ${premium ? "text-5xl font-black" : "text-4xl"}`}
            >
              {formatPriceEur(plan.monthlyEur)} €
            </span>
            <span className={`text-lg ${mutedClass}`}> /mois</span>
          </p>
        </>
      )}

      {plan.storeAvailable && (
        <p className="mt-2 text-xs font-medium text-proday-success">
          Disponible en store
        </p>
      )}
      {"commissionPercent" in plan && plan.commissionPercent != null && (
        <p
          className={`mt-2 text-xs font-medium ${premium ? "text-amber-200" : "text-blue-800"}`}
        >
          + {plan.commissionPercent} % par RDV via l&apos;app
        </p>
      )}
    </div>
  );
}

export function PricingTable({
  initialUniverse = "homme",
}: {
  initialUniverse?: ProductLineWeb;
}) {
  const [yearly, setYearly] = useState(false);
  const [universe, setUniverse] = useState<ProductLineWeb>(initialUniverse);
  const [activePlan, setActivePlan] = useState(0);

  const plans = useMemo(() => plansForUniverse(universe), [universe]);
  const plan = plans[activePlan] ?? plans[0];
  const premium = plan ? isPremiumWebPlan(plan) : false;
  const theme = UNIVERSE_THEME[universe];

  const selectUniverse = (line: ProductLineWeb) => {
    setUniverse(line);
    setActivePlan(0);
  };

  if (!plan) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {UNIVERSE_OPTIONS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => selectUniverse(u.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              universe === u.id
                ? `${UNIVERSE_THEME[u.id].pricingAccent} text-white`
                : "bg-neutral-100 text-proday-muted hover:bg-neutral-200"
            }`}
          >
            <Image
              src={UNIVERSE_LOGOS[u.id]}
              alt=""
              width={20}
              height={20}
              className="rounded-md"
            />
            {u.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
            Annuel (−{ANNUAL_DISCOUNT_PERCENT} %)
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {plans.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePlan(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activePlan === i
                ? `${theme.pricingAccent} text-white`
                : "bg-neutral-100 text-proday-muted hover:bg-neutral-200"
            }`}
          >
            {p.label}
            {isPremiumWebPlan(p) && (
              <span
                className={
                  activePlan === i
                    ? " ml-1.5 font-semibold text-blue-100"
                    : " ml-1.5 font-semibold text-blue-800"
                }
              >
                · {formatPriceEur(p.monthlyEur)} €/mois
              </span>
            )}
          </button>
        ))}
      </div>

      <motion.div
        key={`${universe}-${plan.id}-${String(yearly)}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl border bg-white shadow-lg ${
          premium
            ? "border-blue-900/30 ring-2 ring-amber-400/60"
            : "border-neutral-200"
        }`}
      >
        <div
          className={`border-b p-8 sm:p-10 ${
            premium
              ? "border-white/10 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white"
              : "border-neutral-100 bg-neutral-50"
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              {premium && (
                <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                  Formule Elite
                </span>
              )}
              <h3 className={`text-2xl font-bold ${premium ? "mt-3" : ""}`}>
                {plan.label}
              </h3>
              <p className={premium ? "mt-1 text-blue-100" : "mt-1 text-proday-muted"}>
                {plan.tagline}
              </p>
            </div>
            <PlanPriceBlock plan={plan} yearly={yearly} premium={premium} />
          </div>
        </div>
        {"commissionNote" in plan && plan.commissionNote && (
          <div className="border-b border-neutral-100 bg-blue-50 px-8 py-4 sm:px-10">
            <p className="text-center text-sm text-blue-900/90">
              {plan.commissionNote}
            </p>
          </div>
        )}
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
            className={`mt-4 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white ${theme.pricingAccent}`}
          >
            Rejoindre la beta
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

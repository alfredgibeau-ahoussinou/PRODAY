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

  const mutedClass = "text-white/50";
  const accentClass = "text-white";
  const savingsClass = premium ? "text-amber-300" : "text-[var(--proday-accent)]";

  return (
    <div className={priceShell}>
      {premium && (
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
          Tarif {plan.label}
        </p>
      )}

      {yearly ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
            Facturation annuelle · −{ANNUAL_DISCOUNT_PERCENT} %
          </p>
          <p className="mt-2 tabular-nums">
            <span
              className={`font-bold tabular-nums ${premium ? "text-5xl font-black" : "text-4xl text-white"}`}
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
          <p className="mt-1 text-xs text-white/40">
            ou {formatPriceEur(plan.monthlyEur)} €/mois sans engagement
          </p>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
            Tarif de base · mensuel
          </p>
          <p className="mt-2 tabular-nums">
            <span
              className={`font-bold tabular-nums text-white ${premium ? "text-5xl font-black" : "text-4xl"}`}
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
        <p className="mt-2 text-xs font-medium text-amber-200/90">
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
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              universe === u.id
                ? `${UNIVERSE_THEME[u.id].pricingAccent} text-white`
                : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
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
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`min-h-10 rounded-full px-5 py-2 text-sm font-medium transition ${
              !yearly ? "bg-[var(--proday-accent)] text-black" : "text-white/60"
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`min-h-10 rounded-full px-5 py-2 text-sm font-medium transition ${
              yearly ? "bg-[var(--proday-accent)] text-black" : "text-white/60"
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
            className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition ${
              activePlan === i
                ? `${theme.pricingAccent} text-white`
                : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20"
            }`}
          >
            {p.label}
            {isPremiumWebPlan(p) && (
              <span
                className={
                  activePlan === i
                    ? " ml-1.5 font-semibold text-blue-100"
                    : " ml-1.5 font-semibold text-blue-300"
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
        className={`card-premium mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl ${
          premium ? "ring-2 ring-amber-400/40" : ""
        }`}
      >
        <div
          className={`border-b border-white/10 p-6 sm:p-10 ${
            premium
              ? "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white"
              : "bg-[#0a0a0a]"
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              {premium && (
                <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                  Formule Elite
                </span>
              )}
              <h3 className={`text-2xl font-bold text-white ${premium ? "mt-3" : ""}`}>
                {plan.label}
              </h3>
              <p className={premium ? "mt-1 text-blue-100" : "mt-1 text-white/55"}>
                {plan.tagline}
              </p>
            </div>
            <PlanPriceBlock plan={plan} yearly={yearly} premium={premium} />
          </div>
        </div>
        {"commissionNote" in plan && plan.commissionNote && (
          <div className="border-b border-white/10 bg-blue-950/30 px-6 py-4 sm:px-10">
            <p className="text-center text-sm text-blue-100/90">
              {plan.commissionNote}
            </p>
          </div>
        )}
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-white/8 p-6 sm:border-b-0 sm:border-r sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Gratuit
            </p>
            <ul className="mt-4 space-y-3">
              {plan.freeIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-white/65">
                  <Check size={16} className="shrink-0 text-white/30" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--proday-accent)]">
              Pro
            </p>
            <ul className="mt-4 space-y-3">
              {plan.proIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm font-medium text-white/85">
                  <Check size={16} className="shrink-0 text-[var(--proday-accent)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/8 bg-[#050505] p-6 text-center">
          <p className="text-sm text-white/50">
            IAP en cours de déploiement. bêta gratuite. Inscrits informés
            quotidiennement de l&apos;avancement.
          </p>
          <Link
            href={ROUTES.betaWaitlist}
            className={`mt-4 inline-flex min-h-11 items-center rounded-full px-8 py-3 text-sm font-semibold text-white ${theme.pricingAccent}`}
          >
            Rejoindre la beta
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

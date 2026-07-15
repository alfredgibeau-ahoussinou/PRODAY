"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlanDetailCard } from "@/components/poles/PlanDetailCard";
import { SponsorPricingSection } from "@/components/sponsor/SponsorPricingSection";
import {
  CAROUSEL_POLES,
  POLE_STYLES,
  plansForPole,
  poleById,
  resolvePricingPoleFromHash,
  type PoleId,
} from "@/lib/poles";
import { ANNUAL_DISCOUNT_PERCENT } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";
import { scrollToHashElement } from "@/lib/scrollToHash";

const POLE_NAV_LABELS: Record<PoleId, string> = {
  amateur: "Amateur",
  supporter: "Supporter",
  sante: "Santé",
  pro_joueur: "Pro Joueur",
  pro_club: "Pro Club",
  pro_staff: "Pro Staff",
  sponsor: "Partenaires",
};

const POLE_NAV: { id: PoleId; label: string }[] = CAROUSEL_POLES.map((p) => ({
  id: p.id,
  label: POLE_NAV_LABELS[p.id],
}));

const DOT_ACTIVE: Record<PoleId, string> = {
  amateur: "bg-orange-500",
  supporter: "bg-violet-600",
  sante: "bg-teal-500",
  pro_joueur: "bg-emerald-500",
  pro_club: "bg-blue-600",
  pro_staff: "bg-indigo-600",
  sponsor: "bg-amber-400",
};

const VARIANT_LABELS: Record<string, string> = {};

const SLIDE_OFFSET = 56;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? SLIDE_OFFSET : -SLIDE_OFFSET,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -SLIDE_OFFSET : SLIDE_OFFSET,
    opacity: 0,
  }),
};

function poleIndex(id: PoleId): number {
  return POLE_NAV.findIndex((p) => p.id === id);
}

type PolePricingPanelProps = {
  poleId: PoleId;
  yearly: boolean;
};

function PolePricingPanel({ poleId, yearly }: PolePricingPanelProps) {
  const pole = poleById(poleId);
  const styles = POLE_STYLES[poleId];
  const plans = plansForPole(poleId);

  return (
    <div
      id={poleId}
      className={`relative min-h-[480px] scroll-mt-32 rounded-3xl ${styles.section} p-6 sm:p-10 lg:p-12`}
    >
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        <Image
          src={pole.logo}
          alt=""
          width={64}
          height={64}
          className="rounded-2xl bg-white/10 ring-1 ring-white/20"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold tracking-[0.2em] ${styles.textMuted}`}>
            {pole.kicker}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
            {pole.title}
          </h2>
          <p className={`mt-1 text-sm font-medium ${styles.textMuted}`}>{pole.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
            {pole.description}
          </p>
          <Link
            href={pole.href}
            className="mt-4 inline-block text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white/60"
          >
            En savoir plus
          </Link>
        </div>
      </div>

      {poleId === "sponsor" ? (
        <div className="mt-10">
          <SponsorPricingSection compact showPillars dark yearly={yearly} hideToggle />
        </div>
      ) : (
        <div
          className={`mt-10 grid gap-6 ${
            plans.length > 2 ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-2"
          }`}
        >
          {plans.length > 0 ? (
            plans.map((plan) => (
              <PlanDetailCard
                key={`${poleId}-${plan.id}-${plan.label}`}
                plan={plan}
                yearly={yearly}
                styles={styles}
                variantLabel={VARIANT_LABELS[plan.label]}
              />
            ))
          ) : poleId === "supporter" ? (
            <div className="rounded-2xl border border-violet-400/30 bg-violet-950/40 p-8 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                0 € / mois
              </p>
              <p className="mt-3 text-2xl font-bold text-white">Tribune 100 % gratuite</p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
                Matchs live, suivis illimités, débats, réels et shop — sans abonnement ni paywall.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}


export function PolesPricingLayout() {
  const [yearly, setYearly] = useState(false);
  const [activePole, setActivePole] = useState<PoleId>("amateur");
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const fromHash = resolvePricingPoleFromHash(window.location.hash);
    if (fromHash) {
      setActivePole((current) => {
        if (current !== fromHash) {
          setDirection(poleIndex(fromHash) > poleIndex(current) ? 1 : -1);
        }
        return fromHash;
      });
    }
  }, []);

  const goToPole = useCallback((id: PoleId, dir?: number) => {
    setActivePole((current) => {
      if (current !== id) {
        setDirection(dir ?? (poleIndex(id) > poleIndex(current) ? 1 : -1));
      }
      return id;
    });
    window.history.replaceState(null, "", `${ROUTES.pricing}#${id}`);
  }, []);

  const goNext = useCallback(() => {
    const idx = poleIndex(activePole);
    const next = POLE_NAV[(idx + 1) % POLE_NAV.length];
    goToPole(next.id, 1);
  }, [activePole, goToPole]);

  const goPrev = useCallback(() => {
    const idx = poleIndex(activePole);
    const prev = POLE_NAV[(idx - 1 + POLE_NAV.length) % POLE_NAV.length];
    goToPole(prev.id, -1);
  }, [activePole, goToPole]);

  useEffect(() => {
    const onHashChange = () => {
      const fromHash = resolvePricingPoleFromHash(window.location.hash);
      if (fromHash) goToPole(fromHash);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [goToPole]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!resolvePricingPoleFromHash(window.location.hash)) return;

    let attempts = 0;
    let frame = 0;

    const scroll = () => {
      if (scrollToHashElement(`#${hash}`)) return;
      attempts += 1;
      if (attempts < 24) frame = requestAnimationFrame(scroll);
    };

    const timeout = window.setTimeout(() => {
      frame = requestAnimationFrame(scroll);
    }, 120);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [activePole]);

  const activeStyles = POLE_STYLES[activePole];
  const activeIndex = poleIndex(activePole);

  return (
    <div className="surface-dark -mt-px pb-16">
      <div className="sticky top-16 z-40 border-b border-white/10 bg-[#030303]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <nav
            className="scroll-snap-x -mx-4 flex w-full gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0"
            aria-label="Pôles tarifaires"
          >
            {POLE_NAV.map((item) => {
              const styles = POLE_STYLES[item.id];
              const isActive = activePole === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToPole(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-medium transition sm:shrink ${
                    isActive ? styles.navActive : styles.nav
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                !yearly ? "bg-[var(--proday-accent)] text-black" : "text-white/60"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                yearly ? "bg-[var(--proday-accent)] text-black" : "text-white/60"
              }`}
            >
              Annuel (−{ANNUAL_DISCOUNT_PERCENT} %)
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Pôle précédent"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className={`text-xs font-semibold tracking-[0.2em] ${activeStyles.textMuted}`}>
              {poleById(activePole).kicker}
            </p>
            <div className="flex items-center gap-2">
              {POLE_NAV.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToPole(item.id)}
                  aria-label={item.label}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex
                      ? `w-8 ${DOT_ACTIVE[item.id]}`
                      : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Pôle suivant"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activePole}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <PolePricingPanel poleId={activePole} yearly={yearly} />
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-10 text-center text-xs text-white/35">
          Tarifs et quotas affichés à titre informatif — pas de métriques d&apos;audience live.
        </p>
        <p className="mt-4 text-center text-sm text-white/45">
          Questions sur les formules ?{" "}
          <Link href={ROUTES.faq} className="font-medium text-white/70 underline hover:text-white">
            FAQ
          </Link>{" "}
          ·{" "}
          <Link href={ROUTES.partenaires} className="font-medium text-white/70 underline hover:text-white">
            Partenaires
          </Link>{" "}
          ·{" "}
          <Link href={ROUTES.betaWaitlist} className="font-medium text-white/70 underline hover:text-white">
            Liste d&apos;attente
          </Link>
        </p>
      </div>
    </div>
  );
}

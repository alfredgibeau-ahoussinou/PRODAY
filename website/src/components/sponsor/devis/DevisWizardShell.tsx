"use client";

import { motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SPONSOR_DEVIS_STEPS,
  type SponsorDevisStepId,
} from "@/lib/sponsorContent";
import { ROUTES } from "@/lib/routes";

type DevisWizardShellProps = {
  stepId: SponsorDevisStepId | "intro" | "confirmation";
  children: React.ReactNode;
  onNext?: () => void;
  onBackHref?: string;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextHref?: string;
  hideNav?: boolean;
  footer?: React.ReactNode;
};

function stepIndexFor(stepId: string): number {
  return SPONSOR_DEVIS_STEPS.findIndex((s) => s.id === stepId);
}

export function DevisWizardShell({
  stepId,
  children,
  onNext,
  onBackHref,
  nextDisabled,
  nextLabel = "Continuer",
  nextHref,
  hideNav,
  footer,
}: DevisWizardShellProps) {
  const pathname = usePathname();
  const index = stepIndexFor(stepId);
  const step = index >= 0 ? SPONSOR_DEVIS_STEPS[index] : null;
  const progress =
    stepId === "confirmation"
      ? 100
      : index >= 0
        ? ((index + 1) / SPONSOR_DEVIS_STEPS.length) * 100
        : 8;

  return (
    <div className="sponsor-pole min-h-[70vh] bg-gradient-to-b from-[#0c0a06] via-black to-black py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-400/70">
          <Link href={ROUTES.sponsor} className="hover:text-amber-300">
            Pôle Sponsor
          </Link>
          <span className="mx-2 text-white/20">/</span>
          Demande de devis
        </p>

        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0c0a06] via-[#0a0a0f] to-black shadow-[0_0_80px_rgba(212,175,55,0.06)]">
          <div className="border-b border-amber-500/10 px-6 py-5 sm:px-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
                  <Building2 size={20} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/70">
                    Devis partenaire
                  </p>
                  <p className="font-display text-lg font-bold text-white">
                    {step?.title ??
                      (stepId === "confirmation"
                        ? "Demande envoyée"
                        : "Demander un devis")}
                  </p>
                </div>
              </div>
              {index >= 0 ? (
                <span className="text-sm tabular-nums text-white/40">
                  {index + 1} / {SPONSOR_DEVIS_STEPS.length}
                </span>
              ) : null}
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            {index >= 0 ? (
              <div className="mt-4 hidden gap-2 sm:flex">
                {SPONSOR_DEVIS_STEPS.map((s, i) => {
                  const active = s.path === pathname || s.id === stepId;
                  const done = i < index;
                  return (
                    <Link
                      key={s.id}
                      href={done ? s.path : pathname}
                      aria-disabled={!done && !active}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40"
                          : done
                            ? "text-amber-400/60 hover:text-amber-300"
                            : "pointer-events-none text-white/25"
                      }`}
                    >
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {step?.description ? (
              <p className="mb-6 text-white/55">{step.description}</p>
            ) : null}
            {children}

            {!hideNav ? (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-amber-500/10 pt-8">
                {onBackHref ? (
                  <Link
                    href={onBackHref}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white/60 transition hover:text-white"
                  >
                    <ChevronLeft size={18} />
                    Retour
                  </Link>
                ) : (
                  <span />
                )}

                {footer ? (
                  footer
                ) : nextHref ? (
                  <Link
                    href={nextDisabled ? pathname : nextHref}
                    aria-disabled={nextDisabled}
                    className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-amber-300 ${
                      nextDisabled ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    {nextLabel}
                    <ChevronRight size={18} />
                  </Link>
                ) : onNext ? (
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={nextDisabled}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {nextLabel}
                    <ChevronRight size={18} />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

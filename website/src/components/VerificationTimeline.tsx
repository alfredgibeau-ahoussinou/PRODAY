"use client";

import { motion } from "framer-motion";
import { Check, Clock, Shield } from "lucide-react";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { VERIFICATION_STEPS } from "@/lib/content";

type VerificationTimelineProps = {
  fullPage?: boolean;
  embedded?: boolean;
};

export function VerificationTimeline({
  fullPage,
  embedded,
}: VerificationTimelineProps) {
  const [step, setStep] = useState(2);

  const showHeader = !fullPage && !embedded;

  return (
    <section
      className={
        embedded
          ? "py-8"
          : fullPage
            ? "py-12"
            : "border-t border-neutral-200 py-24"
      }
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {showHeader && (
          <Reveal>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-proday-ink p-4 text-white">
                <Shield size={28} />
              </div>
              <div>
                <p className="text-sm font-medium tracking-widest text-proday-muted">
                  CONFIANCE
                </p>
                <h2 className="mt-1 text-3xl font-bold sm:text-4xl">
                  Vérification coach & agent
                </h2>
                <p className="mt-3 max-w-xl text-proday-muted">
                  Diplôme ou licence obligatoire. Messagerie limitée jusqu&apos;à
                  validation — transparence pour clubs et familles.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        <div className={`flex flex-wrap gap-2 ${showHeader ? "mt-12" : "mt-4"}`}>
          {VERIFICATION_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                step === i
                  ? "bg-proday-ink text-white"
                  : "bg-neutral-100 text-proday-muted hover:bg-neutral-200"
              }`}
            >
              Étape {s.id}
            </button>
          ))}
        </div>

        <ol className="mt-10 flex flex-col gap-0 sm:flex-row sm:gap-0">
          {VERIFICATION_STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.id} className="relative flex-1">
                <motion.div
                  animate={{
                    scale: current ? 1.05 : 1,
                    opacity: i <= step ? 1 : 0.45,
                  }}
                  className={`mx-2 rounded-2xl border p-5 ${
                    current
                      ? "border-proday-warning bg-orange-50"
                      : done
                        ? "border-proday-success/30 bg-green-50"
                        : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                    {done ? (
                      <Check className="text-proday-success" size={20} />
                    ) : current ? (
                      <Clock className="text-proday-warning" size={20} />
                    ) : (
                      <span className="text-sm text-neutral-400">{s.id}</span>
                    )}
                  </div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="mt-1 text-xs text-proday-muted">
                    {done
                      ? "Validé"
                      : current
                        ? "En cours…"
                        : "À venir"}
                  </p>
                </motion.div>
                {i < VERIFICATION_STEPS.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-0.5 w-4 translate-x-full bg-neutral-200 sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

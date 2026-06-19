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
            ? "bg-[#030303] py-12"
            : "border-t border-white/10 bg-[#030303] py-24"
      }
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {showHeader && (
          <Reveal>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/10">
                <Shield size={28} />
              </div>
              <div>
                <p className="text-sm font-medium tracking-widest text-white/40">
                  CONFIANCE
                </p>
                <h2 className="font-display mt-1 text-3xl font-bold text-white sm:text-4xl">
                  Vérification coach & agent
                </h2>
                <p className="mt-3 max-w-xl text-white/55">
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
                  ? "bg-white text-neutral-950"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
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
                      ? "border-amber-500/40 bg-amber-500/10"
                      : done
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "card-premium border-white/10"
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    {done ? (
                      <Check className="text-emerald-400" size={20} />
                    ) : current ? (
                      <Clock className="text-amber-400" size={20} />
                    ) : (
                      <span className="text-sm text-white/40">{s.id}</span>
                    )}
                  </div>
                  <p className="font-semibold text-white">{s.label}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {done
                      ? "Validé"
                      : current
                        ? "En cours…"
                        : "À venir"}
                  </p>
                </motion.div>
                {i < VERIFICATION_STEPS.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-0.5 w-4 translate-x-full bg-white/15 sm:block" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

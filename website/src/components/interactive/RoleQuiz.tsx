"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { QUIZ_QUESTIONS, QUIZ_RESULTS } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function RoleQuiz({ compact, inline }: { compact?: boolean; inline?: boolean }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[step];

  function pick(role: string) {
    const next = { ...scores, [role]: (scores[role] ?? 0) + 1 };
    setScores(next);
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      setScores(next);
    }
  }

  function reset() {
    setStep(0);
    setScores({});
    setDone(false);
  }

  const resultRole = done
    ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "homme"
    : null;
  const result = resultRole ? QUIZ_RESULTS[resultRole] : null;

  if (compact && !done) {
    return (
      <div className="card-premium rounded-2xl p-6">
        <p className="font-bold text-white">Quel pôle ProDay vous correspond ?</p>
        <p className="mt-2 text-sm text-white/55">3 questions — Joueur, Pro, Santé ou Partenaires</p>
        <Link
          href={ROUTES.quiz}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--proday-accent)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#2a6fff]"
        >
          Lancer le quiz
        </Link>
      </div>
    );
  }

  const cardClass = inline
    ? "card-premium rounded-2xl p-5 sm:p-6"
    : "card-premium rounded-3xl p-8";
  const resultClass = inline
    ? "rounded-2xl border border-[var(--proday-accent)]/20 bg-gradient-to-br from-black via-[#0a1520] to-black p-6 text-white ring-1 ring-white/10"
    : "rounded-3xl border border-[var(--proday-accent)]/20 bg-gradient-to-br from-black via-[#0a1520] to-black p-8 text-white ring-1 ring-white/10";

  return (
    <div className={inline ? "mx-auto max-w-lg" : "mx-auto max-w-xl"}>
      <AnimatePresence mode="wait">
        {!done && q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className={cardClass}
          >
            <p className="text-xs text-white/45">
              Question {step + 1} / {QUIZ_QUESTIONS.length}
            </p>
            <h3 className={`mt-2 font-bold text-white ${inline ? "text-lg" : "text-xl"}`}>
              {q.question}
            </h3>
            <div className={`${inline ? "mt-4 space-y-2" : "mt-6 space-y-3"}`}>
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pick(opt.role)}
                  className={`block w-full min-h-11 rounded-xl border border-white/10 bg-white/5 text-left text-white/85 transition hover:border-[var(--proday-accent)]/40 hover:bg-[var(--proday-accent-muted)] ${
                    inline ? "px-4 py-3 text-sm" : "p-4"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {done && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={resultClass}
          >
            <p className="text-xs text-white/60">Votre profil</p>
            <h3 className={`mt-2 font-bold ${inline ? "text-xl" : "text-2xl"}`}>{result.title}</h3>
            <p className="mt-3 text-sm text-white/80">{result.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={result.href}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--proday-accent)] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#2a6fff]"
              >
                {result.cta}
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/30 px-6 py-2.5 text-sm"
              >
                Recommencer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

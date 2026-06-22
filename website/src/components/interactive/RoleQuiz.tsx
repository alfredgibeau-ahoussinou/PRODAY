"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { QUIZ_QUESTIONS, QUIZ_RESULTS } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function RoleQuiz({ compact }: { compact?: boolean }) {
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
          className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-950"
        >
          Lancer le quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <AnimatePresence mode="wait">
        {!done && q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="card-premium rounded-3xl p-8"
          >
            <p className="text-xs text-white/45">
              Question {step + 1} / {QUIZ_QUESTIONS.length}
            </p>
            <h3 className="mt-2 text-xl font-bold text-white">{q.question}</h3>
            <div className="mt-6 space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pick(opt.role)}
                  className="block w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left text-white/85 transition hover:border-white/25 hover:bg-white/10"
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
            className="rounded-3xl bg-gradient-to-br from-blue-950 to-neutral-950 p-8 text-white ring-1 ring-white/10"
          >
            <p className="text-xs text-white/60">Votre profil</p>
            <h3 className="mt-2 text-2xl font-bold">{result.title}</h3>
            <p className="mt-4 text-white/80">{result.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={result.href}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200"
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

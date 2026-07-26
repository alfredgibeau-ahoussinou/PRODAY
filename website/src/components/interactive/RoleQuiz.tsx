"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QUIZ_QUESTIONS, QUIZ_RESULTS } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function RoleQuiz({ compact, inline }: { compact?: boolean; inline?: boolean }) {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  const q = QUIZ_QUESTIONS[step];

  function pick(role: string, label: string) {
    setSelectedOption(label);
    const next = { ...scores, [role]: (scores[role] ?? 0) + 1 };
    setScores(next);
    
    setTimeout(() => {
      if (step < QUIZ_QUESTIONS.length - 1) {
        setStep(step + 1);
        setSelectedOption(null);
      } else {
        setDone(true);
        setScores(next);
      }
    }, 300);
  }

  function reset() {
    setStep(0);
    setScores({});
    setDone(false);
    setSelectedOption(null);
  }

  const resultRole = done
    ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "homme"
    : null;
  const result = resultRole ? QUIZ_RESULTS[resultRole] : null;

  if (compact && !done) {
    return (
      <div className="card-premium rounded-2xl p-6">
        <p className="font-bold text-white">Quel pôle ProDay vous correspond ?</p>
        <p className="mt-2 text-sm text-white/55">5 questions. Joueur, Pro, Santé ou Partenaires</p>
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
    ? "rounded-2xl border border-white/15 bg-gradient-to-br from-[#0f0f15] to-[#0a0a10] p-5 sm:p-6 shadow-2xl"
    : "rounded-3xl border border-white/15 bg-gradient-to-br from-[#0f0f15] to-[#0a0a10] p-8 shadow-2xl";
  const resultClass = inline
    ? "rounded-2xl border border-[var(--proday-accent)]/30 bg-gradient-to-br from-[#0f0f15] via-[#1a1a25] to-[#0a0a10] p-6 text-white shadow-2xl ring-1 ring-[var(--proday-accent)]/20"
    : "rounded-3xl border border-[var(--proday-accent)]/30 bg-gradient-to-br from-[#0f0f15] via-[#1a1a25] to-[#0a0a10] p-8 text-white shadow-2xl ring-1 ring-[var(--proday-accent)]/20";

  return (
    <div className={inline ? "mx-auto max-w-lg" : "mx-auto max-w-xl"}>
      <AnimatePresence mode="wait">
        {!done && q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cardClass}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between gap-4">
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--proday-accent)]"
                >
                  Question {step + 1} / {QUIZ_QUESTIONS.length}
                </motion.p>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                  className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden"
                >
                  <motion.div 
                    className="h-full bg-[var(--proday-accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
              </div>
            </div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`font-bold text-white ${inline ? "text-lg" : "text-xl"}`}
            >
              {q.question}
            </motion.h3>
            
            <div className={`${inline ? "mt-4 space-y-2" : "mt-6 space-y-3"}`}>
              {q.options.map((opt, index) => (
                <motion.button
                  key={opt.label}
                  type="button"
                  onClick={() => pick(opt.role, opt.label)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative block w-full min-h-11 overflow-hidden rounded-xl border text-left transition-all duration-300 ${
                    selectedOption === opt.label
                      ? "border-[var(--proday-accent)] bg-gradient-to-r from-[var(--proday-accent)]/20 to-[var(--proday-accent)]/5"
                      : "border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] hover:border-[var(--proday-accent)]/50 hover:from-white/[0.06] hover:to-white/[0.02]"
                  } ${inline ? "px-4 py-3 text-sm" : "p-4"}`}
                >
                  <motion.span
                    className={`relative z-10 ${selectedOption === opt.label ? "text-white" : "text-white/85"}`}
                  >
                    {opt.label}
                  </motion.span>
                  {selectedOption === opt.label && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-[var(--proday-accent)]/10"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        {done && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={resultClass}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--proday-accent)]/20"
            >
              <span className="text-3xl">✨</span>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--proday-accent)]"
            >
              Votre profil
            </motion.p>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`mt-2 font-bold ${inline ? "text-xl" : "text-2xl"}`}
            >
              {result.title}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 text-sm text-white/80"
            >
              {result.description}
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-4 text-sm italic text-white/60 leading-relaxed"
            >
              "{result.thought}"
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-5 flex flex-wrap gap-3"
            >
              <Link
                href={result.href}
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--proday-accent)] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#2a6fff] hover:scale-105"
              >
                {result.cta}
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-white/30 px-6 py-2.5 text-sm transition hover:border-white/50 hover:bg-white/5"
              >
                Recommencer
              </button>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 text-xs text-white/40"
            >
              Cliquez sur le bouton ci-dessous pour découvrir votre univers.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

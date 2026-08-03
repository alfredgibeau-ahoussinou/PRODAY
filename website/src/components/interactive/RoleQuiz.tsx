"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const ROLE_CHOICES = [
  { label: "Joueur", href: ROUTES.joueur },
  { label: "Supporter", href: ROUTES.supporter },
  { label: "Club", href: ROUTES.proClub },
  { label: "Coach", href: ROUTES.proStaff },
  { label: "Recruteur / Agent", href: ROUTES.proStaff },
  { label: "Praticien de santé", href: ROUTES.sante },
  { label: "Sponsor", href: ROUTES.sponsor },
  { label: "Organisateur", href: ROUTES.evenements },
] as const;

export function RoleQuiz({ compact, inline }: { compact?: boolean; inline?: boolean }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  function pick(label: string, href: string) {
    setSelectedOption(label);
    setTimeout(() => {
      router.push(href);
    }, 280);
  }

  if (compact) {
    return (
      <div className="card-premium rounded-2xl p-6">
        <p className="font-bold text-white">Vous êtes ?</p>
        <p className="mt-2 text-sm text-white/55">Choisissez votre rôle pour découvrir le bon pôle.</p>
        <Link
          href={ROUTES.quiz}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--proday-accent)] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#2a6fff]"
        >
          Choisir mon rôle
        </Link>
      </div>
    );
  }

  const cardClass = inline
    ? "rounded-2xl border border-white/15 bg-gradient-to-br from-[#0f0f15] to-[#0a0a10] p-5 sm:p-6 shadow-2xl"
    : "rounded-3xl border border-white/15 bg-gradient-to-br from-[#0f0f15] to-[#0a0a10] p-8 shadow-2xl";

  return (
    <div className={inline ? "mx-auto max-w-lg" : "mx-auto max-w-xl"}>
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cardClass}
      >
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`font-bold text-white ${inline ? "text-lg" : "text-xl"}`}
        >
          Vous êtes ?
        </motion.h3>

        <div className={`${inline ? "mt-4 space-y-2" : "mt-6 space-y-3"}`}>
          {ROLE_CHOICES.map((opt, index) => (
            <motion.button
              key={opt.label}
              type="button"
              onClick={() => pick(opt.label, opt.href)}
              aria-label={`Choisir : ${opt.label}`}
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
    </div>
  );
}

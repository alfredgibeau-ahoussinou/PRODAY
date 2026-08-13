"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/routes";

const ROLE_CHOICES = [
  { label: "Joueur", emoji: "⚽", href: ROUTES.joueur },
  { label: "Coach", emoji: "📋", href: ROUTES.proStaff },
  { label: "Club", emoji: "🏟️", href: ROUTES.proClub },
  { label: "Supporter", emoji: "📣", href: ROUTES.supporter },
  { label: "Parent", emoji: "👨‍👧", href: ROUTES.parent },
  { label: "Organisateur", emoji: "🏆", href: ROUTES.proClub },
] as const;

export function RoleQuiz({ compact, inline }: { compact?: boolean; inline?: boolean }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const router = useRouter();

  function pick(label: string, href: string) {
    setSelectedOption(label);
    setTimeout(() => {
      router.push(href);
    }, 260);
  }

  if (compact) {
    return (
      <div className="card-premium rounded-2xl p-6">
        <p className="font-bold text-white">T&apos;es qui ?</p>
        <p className="mt-2 text-sm text-white/55">Choisis ton rôle, on t&apos;emmène.</p>
        <Link
          href={ROUTES.quiz}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#22D3EE] px-5 py-2 text-sm font-bold text-black transition hover:bg-[#67e8f9]"
        >
          Choisir mon rôle
        </Link>
      </div>
    );
  }

  if (inline) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ROLE_CHOICES.map((opt, index) => {
            const on = selectedOption === opt.label;
            return (
              <motion.button
                key={opt.label}
                type="button"
                onClick={() => pick(opt.label, opt.href)}
                aria-label={`Choisir : ${opt.label}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.04 }}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.96 }}
                className={`chip-pop rounded-2xl border px-3 py-4 text-center transition ${
                  on
                    ? "border-transparent bg-[#00A8C4] text-white shadow-[0_12px_28px_-12px_rgba(0,168,196,0.55)]"
                    : "border-[#0f1f17]/12 bg-[#eef6f1] text-[#0f1f17] hover:border-[#FF5A1F]/45 hover:bg-white"
                }`}
              >
                <span className="block text-2xl" aria-hidden>
                  {opt.emoji}
                </span>
                <span className="mt-2 block text-xs font-extrabold sm:text-sm">{opt.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/12 bg-[#181410] p-8 shadow-2xl"
      >
        <h3 className="font-display text-xl font-extrabold text-white">T&apos;es qui ?</h3>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {ROLE_CHOICES.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => pick(opt.label, opt.href)}
              className={`chip-pop rounded-2xl border px-3 py-4 text-center ${
                selectedOption === opt.label
                  ? "border-transparent bg-[#22D3EE] text-black"
                  : "border-white/12 bg-white/[0.04] text-white"
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="mt-2 block text-sm font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

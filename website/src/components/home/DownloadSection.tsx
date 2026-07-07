"use client";

import { motion } from "framer-motion";
import { Apple, Play, Smartphone } from "lucide-react";
import { BETA_PITCH } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import { PremiumButton } from "@/components/ui/PremiumButton";

export function DownloadSection() {
  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          className="card-flash relative overflow-hidden rounded-3xl p-8 sm:grid sm:grid-cols-2 sm:gap-8 sm:p-12"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--proday-accent)]/10 blur-3xl" />
          <div>
            <Smartphone className="text-[var(--proday-accent)]" size={32} />
            <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-wide text-[var(--proday-accent)] sm:text-3xl">
              Bientôt sur iOS & Android
            </h2>
            <p className="mt-3 leading-relaxed text-white/55">{BETA_PITCH.summary}</p>
            <p className="mt-2 text-sm text-white/35">{BETA_PITCH.dailyUpdates}</p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-0">
            <button
              type="button"
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 opacity-60"
              disabled
            >
              <Apple size={22} className="text-white" />
              <span className="text-left text-sm text-white">
                <span className="block text-xs text-white/40">Bientôt</span>
                App Store
              </span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 opacity-60"
              disabled
            >
              <Play size={22} className="text-white" />
              <span className="text-left text-sm text-white">
                <span className="block text-xs text-white/40">Bientôt</span>
                Google Play
              </span>
            </button>
            <PremiumButton href={ROUTES.betaWaitlist} className="w-full text-center">
              Accès anticipé
            </PremiumButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

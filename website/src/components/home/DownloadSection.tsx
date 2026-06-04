"use client";

import { motion } from "framer-motion";
import { Apple, Play, Smartphone } from "lucide-react";
import Link from "next/link";
import { BETA_PITCH } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function DownloadSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          className="grid gap-8 rounded-3xl border border-neutral-200 bg-white p-8 sm:grid-cols-2 sm:p-12"
        >
          <div>
            <Smartphone className="text-proday-muted" size={32} />
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Bientôt sur iOS & Android
            </h2>
            <p className="mt-3 text-proday-muted leading-relaxed">
              Prochainement disponible sur iOS et Android. {BETA_PITCH.summary}
            </p>
            <p className="mt-2 text-sm text-proday-muted">{BETA_PITCH.dailyUpdates}</p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <button
              type="button"
              className="flex items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 py-4 opacity-70"
              disabled
            >
              <Apple size={22} />
              <span className="text-left text-sm">
                <span className="block text-xs text-proday-muted">Bientôt</span>
                App Store
              </span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 py-4 opacity-70"
              disabled
            >
              <Play size={22} />
              <span className="text-left text-sm">
                <span className="block text-xs text-proday-muted">Bientôt</span>
                Google Play
              </span>
            </button>
            <Link
              href={ROUTES.beta}
              className="rounded-2xl bg-proday-ink py-4 text-center text-sm font-semibold text-white"
            >
              Accès beta maintenant
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

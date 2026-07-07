"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { PRODUCT_VISION } from "@/lib/content";
import { DemoDisclaimer } from "@/components/demo/DemoDisclaimer";

export function VisionTodayTomorrow() {
  const { today, tomorrow, intro, disclaimer } = PRODUCT_VISION;

  return (
    <section className="bg-[#030303] py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-white/60">
          {intro}
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-white/40">
          {disclaimer}
        </p>

        <div className="mt-10">
          <DemoDisclaimer />
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-premium rounded-2xl p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--proday-accent-muted)] text-[var(--proday-accent)]">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{today.title}</h2>
                <p className="text-sm text-white/50">{today.lead}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {today.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-white/70"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--proday-accent)]/80" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="card-premium rounded-2xl border border-violet-500/20 p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <Sparkles size={20} />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">{tomorrow.title}</h2>
                <p className="text-sm text-white/50">{tomorrow.lead}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {tomorrow.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-white/60"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400/70" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

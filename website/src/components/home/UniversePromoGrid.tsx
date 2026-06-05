"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCT_LINES } from "@/lib/content";

const ACCENT_STYLES = {
  homme: {
    gradient: "from-neutral-900 via-neutral-800 to-neutral-950",
    tag: "text-neutral-300",
    body: "text-neutral-200",
    btn: "bg-white text-neutral-900 hover:bg-neutral-100",
  },
  woman: {
    gradient: "from-pink-700 via-rose-800 to-pink-950",
    tag: "text-pink-200",
    body: "text-pink-100",
    btn: "bg-white text-pink-900 hover:bg-pink-50",
  },
  pro: {
    gradient: "from-blue-900 via-blue-800 to-slate-950",
    tag: "text-blue-200",
    body: "text-blue-100",
    btn: "bg-white text-blue-900 hover:bg-blue-50",
  },
} as const;

export function UniversePromoGrid() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Trois univers, une app</h2>
          <p className="mx-auto mt-2 max-w-xl text-proday-muted">
            Man, Woman ou Pro — choisissez votre écosystème au lancement de l&apos;app.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {PRODUCT_LINES.map((line, i) => {
            const styles = ACCENT_STYLES[line.id];
            return (
              <motion.div
                key={line.id}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 24 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${styles.gradient} p-8`}
              >
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <p className={`text-xs font-semibold tracking-widest ${styles.tag}`}>
                    {line.brand.tagline}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                    {line.brand.fullName}
                  </h3>
                  <p className={`mt-3 text-sm ${styles.body}`}>{line.brand.mission}</p>
                  <Link
                    href={line.href}
                    className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${styles.btn}`}
                  >
                    {line.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="relative mt-6 h-36 overflow-hidden rounded-2xl">
                  <Image src={line.image} alt="" fill className="object-cover opacity-90" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

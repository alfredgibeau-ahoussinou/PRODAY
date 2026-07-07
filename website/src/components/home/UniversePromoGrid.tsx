"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCT_LINES } from "@/lib/content";
import { Section } from "@/components/ui/Section";

const ACCENT_STYLES: Record<
  (typeof PRODUCT_LINES)[number]["id"],
  {
    gradient: string;
    tag: string;
    body: string;
    btn: string;
    glow: string;
  }
> = {
  homme: {
    gradient: "from-neutral-900 via-neutral-800 to-neutral-950",
    tag: "text-neutral-400",
    body: "text-neutral-300",
    btn: "bg-white text-neutral-900 hover:bg-neutral-100",
    glow: "from-emerald-500/20",
  },
  woman: {
    gradient: "from-pink-800 via-rose-900 to-pink-950",
    tag: "text-pink-300",
    body: "text-pink-100",
    btn: "bg-white text-pink-900 hover:bg-pink-50",
    glow: "from-pink-500/25",
  },
  amateur: {
    gradient: "from-orange-950 via-orange-900 to-neutral-950",
    tag: "text-orange-300",
    body: "text-orange-100",
    btn: "bg-orange-500 text-white hover:bg-orange-400",
    glow: "from-orange-500/25",
  },
  supporter: {
    gradient: "from-violet-950 via-violet-900 to-neutral-950",
    tag: "text-violet-300",
    body: "text-violet-100",
    btn: "bg-violet-600 text-white hover:bg-violet-500",
    glow: "from-violet-500/25",
  },
  pro: {
    gradient: "from-blue-950 via-blue-900 to-slate-950",
    tag: "text-blue-300",
    body: "text-blue-100",
    btn: "bg-white text-blue-900 hover:bg-blue-50",
    glow: "from-blue-500/25",
  },
};

export function UniversePromoGrid() {
  return (
    <Section
      kicker="UNIVERS"
      title="Cinq lignes, une app"
      description="Man, Woman, Amateur, Supporter ou Pro — choisissez votre écosystème à l'inscription."
      className="bg-[#030303]"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_LINES.map((line, i) => {
          const styles = ACCENT_STYLES[line.id];
          return (
            <motion.div
              key={line.id}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 24 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${styles.gradient} p-8 ring-1 ring-white/10`}
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br ${styles.glow} to-transparent blur-2xl`}
              />
              <div className="relative flex items-start gap-4">
                <Image
                  src={line.logo}
                  alt={line.brand.fullName}
                  width={56}
                  height={56}
                  className="shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                />
                <div>
                  <p className={`text-xs font-semibold tracking-widest ${styles.tag}`}>
                    {line.brand.tagline}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-bold text-white sm:text-2xl">
                    {line.brand.fullName}
                  </h3>
                </div>
              </div>
              <p className={`relative mt-4 text-sm leading-relaxed ${styles.body}`}>
                {line.brand.mission}
              </p>
              <Link
                href={line.href}
                className={`relative mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.02] ${styles.btn}`}
              >
                {line.cta}
                <ArrowRight size={16} />
              </Link>
              <div className="relative mt-6 h-36 overflow-hidden rounded-2xl ring-1 ring-white/10">
                <Image src={line.image} alt="" fill className="object-cover opacity-90" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

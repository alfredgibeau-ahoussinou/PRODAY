"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { CAROUSEL_POLES, SPONSOR_POLE } from "@/lib/poles";

const UNIVERSES = [...CAROUSEL_POLES, SPONSOR_POLE].map((p, i) => ({
  n: String(i + 1).padStart(2, "0"),
  title: p.kicker.replace(/^PÔLE\s+/i, ""),
  subtitle: p.subtitle,
  href: p.href,
}));

/**
 * Scroll narrative:
 * 1) Pin the question : “Quel univers t’intéresse ?”
 * 2) Reveal each ProDay universe as you keep scrolling
 */
export function UniverseScroll() {
  const questionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: qProgress } = useScroll({
    target: questionRef,
    offset: ["start end", "end start"],
  });

  const qOpacity = useTransform(qProgress, [0.2, 0.4, 0.7, 0.85], [0, 1, 1, 0.15]);
  const qY = useTransform(qProgress, [0.2, 0.4], [28, 0]);

  return (
    <>
      {/* Question : pinned, breathing room */}
      <section
        ref={questionRef}
        id="univers"
        className="relative h-[160vh] bg-[#f3f2ec]"
      >
        <div className="sticky top-0 flex min-h-[100dvh] items-center">
          <motion.div
            style={{ opacity: qOpacity, y: qY }}
            className="mx-auto w-full max-w-4xl px-5 sm:px-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#052424]/40">
              Même écosystème
            </p>
            <h2 className="mt-6 font-display text-[clamp(2.1rem,6vw,4rem)] font-medium leading-[1.05] tracking-[-0.04em] text-[#052424]">
              Des portes d&apos;entrée.
              <br />
              Un seul football.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#052424]/55">
              Joueur, Club, Coach, Parent, Supporter, Sponsor : ce ne sont pas
              des produits séparés. Chaque univers ouvre le même graphe — objets
              métier reliés, même donnée.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Universes list */}
      <section
        ref={listRef}
        className="border-t border-[#052424]/10 bg-[#f3f2ec] pb-28 pt-4 text-[#052424]"
      >
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#052424]/40">
            Choisis ta porte
          </p>
          <ul className="mt-10 divide-y divide-[#052424]/12 border-y border-[#052424]/12">
            {UNIVERSES.map((u) => (
              <UniverseRow key={u.href} universe={u} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function UniverseRow({
  universe,
}: {
  universe: (typeof UNIVERSES)[number];
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.55, 1], [0.2, 1, 1]);
  const x = useTransform(scrollYProgress, [0, 0.55], [24, 0]);

  return (
    <motion.li ref={ref} style={{ opacity, x }}>
      <Link
        href={universe.href}
        className="group flex items-baseline gap-5 py-8 transition sm:gap-8"
      >
        <span className="w-8 shrink-0 font-mono text-[11px] text-[#052424]/35">
          {universe.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl font-medium tracking-[-0.03em] transition group-hover:text-black sm:text-3xl">
            {universe.title}
          </span>
          <span className="mt-1 block text-sm text-[#052424]/50 sm:text-[15px]">
            {universe.subtitle}
          </span>
        </span>
        <span className="shrink-0 font-mono text-sm text-[#052424]/30 transition group-hover:text-[#052424]">
          →
        </span>
      </Link>
    </motion.li>
  );
}

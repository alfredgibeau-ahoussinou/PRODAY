"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

const FootballImpactCanvas = dynamic(
  () => import("./FootballImpactCanvas").then((m) => m.FootballImpactCanvas),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#07100c]" />,
  },
);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Short cinematic intro : ball lands, then brand mission. */
export function ScrollVideoStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    mass: 0.5,
  });

  const hintOpacity = useTransform(progress, [0, 0.12, 0.22], [1, 0.7, 0]);
  const brandOpacity = useTransform(progress, [0, 0.15, 0.28], [1, 1, 0]);
  const copyOpacity = useTransform(
    progress,
    reduced ? [0, 0.01] : [0.05, 0.18, 0.55, 0.72],
    reduced ? [1, 1] : [0, 1, 1, 0],
  );
  const copyY = useTransform(progress, [0.05, 0.2], [16, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-[240vh] bg-[#07100c]"
      aria-label="ProDay, introduction"
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#07100c]">
        {!reduced ? (
          <div className="absolute inset-0 z-0">
            <FootballImpactCanvas progress={progress} />
          </div>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: "url(/images/football-pitch-01.jpg)" }}
            aria-hidden
          />
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[55%] bg-gradient-to-t from-[#07100c] via-[#07100c]/85 to-transparent"
          aria-hidden
        />

        <motion.p
          style={{ opacity: brandOpacity }}
          className="absolute left-5 top-28 z-20 font-mono text-[10px] uppercase tracking-[0.28em] text-[#5B75FF] sm:left-8 lg:left-12"
        >
          ProDay
        </motion.p>

        {/* One stacked block: headline → support → CTAs (no absolute overlap). */}
        <motion.div
          style={{
            opacity: reduced ? 1 : copyOpacity,
            y: reduced ? 0 : copyY,
          }}
          className="absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end px-5 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] pt-8 sm:px-8 sm:pb-24 lg:px-12"
        >
          <div className="mx-auto w-full max-w-xl">
            <h1 className="whitespace-pre-line font-display text-[clamp(1.55rem,6.2vw,3.1rem)] font-medium leading-[1.12] tracking-[-0.04em] text-white">
              {"Le football amateur,\nenfin réuni au même endroit."}
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65 sm:mt-4 sm:text-[15px]">
              {BRAND.heroSupport}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5">
              <Link
                href={ROUTES.proClub}
                className="inline-flex flex-col items-start rounded-full bg-[#1E3AFF] px-5 py-2.5 text-white transition hover:bg-[#3B56FF]"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                  Créer mon club
                </span>
                <span className="mt-0.5 text-[9px] font-medium normal-case tracking-normal text-white/80">
                  Dès 3 € / adhérent
                </span>
              </Link>
              <Link
                href={ROUTES.joueur}
                className="inline-flex items-center rounded-full border border-white/35 bg-white/5 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition hover:border-white/60"
              >
                Je suis joueur
              </Link>
              <Link
                href={`${ROUTES.coach}#analyse-de-forme`}
                className="inline-flex items-center rounded-full border border-white/35 bg-white/5 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition hover:border-white/60"
              >
                Je suis coach
              </Link>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/45 sm:mt-4 sm:text-[10px]">
              Sans engagement ·{" "}
              <Link
                href={ROUTES.sponsor}
                className="pointer-events-auto text-white/70 underline-offset-2 transition hover:text-white hover:underline"
              >
                Sponsoring possible
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.p
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/35 sm:bottom-5"
        >
          Scroll
        </motion.p>
      </div>
    </section>
  );
}

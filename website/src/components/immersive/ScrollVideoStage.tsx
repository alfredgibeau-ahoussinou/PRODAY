"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

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

function Beat({
  progress,
  range,
  line,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number];
  line: string;
}) {
  const [a, b] = range;
  const opacity = useTransform(
    progress,
    [a, a + 0.08, b - 0.1, b],
    a === 0 ? [1, 1, 1, 0] : [0, 1, 1, 0],
  );
  const y = useTransform(progress, [a, a + 0.1, b], [12, 0, -8]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-x-0 bottom-[18%] z-20 px-5 sm:px-8 lg:px-12"
    >
      <h1 className="mx-auto max-w-3xl whitespace-pre-line font-display text-[clamp(1.75rem,4.6vw,3.1rem)] font-medium leading-[1.08] tracking-[-0.04em] text-white">
        {line}
      </h1>
    </motion.div>
  );
}

/** Short cinematic intro — ball lands, then we ask which universe. */
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
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[40%] bg-gradient-to-t from-[#07100c] via-[#07100c]/75 to-transparent"
          aria-hidden
        />

        <motion.p
          style={{ opacity: brandOpacity }}
          className="absolute left-5 top-28 z-20 font-mono text-[10px] uppercase tracking-[0.28em] text-[#4C8BFF] sm:left-8 lg:left-12"
        >
          ProDay
        </motion.p>

        {!reduced && (
          <Beat
            progress={progress}
            range={[0, 0.72]}
            line={"Le foot dans\nune app simple."}
          />
        )}

        {reduced && (
          <div className="absolute inset-x-0 bottom-[22%] z-20 px-5 sm:px-8">
            <h1 className="mx-auto max-w-3xl whitespace-pre-line font-display text-[clamp(1.75rem,4.6vw,3.1rem)] font-medium leading-[1.08] tracking-[-0.04em] text-white">
              {"Le foot dans\nune app simple."}
            </h1>
          </div>
        )}

        <motion.p
          style={{ opacity: hintOpacity }}
          className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/35"
        >
          Scroll
        </motion.p>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { clsx } from "clsx";

type CinematicBleedProps = {
  src: string;
  className?: string;
  /** 0 : 1 opacity of the photo */
  opacity?: number;
  priority?: boolean;
  /** Soft vertical vignette toward black */
  vignette?: boolean;
};

/**
 * Full-bleed cinematic photo plane.
 * Subtle parallax only : no cards, badges, or float loops.
 */
export function CinematicBleed({
  src,
  className,
  opacity = 0.42,
  priority = false,
  vignette = true,
}: CinematicBleedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [-48, 48],
  );

  return (
    <div ref={ref} className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="100vw"
          className="object-cover object-center"
          style={{ opacity }}
        />
      </motion.div>
      {vignette ? (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,#000_100%)]" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
      )}
    </div>
  );
}

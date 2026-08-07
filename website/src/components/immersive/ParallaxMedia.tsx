"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { clsx } from "clsx";

type ParallaxMediaProps = {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  intensity?: number;
  overlay?: boolean;
};

/** Lazy parallax image plane — CSS transform only. */
export function ParallaxMedia({
  src,
  alt = "",
  className,
  imgClassName,
  priority = false,
  intensity = 40,
  overlay = true,
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [intensity, -intensity],
  );

  const isSvg = src.endsWith(".svg");

  return (
    <div ref={ref} className={clsx("relative overflow-hidden", className)}>
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes="(max-width: 768px) 100vw, 80vw"
          className={clsx(
            "object-cover",
            isSvg && "object-contain p-6 sm:p-10",
            imgClassName,
          )}
        />
      </motion.div>
      {overlay ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type VeoCameraMarkProps = {
  className?: string;
  size?: "sm" | "md";
  caption?: boolean;
};

/**
 * Real Veo camera mark (lime dome on mast) — matches product hardware.
 */
export function VeoCameraMark({
  className = "",
  size = "sm",
  caption = true,
}: VeoCameraMarkProps) {
  const reduce = useReducedMotion();
  const dim =
    size === "sm"
      ? "h-[88px] w-[88px] sm:h-24 sm:w-24"
      : "h-32 w-32 sm:h-40 sm:w-40";

  return (
    <div
      className={`inline-flex flex-col items-center gap-2 ${className}`}
      title="Veo — caméra automatique de terrain"
    >
      <motion.div
        className={`relative overflow-hidden rounded-2xl border border-[#c8f000]/35 bg-[#0a1620] shadow-[0_12px_40px_-12px_rgba(200,240,0,0.45)] ${dim}`}
        animate={
          reduce
            ? undefined
            : {
                y: [0, -5, 0],
                rotateZ: [-1.5, 1.5, -1.5],
              }
        }
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ perspective: 600 }}
        aria-hidden
      >
        <Image
          src="/images/veo-camera.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="160px"
          priority={size === "md"}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
      </motion.div>
      {caption ? (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c8f000]">
          Caméra Veo
        </span>
      ) : null}
      <span className="sr-only">Caméra Veo : caméra automatique de terrain</span>
    </div>
  );
}

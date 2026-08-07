"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

type AnimatedMetricProps = {
  value: string;
  className?: string;
};

function parseMetric(raw: string): { num: number; prefix: string; suffix: string } | null {
  const m = raw.trim().match(/^([^0-9−-]*)([−-]?[\d.,]+)(.*)$/);
  if (!m) return null;
  const num = Number(m[2].replace(",", ".").replace("−", "-"));
  if (Number.isNaN(num)) return null;
  return { num, prefix: m[1] ?? "", suffix: m[3] ?? "" };
}

/** Count-up for numeric metrics; falls back to fade-in for symbols. */
export function AnimatedMetric({ value, className }: AnimatedMetricProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const parsed = parseMetric(value);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 22 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!parsed || reduce) return;
    const unsub = spring.on("change", (v) => {
      const rounded = Number.isInteger(parsed.num)
        ? Math.round(v)
        : Math.round(v * 10) / 10;
      setDisplay(`${parsed.prefix}${rounded}${parsed.suffix}`);
    });
    return unsub;
  }, [parsed, reduce, spring]);

  useEffect(() => {
    if (!inView) return;
    if (!parsed || reduce) {
      setDisplay(value);
      return;
    }
    mv.set(0);
    mv.set(parsed.num);
  }, [inView, parsed, reduce, value, mv]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("inline-block tabular-nums", className)}
    >
      {display}
    </motion.span>
  );
}

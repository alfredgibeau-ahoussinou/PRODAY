"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const offset =
    direction === "none"
      ? { x: 0, y: 0 }
      : direction === "left"
        ? { x: -16, y: 0 }
        : direction === "right"
          ? { x: 16, y: 0 }
          : { x: 0, y: 16 };

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -8% 0px", amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

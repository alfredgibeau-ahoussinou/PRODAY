"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const offset =
    direction === "left"
      ? { x: -18, y: 0 }
      : direction === "right"
        ? { x: 18, y: 0 }
        : { x: 0, y: 18 };

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-48px", amount: 0.15 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

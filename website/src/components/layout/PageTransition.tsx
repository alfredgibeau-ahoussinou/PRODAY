"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function PageTransition({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const reduceMotion = useReducedMotion();
  // Premier paint opaque (SSR + soft nav) : évite contenu invisible si le JS est lent / bloqué.
  const [enableEnter, setEnableEnter] = useState(false);
  useEffect(() => {
    setEnableEnter(true);
  }, []);

  const animate = enableEnter && !reduceMotion;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="page-transition-root"
        initial={animate ? { opacity: 0, y: 14 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={animate ? { opacity: 0, y: -10 } : undefined}
        transition={
          animate
            ? { duration: 0.38, ease }
            : { duration: 0 }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

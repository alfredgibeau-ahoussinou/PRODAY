"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

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

  const animateEnter = enableEnter && !reduceMotion;

  return (
    <motion.div
      key={pathname}
      initial={animateEnter ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        animateEnter
          ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}

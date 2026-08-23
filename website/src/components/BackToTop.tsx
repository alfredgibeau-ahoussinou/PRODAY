"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <motion.button
      onClick={scrollToTop}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.3 }}
      className={`bg-accent-gradient fixed bottom-6 right-6 z-40 rounded-full p-3 text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#5B75FF] focus:ring-offset-2 focus:ring-offset-black ${
        isVisible ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-label="Retour en haut de la page"
    >
      <ArrowUp size={20} />
      <motion.div
        className="absolute bottom-0 left-0 h-1 w-full origin-left bg-white/30"
        style={{ scaleX }}
      />
    </motion.button>
  );
}

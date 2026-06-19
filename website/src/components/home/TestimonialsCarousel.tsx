"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";
import { TESTIMONIALS } from "@/lib/content";

export function TestimonialsCarousel() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i];

  return (
    <section className="border-y border-white/8 bg-[#030303] py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Quote className="mx-auto text-blue-500/40" size={40} />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="font-display mt-8 text-xl font-medium leading-relaxed text-white sm:text-2xl"
          >
            « {t.quote} »
          </motion.blockquote>
        </AnimatePresence>
        <p className="mt-6 font-semibold text-white">{t.author}</p>
        <p className="text-sm text-white/45">{t.role}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setI((v) => (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="rounded-full border border-white/15 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1.5">
            {TESTIMONIALS.map((_, j) => (
              <button
                key={j}
                type="button"
                onClick={() => setI(j)}
                className={`h-2 rounded-full transition ${
                  j === i ? "w-6 bg-white" : "w-2 bg-white/25"
                }`}
                aria-label={`Témoignage ${j + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setI((v) => (v + 1) % TESTIMONIALS.length)}
            className="rounded-full border border-white/15 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

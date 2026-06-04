"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";
import { TESTIMONIALS } from "@/lib/content";

export function TestimonialsCarousel() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i];

  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Quote className="mx-auto text-neutral-300" size={40} />
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="mt-6 text-xl font-medium leading-relaxed sm:text-2xl"
          >
            « {t.quote} »
          </motion.blockquote>
        </AnimatePresence>
        <p className="mt-6 font-semibold">{t.author}</p>
        <p className="text-sm text-proday-muted">{t.role}</p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setI((v) => (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="rounded-full border border-neutral-200 p-2 hover:bg-white"
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
                  j === i ? "w-6 bg-proday-ink" : "w-2 bg-neutral-300"
                }`}
                aria-label={`Témoignage ${j + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setI((v) => (v + 1) % TESTIMONIALS.length)}
            className="rounded-full border border-neutral-200 p-2 hover:bg-white"
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

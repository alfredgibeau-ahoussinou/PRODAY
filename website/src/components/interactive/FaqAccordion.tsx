"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/content";

type FaqAccordionProps = { limit?: number };

export function FaqAccordion({ limit }: FaqAccordionProps) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.q}
            layout
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-semibold">{item.q}</span>
              <ChevronDown
                size={20}
                className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="border-t border-neutral-100 px-5 pb-5 pt-3 text-proday-muted leading-relaxed">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

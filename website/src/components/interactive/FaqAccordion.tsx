"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/content";

type FaqAccordionProps = { limit?: number; variant?: "light" | "dark" };

export function FaqAccordion({ limit, variant = "dark" }: FaqAccordionProps) {
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  const [open, setOpen] = useState<number | null>(0);
  const dark = variant === "dark";

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={item.q}
            layout
            className={`overflow-hidden rounded-2xl border ${
              dark
                ? "card-premium border-white/10 bg-transparent"
                : "border-neutral-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className={`font-semibold ${dark ? "text-white" : "text-neutral-900"}`}>{item.q}</span>
              <ChevronDown
                size={20}
                className={`shrink-0 transition ${dark ? "text-white/50" : "text-neutral-500"} ${isOpen ? "rotate-180" : ""}`}
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
                  <p
                    className={`border-t px-5 pb-5 pt-3 leading-relaxed ${
                      dark
                        ? "border-white/10 text-white/55"
                        : "border-neutral-100 text-proday-muted"
                    }`}
                  >
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

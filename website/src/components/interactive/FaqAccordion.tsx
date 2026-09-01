"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  type FaqCategoryId,
} from "@/lib/content";

type FaqAccordionProps = {
  limit?: number;
  variant?: "light" | "dark";
  /** When set, hide category chips and filter to this category. */
  category?: FaqCategoryId | "all";
  showFilters?: boolean;
};

export function FaqAccordion({
  limit,
  variant = "dark",
  category: fixedCategory,
  showFilters = true,
}: FaqAccordionProps) {
  const [filter, setFilter] = useState<FaqCategoryId | "all">(fixedCategory ?? "all");
  const [open, setOpen] = useState<number | null>(0);
  const dark = variant === "dark";
  const reduce = useReducedMotion();

  const activeFilter = fixedCategory ?? filter;

  const items = useMemo(() => {
    const filtered =
      activeFilter === "all"
        ? FAQ_ITEMS
        : FAQ_ITEMS.filter((item) => item.category === activeFilter);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [activeFilter, limit]);

  return (
    <div className="space-y-6">
      {showFilters && !fixedCategory ? (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Catégories FAQ"
        >
          {FAQ_CATEGORIES.map((cat) => {
            const on = cat.id === activeFilter;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setFilter(cat.id);
                  setOpen(0);
                }}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                  on
                    ? dark
                      ? "bg-white text-black"
                      : "bg-neutral-900 text-white"
                    : dark
                      ? "border border-white/15 text-white/65 hover:text-white"
                      : "border border-neutral-200 text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={`${activeFilter}-${item.q}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                className={`overflow-hidden border-b ${
                  dark ? "border-white/10 bg-transparent" : "border-neutral-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span
                    className={`font-semibold ${dark ? "text-white" : "text-neutral-900"}`}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition ${dark ? "text-white/50" : "text-neutral-500"} ${
                      isOpen ? "rotate-180" : ""
                    }`}
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
        </AnimatePresence>
        {items.length === 0 ? (
          <p className={`p-5 text-sm ${dark ? "text-white/50" : "text-neutral-500"}`}>
            Aucune question dans cette catégorie.
          </p>
        ) : null}
      </div>
    </div>
  );
}

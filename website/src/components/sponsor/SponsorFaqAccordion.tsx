"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SPONSOR_FAQ } from "@/lib/sponsorContent";

export function SponsorFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {SPONSOR_FAQ.map((item, i) => {
        const open = openIndex === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-amber-500/15 bg-white/[0.02]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]"
              aria-expanded={open}
            >
              <span className="font-medium text-white/90">{item.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-amber-400/70 transition ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open ? (
              <div className="border-t border-amber-500/10 px-5 pb-4 pt-2">
                <p className="text-sm leading-relaxed text-white/55">{item.a}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

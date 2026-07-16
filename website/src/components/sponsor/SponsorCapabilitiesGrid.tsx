"use client";

import { motion } from "framer-motion";
import { BarChart3, MapPin, Megaphone, ShieldCheck } from "lucide-react";
import { SPONSOR_CAPABILITIES } from "@/lib/sponsorContent";

const ICONS = {
  offers: Megaphone,
  geo: MapPin,
  dashboard: BarChart3,
  branding: ShieldCheck,
} as const;

export function SponsorCapabilitiesGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {SPONSOR_CAPABILITIES.map((cap, i) => {
        const Icon = ICONS[cap.id as keyof typeof ICONS];
        return (
          <motion.article
            key={cap.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group relative overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-white/[0.04] to-transparent p-6 transition hover:border-amber-400/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.06)]"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/5 blur-2xl transition group-hover:bg-amber-400/10" />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/25">
                <Icon size={22} className="text-amber-400" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-400/70">
                {cap.metric}
              </p>
              <h3 className="font-display mt-1 text-lg font-bold text-white">{cap.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{cap.description}</p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { POLE_BRAND_HEX, POLE_IMAGES, SHOWCASE_POLES } from "@/lib/poles";
import { Section } from "@/components/ui/Section";

export function UniversePromoGrid() {
  return (
    <Section
      kicker="PÔLES"
      title="Cinq portes, une app"
      description="Joueur, Club, Coach, Supporter ou Sponsor. Tu choisis ton entrée : le reste du réseau reste accessible."
      className="bg-[#030303]"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE_POLES.map((pole, i) => {
          const hex = POLE_BRAND_HEX[pole.id];
          return (
            <motion.div
              key={pole.id}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 24 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-flash group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
            >
              <div className="relative h-36 overflow-hidden">
                <Image
                  src={POLE_IMAGES[pole.id]}
                  alt=""
                  fill
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t to-transparent"
                  style={{
                    backgroundImage: `linear-gradient(to top, #000 0%, ${hex}40 45%, transparent 100%)`,
                  }}
                />
              </div>
              <div className="p-6">
                <p
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: hex }}
                >
                  {pole.kicker}
                </p>
                <h3 className="mt-2 font-display text-xl font-medium tracking-[-0.02em] text-white">
                  {pole.navLabel}
                </h3>
                <p className="mt-1 text-sm text-white/50">{pole.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-3">
                  {pole.description}
                </p>
                <Link
                  href={pole.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-80"
                  style={{ color: hex }}
                >
                  Explorer
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

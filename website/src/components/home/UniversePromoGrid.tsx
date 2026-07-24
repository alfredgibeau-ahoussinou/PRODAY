"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCT_LINES } from "@/lib/content";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { Section } from "@/components/ui/Section";

export function UniversePromoGrid() {
  return (
    <Section
      kicker="UNIVERS"
      title="Cinq lignes, une app"
      description="Man, Woman, Amateur, Supporter ou Pro. Vous choisissez à l'inscription."
      className="bg-[#030303]"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_LINES.map((line, i) => {
          const theme = UNIVERSE_THEME[line.id];
          return (
            <motion.div
              key={line.id}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 24 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`card-flash group relative overflow-hidden rounded-3xl ${theme.pricingCard}`}
            >
              <div className="relative h-36 overflow-hidden">
                <Image
                  src={line.image}
                  alt=""
                  fill
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${theme.imageGradient}`} />
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Image
                    src={line.logo}
                    alt={line.brand.fullName}
                    width={48}
                    height={48}
                    className={`shrink-0 rounded-xl bg-white/10 ${theme.imageRing}`}
                  />
                  <div>
                    <p className={`text-xs font-semibold tracking-widest ${theme.highlightLabel}`}>
                      {line.brand.tagline}
                    </p>
                    <h3 className="font-display mt-1 text-xl font-bold uppercase text-white sm:text-2xl">
                      {line.brand.fullName}
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  {line.brand.mission}
                </p>
                <Link
                  href={line.href}
                  className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.02] ${theme.ctaBtn}`}
                >
                  {line.cta}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

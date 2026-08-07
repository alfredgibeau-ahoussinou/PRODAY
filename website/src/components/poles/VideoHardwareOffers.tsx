"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import {
  VIDEO_ANALYSIS_LABELS,
  VIDEO_HARDWARE_OPTIONS,
  VIDEO_MODULE_PRINCIPLE,
  VIDEO_OFFERS,
  VIDEO_VENDORS,
} from "@/lib/videoOffers";
import { VeoCameraMark } from "@/components/poles/VeoCameraMark";
import { ROUTES } from "@/lib/routes";

const ease = [0.22, 1, 0.36, 1] as const;
const offer = VIDEO_OFFERS.proday_pro_camera;

/** Module vidéo flexible + offre Pro + Veo — matériel jamais obligatoire. */
export function VideoHardwareOffers() {
  const reduce = useReducedMotion();

  return (
    <section
      id="video"
      className="scroll-mt-24 relative border-t border-white/10 bg-black px-4 py-14 sm:px-6 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#006CFC)]">
          Module vidéo
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,4vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
          Filmez comme vous voulez.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
          {VIDEO_MODULE_PRINCIPLE}
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {VIDEO_VENDORS.map((v) => (
            <span
              key={v.id}
              className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white/70"
            >
              {v.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          Couche d’intégration multi-fabricants — jamais limitée à Veo.
        </p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, ease }}
          className="mt-10 grid gap-8 border border-white/10 bg-white/[0.02] p-4 sm:mt-12 sm:gap-10 sm:p-10 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div>
            <div className="mb-4 flex justify-start">
              <VeoCameraMark size="md" caption />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Option clé en main
            </p>
            <h3 className="mt-2 font-display text-[clamp(1.6rem,4vw,1.875rem)] font-medium tracking-[-0.03em] text-white sm:text-3xl">
              ProDay Pro + <span className="sr-only">Veo</span>
            </h3>
            <p className="mt-2 text-sm text-white/50">{offer.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{offer.audience}</p>

            <div className="mt-8 border border-white/10 bg-black/40 p-5">
              <p className="font-display text-3xl font-medium tabular-nums tracking-[-0.03em] text-white">
                {offer.priceLabel}
                <span className="ml-2 text-sm font-sans font-normal text-white/45">
                  {offer.priceNote}
                </span>
              </p>
              <p className="mt-2 text-xs text-white/40">
                Caméra jamais obligatoire. Prix catalogue surchargeable depuis
                l’administration.
              </p>
            </div>

            <ul className="mt-8 space-y-4">
              {offer.hardwareAcquisition?.map((mode) => {
                const info = VIDEO_HARDWARE_OPTIONS[mode];
                return (
                  <li
                    key={mode}
                    className="border-l-2 border-[var(--pole-accent,#006CFC)]/50 pl-4"
                  >
                    <p className="text-sm font-semibold text-white">{info.title}</p>
                    <p className="mt-1 text-sm text-white/55">{info.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Inclus
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[...offer.includes, ...(offer.hardwareExtras ?? [])].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-white/75"
                  >
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-[var(--pole-accent,#006CFC)]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                Analyse vidéo
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {VIDEO_ANALYSIS_LABELS.map((c) => (
                  <span
                    key={c.id}
                    className="border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/65"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <p className="max-w-lg text-sm text-white/50">
            Un petit club filme au smartphone sous Premium. Un club structuré
            peut louer ou connecter une caméra pro.
          </p>
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pole-accent,#4C8BFF)] transition hover:opacity-80"
          >
            Parler offres Club / vidéo
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

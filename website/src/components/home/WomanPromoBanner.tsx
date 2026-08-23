"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WOMAN_BRAND } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export function WomanPromoBanner() {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          className="card-flash relative overflow-hidden rounded-3xl border-pink-500/25 bg-gradient-to-br from-pink-950/80 via-black to-black p-8 sm:p-12"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-pink-500/10 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Image
                src="/branding/logo-proday-mark-joueur.png"
                alt={WOMAN_BRAND.name}
                width={64}
                height={64}
                className="mb-4 rounded-xl bg-white/10 p-1 ring-1 ring-pink-500/30"
              />
              <p className="text-xs font-semibold tracking-widest text-pink-300">
                {WOMAN_BRAND.tagline}
              </p>
              <h2 className="font-display mt-2 text-2xl font-bold uppercase text-white sm:text-3xl">
                {WOMAN_BRAND.fullName}
              </h2>
              <p className="mt-3 max-w-lg text-white/65">{WOMAN_BRAND.mission}</p>
              <Link
                href={ROUTES.woman}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-pink-400/40 bg-pink-500/15 px-6 py-3 text-sm font-semibold text-pink-100 transition hover:border-pink-400/60 hover:bg-pink-500/25"
              >
                Découvrir l&apos;univers Woman
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative h-40 overflow-hidden rounded-2xl ring-1 ring-pink-500/20 sm:h-48 lg:h-48 lg:w-72">
              <Image
                src="/showcase/woman/woman-discover-hero.jpg"
                alt=""
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

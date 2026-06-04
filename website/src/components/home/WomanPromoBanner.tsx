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
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-700 via-rose-800 to-pink-950 p-8 sm:p-12"
        >
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Image
                src="/branding/logo-woman-picto.png"
                alt={WOMAN_BRAND.name}
                width={64}
                height={64}
                className="mb-4 rounded-xl bg-white/10 p-1"
              />
              <p className="text-xs font-semibold tracking-widest text-pink-200">
                {WOMAN_BRAND.tagline}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                {WOMAN_BRAND.fullName}
              </h2>
              <p className="mt-3 max-w-lg text-pink-100">{WOMAN_BRAND.mission}</p>
              <Link
                href={ROUTES.woman}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-900 transition hover:bg-pink-50"
              >
                Découvrir l&apos;univers Woman
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative hidden h-48 w-72 overflow-hidden rounded-2xl lg:block">
              <Image
                src="/showcase/woman/woman-discover-hero.jpg"
                alt=""
                fill
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

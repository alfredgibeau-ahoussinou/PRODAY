"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/routes";

type PageHeaderProps = {
  kicker: string;
  title: string;
  description: string;
  image?: string;
  dark?: boolean;
  accent?: "default" | "woman";
};

export function PageHeader({
  kicker,
  title,
  description,
  image,
  dark = false,
  accent = "default",
}: PageHeaderProps) {
  const isWoman = accent === "woman";

  return (
    <header
      className={`relative overflow-hidden pt-24 ${
        dark || isWoman
          ? isWoman
            ? "bg-gradient-to-br from-pink-950 via-rose-900 to-neutral-900 text-white"
            : "bg-neutral-900 text-white"
          : "gradient-mesh bg-[var(--proday-bg)]"
      }`}
    >
      {image && (
        <div className="absolute inset-0">
          <Image src={image} alt="" fill className="object-cover opacity-25" priority />
          <div
            className={`absolute inset-0 ${
              isWoman
                ? "bg-gradient-to-r from-pink-950/95 to-rose-900/80"
                : "bg-gradient-to-r from-neutral-900/95 to-neutral-900/70"
            }`}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20">
        <Link
          href={ROUTES.home}
          className={`mb-8 inline-flex items-center gap-2 text-sm transition hover:opacity-80 ${
            dark || isWoman ? "text-white/70" : "text-proday-muted"
          }`}
        >
          <ArrowLeft size={16} />
          Accueil
        </Link>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-semibold tracking-[0.2em] ${
            isWoman ? "text-pink-300" : dark ? "text-neutral-400" : "text-proday-muted"
          }`}
        >
          {kicker}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mt-5 max-w-2xl text-lg ${
            dark || isWoman ? "text-white/80" : "text-proday-muted"
          }`}
        >
          {description}
        </motion.p>
      </div>
    </header>
  );
}

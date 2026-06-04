"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  FileText,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { ALL_PILLARS, PILLARS } from "@/lib/content";

const ICONS = [Users, Shield, FileText, Sparkles, Trophy, Calendar, Sparkles, Trophy];

type FeaturesBentoProps = {
  extended?: boolean;
};

export function FeaturesBento({ extended }: FeaturesBentoProps) {
  const items = extended ? ALL_PILLARS : PILLARS;

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {!extended && (
          <Reveal>
            <p className="text-sm font-medium tracking-widest text-proday-muted">
              FONCTIONNALITÉS
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Tout ce qui fait ProDay
            </h2>
          </Reveal>
        )}

        <div
          className={`grid gap-4 sm:grid-cols-2 ${extended ? "lg:grid-cols-4" : "lg:grid-cols-4"} ${extended ? "mt-0" : "mt-12"}`}
        >
          {items.map((p, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6 ${
                  i === 0 ? "sm:col-span-2 lg:row-span-1" : ""
                }`}
              >
                <div className="mb-4 inline-flex rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-100 transition group-hover:scale-110">
                  <Icon size={22} />
                </div>
                <p className="text-xs font-medium text-proday-muted">
                  {p.subtitle}
                </p>
                <h3 className="mt-1 text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-proday-muted leading-relaxed">
                  {p.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

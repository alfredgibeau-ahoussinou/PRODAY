"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

const CHOICES = [
  {
    id: "player",
    title: "Joueur",
    subtitle: "Trouver un club ou des opportunités",
    icon: "⚽",
    href: ROUTES.joueur,
  },
  {
    id: "coach",
    title: "Coach",
    subtitle: "Gérer une équipe et les matchs",
    icon: "🏆",
    href: ROUTES.proStaff,
  },
  {
    id: "club",
    title: "Club",
    subtitle: "Effectifs, recrutement et suivi",
    icon: "🏟️",
    href: ROUTES.proClub,
  },
  {
    id: "supporter",
    title: "Supporter",
    subtitle: "Suivre clubs, scores et communauté",
    icon: "📣",
    href: ROUTES.supporter,
  },
];

export function OnboardingPriorityQuestion() {
  const router = useRouter();

  const handleChoice = (href: string) => {
    router.push(href);
  };

  return (
    <section className="border-y border-white/10 bg-[#070709] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 max-w-2xl"
        >
          <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
            C'est quoi ?
          </p>
          <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
            Quelle est votre priorité cette saison ?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/55">
            Cliquez sur votre profil pour accéder directement aux fonctionnalités qui vous concernent
          </p>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-2">
          {CHOICES.map((choice, index) => (
            <motion.button
              key={choice.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onClick={() => handleChoice(choice.href)}
              className="group relative flex min-h-[120px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="relative flex flex-1 items-center gap-4 p-5 sm:p-6">
                <span className="text-4xl">{choice.icon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-display text-xl font-bold text-white">
                    {choice.title}
                  </p>
                  <p className="mt-1 text-sm text-white/45">{choice.subtitle}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const STEPS = [
  {
    n: "01",
    title: "Proposer",
    body: "Club ou coach : adversaire, catégorie, date, créneau, lieu et type de match (amical, préparation, tournoi…).",
  },
  {
    n: "02",
    title: "Répondre",
    body: "Le club invité accepte, refuse ou propose une autre date. Contre-proposition en un geste.",
  },
  {
    n: "03",
    title: "Confirmer",
    body: "Accord des deux côtés : match créé, calendriers synchronisés, coachs informés, convocations prêtes.",
  },
] as const;

/**
 * Invitations de match club ↔ club : réseau d’adversaires sans WhatsApp.
 */
export function ClubMatchInviteSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="invitations-match"
      className="relative overflow-hidden border-t border-white/10 bg-[#030712] px-4 py-16 sm:px-6 sm:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 80% 10%, rgba(0,108,252,0.28), transparent 55%), radial-gradient(ellipse 40% 35% at 10% 90%, rgba(22,163,74,0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,#7C3AED)]">
          Matchs entre clubs
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.2vw,3rem)] font-medium tracking-[-0.03em] text-white">
          Trouvez un adversaire. Organisez le match. Sans WhatsApp.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
          Clubs et coachs autorisés proposent un match directement dans ProDay :
          recherche par nom, ville, distance et catégorie. Fini les échanges
          interminables par téléphone ou Facebook.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.article
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent,#7C3AED)]">
                {step.n}
              </p>
              <h3 className="mt-3 font-display text-lg font-medium tracking-[-0.02em] text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.body}</p>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-white/45">
          Espace « Matchs à organiser » : invitations reçues et envoyées,
          contre-propositions, matchs confirmés et en attente. Exemple : trouver
          une équipe U15 disponible pour un amical à moins de 30 km.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center justify-center bg-[var(--pole-accent,#7C3AED)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Tester dans la bêta
          </Link>
          <Link
            href={ROUTES.coach}
            className="inline-flex items-center justify-center border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Côté coach
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/lib/routes";

type Props = {
  /** Accent CSS color */
  accent?: string;
  compact?: boolean;
};

/**
 * Tarification Joueur — Pass IA vs coaching humain à l’heure.
 * Toujours visible dans les univers immersifs.
 */
export function JoueurPricingBlock({
  accent = "#F5D04A",
  compact = false,
}: Props) {
  const reduce = useReducedMotion();

  return (
    <section
      id="tarifs"
      className={`border-t border-white/10 ${compact ? "py-10" : "py-14"} px-4 sm:px-6 lg:px-8`}
    >
      <div className="mx-auto max-w-6xl">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.28em]"
          style={{ color: accent }}
        >
          Tarifs · clair et net
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,4vw,2.6rem)] font-medium tracking-[-0.03em] text-white">
          Combien ça coûte&nbsp;?
        </h2>
        <p className="mt-3 max-w-xl text-sm text-white/55 sm:text-base">
          Jouer sur ProDay est gratuit. Tu paies seulement si tu veux l’assistant
          IA (Pass) ou un coaching humain à l’heure.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <motion.article
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
              Gratuit
            </p>
            <p className="mt-2 font-display text-3xl text-white">0 €</p>
            <p className="mt-1 text-sm text-white/50">Pour démarrer</p>
            <ul className="mt-5 space-y-2 text-sm text-white/70">
              <li>· Profil & réseau</li>
              <li>· Convocations & covoiturage</li>
              <li>· Stats de base</li>
              <li>· Messagerie & événements</li>
            </ul>
          </motion.article>

          <motion.article
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: `${accent}99`,
              background: `linear-gradient(160deg, ${accent}22, transparent 70%)`,
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Assistant IA · Pass
            </p>
            <p className="mt-2 font-display text-3xl text-white">
              3,99 €<span className="text-base text-white/50"> / mois</span>
            </p>
            <p className="mt-1 text-sm text-white/60">
              L’assistant IA prépare tes entraînements perso
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/75">
              <li>· Entraînements personnalisés IA</li>
              <li>· Heatmaps & stats avancées</li>
              <li>· Analyse vidéo</li>
              <li>· Passeport recruteur & objectifs</li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              Pas un coach humain : un programme guidé par l’IA, adapté à ton âge,
              ton poste et tes objectifs.
            </p>
          </motion.article>

          <motion.article
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
              Coach humain
            </p>
            <p className="mt-2 font-display text-3xl text-white">
              ~30 €<span className="text-base text-white/50"> / heure</span>
            </p>
            <p className="mt-1 text-sm text-white/50">
              Tarif du coach · payé à la séance
            </p>
            <ul className="mt-5 space-y-2 text-sm text-white/70">
              <li>· Vrai coach, créneau réservé</li>
              <li>· Paiement à l’heure (pas d’abo forcé)</li>
              <li>· Exemple 30 € : coach ~25 € · ProDay ~3 € · club ~2 €</li>
              <li>· Commissions configurables par le club</li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              Ce n’est pas l’IA : c’est un coaching personnalisé en présentiel (ou
              séance réservée), au tarif affiché par le coach.
            </p>
          </motion.article>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 sm:p-5">
          <p className="text-sm font-semibold text-white">
            IA ou coach humain · ce n’est pas le même prix
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            <strong className="text-white/80">Assistant IA</strong> = inclus dans
            le Pass Joueur à <strong className="text-white/80">3,99 €/mois</strong>{" "}
            (programmes, objectifs, stats avancées).{" "}
            <strong className="text-white/80">Coach humain</strong> = séance à
            l’heure, environ <strong className="text-white/80">30 €/h</strong>{" "}
            selon le coach, sans abonnement obligatoire.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`${ROUTES.pricing}#joueur`}
              className="text-sm font-semibold underline-offset-2 hover:underline"
              style={{ color: accent }}
            >
              Voir le détail tarifs
            </Link>
            <Link
              href={ROUTES.coach}
              className="text-sm font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              Espace Coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

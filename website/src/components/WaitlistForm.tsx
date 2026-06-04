"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BETA_PITCH } from "@/lib/content";
import { Reveal } from "./Reveal";

type WaitlistFormProps = { fullPage?: boolean };

export function WaitlistForm({ fullPage }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("player");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <section className={fullPage ? "py-12" : "scroll-mt-24 py-24"}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-proday-ink px-8 py-16 text-white sm:px-14"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          <Reveal>
            {!fullPage ? (
              <>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Rejoignez la bêta ProDay
                </h2>
                <p className="mt-4 max-w-lg text-white/75">{BETA_PITCH.summary}</p>
                <p className="mt-3 max-w-lg text-sm text-pink-200/90">
                  {BETA_PITCH.dailyUpdates}
                </p>
              </>
            ) : (
              <ul className="max-w-lg space-y-2 text-sm text-white/80">
                <li className="flex gap-2">
                  <span className="text-pink-300">•</span>
                  {BETA_PITCH.dailyUpdates}
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-300">•</span>
                  {BETA_PITCH.launch}
                </li>
                <li className="flex gap-2">
                  <span className="text-pink-300">•</span>
                  Accès prioritaire à la bêta mobile
                </li>
              </ul>
            )}
          </Reveal>

          {sent ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-10 rounded-2xl bg-white/10 p-6"
            >
              <p className="text-lg font-semibold">Merci !</p>
              <p className="mt-2 text-white/80">
                Nous avons enregistré <strong>{email}</strong> pour le rôle{" "}
                <strong>{role}</strong>. Vous recevrez des nouvelles quotidiennes
                sur l&apos;avancement de ProDay jusqu&apos;au lancement.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "player", label: "Joueur" },
                  { id: "coach", label: "Coach" },
                  { id: "club", label: "Club" },
                  { id: "organizer", label: "Organisateur" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      role === r.id
                        ? "bg-white text-proday-ink"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3.5 text-white placeholder:text-white/50 focus:outline focus:outline-2 focus:outline-white/40"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white px-8 py-3.5 font-semibold text-proday-ink transition hover:bg-neutral-100"
                >
                  S&apos;inscrire
                </button>
              </div>
              <p className="text-xs text-white/50">
                Démo locale — les emails ne sont pas envoyés (phase marketing).
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

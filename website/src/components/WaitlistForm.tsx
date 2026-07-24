"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BETA_PITCH } from "@/lib/content";
import { BETA_ROLE_LABELS, type BetaRoleId } from "@/lib/betaWelcomeEmail";
import { Reveal } from "./Reveal";

type WaitlistFormProps = {
  fullPage?: boolean;
  compact?: boolean;
  minimal?: boolean;
  initialRole?: BetaRoleId;
};

type SubmitState = "idle" | "loading" | "success" | "error";
type WaitlistStatus = "pending" | "approved" | "rejected";

export function WaitlistForm({ fullPage, compact, minimal, initialRole }: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BetaRoleId>(initialRole ?? "player");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("pending");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    setState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, role }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: WaitlistStatus;
        message?: string;
      };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Inscription impossible. Réessayez.");
        setState("error");
        return;
      }

      const status =
        data.status === "approved" || data.status === "rejected"
          ? data.status
          : "pending";
      setWaitlistStatus(status);
      setState("success");
    } catch {
      setErrorMessage("Connexion impossible. Vérifiez votre réseau.");
      setState("error");
    }
  }

  const roles: { id: BetaRoleId; label: string }[] = [
    { id: "player", label: "Joueur" },
    { id: "recruiter", label: "Recruteur" },
    { id: "coach", label: "Coach" },
    { id: "club", label: "Club" },
    { id: "agent", label: "Agent" },
    { id: "organizer", label: "Organisateur" },
    { id: "physio", label: "Pôle santé" },
    { id: "sponsor", label: "Partenaire" },
  ];

  if (minimal) {
    return (
      <section id="inscription" className="scroll-mt-28 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
              Bêta
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
              Liste d&apos;attente
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/45">
              {BETA_PITCH.summary}
            </p>
          </div>
          {state === "success" ? (
            <div className="rounded-3xl border border-[var(--proday-accent)]/25 bg-[var(--proday-accent-muted)] p-6 text-white">
              <p className="font-semibold">Merci. Inscription enregistrée.</p>
              <p className="mt-1 text-sm text-white/75">
                {email} · {BETA_ROLE_LABELS[role]}
                {waitlistStatus === "approved"
                  ? ". Consultez votre boîte mail pour l'accès bêta."
                  : ". L'équipe ProDay vous contactera après validation."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-2xl space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as BetaRoleId)}
                  disabled={state === "loading"}
                  className="min-h-11 rounded-full border-0 bg-white/10 px-4 py-3 text-sm text-white focus:outline focus:outline-2 focus:outline-[var(--proday-accent)]/50 disabled:opacity-60"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-neutral-900">
                      {r.label}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  required
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "loading"}
                  className="min-h-11 flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-white caret-white placeholder:text-white/50 focus:outline focus:outline-2 focus:outline-[var(--proday-accent)]/50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="min-h-11 shrink-0 rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a6fff] disabled:opacity-60"
                >
                  {state === "loading" ? "Envoi…" : "S'inscrire"}
                </button>
              </div>
              {state === "error" && errorMessage ? (
                <p className="text-sm text-red-300">{errorMessage}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      id={fullPage ? undefined : "inscription"}
      className={fullPage ? "py-12" : compact ? "scroll-mt-24 py-14 md:py-16" : "scroll-mt-24 py-24"}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c12] via-[#0a0a0f] to-[#030303] text-white ${
            compact ? "px-6 py-10 sm:px-10" : "px-8 py-16 sm:px-14"
          }`}
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

          <Reveal>
            {!fullPage ? (
              <>
                <h2 className="font-display text-3xl font-bold sm:text-4xl">
                  Liste d&apos;attente ProDay
                </h2>
                <p className="mt-4 max-w-lg text-white/75">{BETA_PITCH.summary}</p>
                <p className="mt-3 max-w-lg text-sm text-white/50">
                  {BETA_PITCH.dailyUpdates}
                </p>
              </>
            ) : (
              <ul className="max-w-lg space-y-2 text-sm text-white/80">
                <li className="flex gap-2">
                  <span className="text-white/40">·</span>
                  {BETA_PITCH.dailyUpdates}
                </li>
                <li className="flex gap-2">
                  <span className="text-white/40">·</span>
                  {BETA_PITCH.launch}
                </li>
                <li className="flex gap-2">
                  <span className="text-white/40">·</span>
                  Validation par l&apos;équipe ProDay, puis email d&apos;accès à
                  l&apos;espace bêta
                </li>
              </ul>
            )}
          </Reveal>

          {state === "success" ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-10 rounded-2xl bg-white/10 p-6"
            >
              <p className="text-lg font-semibold">Merci !</p>
              <p className="mt-2 text-white/80">
                Inscription confirmée pour <strong>{email}</strong> (
                {BETA_ROLE_LABELS[role]}).
                {waitlistStatus === "approved" ? (
                  <>
                    {" "}
                    Votre accès est déjà validé. Consultez votre boîte mail
                    (et les spams) pour le lien vers l&apos;espace bêta.
                  </>
                ) : (
                  <>
                    {" "}
                    Votre demande est enregistrée. L&apos;équipe ProDay vous
                    contactera par email après validation.
                  </>
                )}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 max-w-lg space-y-4">
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`min-h-11 rounded-full px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--proday-accent)]/50 ${
                      role === r.id
                        ? "bg-[var(--proday-accent)] font-semibold text-black"
                        : "bg-white/10 text-white hover:bg-white/20 active:bg-white/25"
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
                  disabled={state === "loading"}
                  className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3.5 text-white caret-white placeholder:text-white/50 focus:outline focus:outline-2 focus:outline-[var(--proday-accent)]/50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="min-h-11 rounded-full bg-[var(--proday-accent)] px-8 py-3.5 font-bold text-white transition hover:bg-[#2a6fff] active:bg-[#0046cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--proday-accent)]/50 disabled:opacity-60"
                >
                  {state === "loading" ? "Envoi…" : "S'inscrire"}
                </button>
              </div>
              {state === "error" && errorMessage ? (
                <p className="text-sm text-red-300">{errorMessage}</p>
              ) : null}
              <p className="text-xs text-white/50">
                En vous inscrivant, vous acceptez de recevoir des emails sur la
                liste d&apos;attente ProDay. Désinscription possible à tout moment.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

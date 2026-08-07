"use client";

import { FormEvent, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { BetaAccessSession } from "@/lib/betaAccess";

const CATEGORIES = [
  { id: "bug", label: "Bug" },
  { id: "idea", label: "Idée" },
  { id: "ux", label: "UX" },
  { id: "other", label: "Autre" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function BetaFeedbackForm({ session }: { session: BetaAccessSession }) {
  const [category, setCategory] = useState<CategoryId>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) return;
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Envoi impossible");
        setState("error");
        return;
      }
      setMessage("");
      setState("success");
    } catch {
      setError("Erreur réseau");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="border border-emerald-500/30 bg-emerald-500/10 p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
          Merci
        </p>
        <p className="mt-3 font-display text-xl font-medium tracking-[-0.02em] text-white">
          Retour envoyé
        </p>
        <p className="mt-2 text-sm text-white/60">
          L’équipe le lit dans l’admin. Tu peux en envoyer un autre si besoin.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 underline hover:text-white"
        >
          Nouveau retour
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-[var(--proday-accent)]/30 bg-[var(--proday-accent-muted)] p-8"
    >
      <MessageSquare className="text-[var(--proday-accent)]" size={28} />
      <h2 className="mt-4 font-display text-xl font-medium tracking-[-0.02em] text-white">
        Envoyer un retour
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
        Bug bloquant, idée ou retour UX. Profil : {session.roleLabel} ·{" "}
        {session.email}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
              category === c.id
                ? "bg-accent-gradient text-white"
                : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          Message
        </span>
        <textarea
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={state === "loading"}
          placeholder="Décris le problème ou l’idée (appareil, version, étapes…)"
          className="w-full border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--proday-accent)]/55"
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-red-300">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={state === "loading" || !message.trim()}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-gradient px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {state === "loading" ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Send, CheckCircle2, Loader2 } from "lucide-react";

/** Durée minimale entre l'ouverture de la modale et l'envoi (les humains ne vont pas plus vite). */
const MIN_FILL_MS = 2500;

export function SupportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("Bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  // Anti-bot : honeypot (champ invisible, doit rester vide) + horodatage d'ouverture.
  const [honeypot, setHoneypot] = useState("");
  const [openedAt, setOpenedAt] = useState(0);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#support") {
        setIsOpen(true);
        setOpenedAt(Date.now());
        window.location.hash = ""; // Clear hash after opening
      }
    };

    // Check on mount
    handleHash();

    // Listen for changes
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const resetAndClose = () => {
    setIsOpen(false);
    setStatus("idle");
    setMessage("");
    setHoneypot("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-bot : honeypot rempli ou envoi trop rapide après ouverture → faux succès,
    // sans appel réseau, pour ne pas renseigner les robots.
    if (honeypot || Date.now() - openedAt < MIN_FILL_MS) {
      setStatus("success");
      setTimeout(resetAndClose, 3000);
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          email,
          website: honeypot, // Honeypot : le serveur refuse s'il est rempli
          elapsedMs: Date.now() - openedAt, // Le serveur refuse si < MIN_FORM_FILL_MS
        })
      });

      if (!res.ok) throw new Error("Erreur");

      setStatus("success");
      setTimeout(resetAndClose, 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-white">Contacter le support</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={48} className="text-[#00E676] mb-4" />
              <p className="text-lg font-bold text-white">Message envoyé</p>
              <p className="text-white/60 mt-2">Notre équipe vous répondra dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Type de demande
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--proday-accent)]"
                >
                  <option value="Problème de téléchargement">Problème de téléchargement</option>
                  <option value="Bug">Signaler un Bug</option>
                  <option value="Idée">Suggérer une Idée</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Votre Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--proday-accent)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez-nous le problème en détail..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[var(--proday-accent)]"
                />
              </div>

              {/* Honeypot anti-bot : hors écran, non focusable, ignoré par les lecteurs d'écran.
                  Un humain ne le voit jamais ; un robot qui remplit tous les champs se trahit. */}
              <div
                className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              >
                <label htmlFor="support-website">Site web</label>
                <input
                  id="support-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">Une erreur est survenue lors de l’envoi. Veuillez réessayer.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--proday-accent)] px-6 py-4 font-bold text-black transition hover:brightness-110 disabled:opacity-50"
              >
                {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                <span>Envoyer le message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

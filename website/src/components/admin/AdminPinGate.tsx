"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Key } from "lucide-react";

type LoginMethod = "pin" | "email";

export function AdminPinGate() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>("pin");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = method === "pin" ? { pin } : { email };
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Connexion impossible");
        return;
      }
      router.replace(data.redirect ?? "/admin/beta");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-[0.22em] text-[#4C8BFF]">
        ProDay · Fondateurs
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-white">
        Espace admin bêta
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Accès réservé aux membres de l&apos;équipe. Connectez-vous avec votre
        minicode ou votre email.
      </p>

      {/* Sélecteur de méthode */}
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMethod("pin");
            setError(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${
            method === "pin"
              ? "border-[#0054F0] bg-[#0054F0]/10 text-[#0054F0]"
              : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30"
          }`}
        >
          <Key size={18} />
          <span className="text-sm font-medium">Minicode</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod("email");
            setError(null);
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 transition ${
            method === "email"
              ? "border-[#0054F0] bg-[#0054F0]/10 text-[#0054F0]"
              : "border-white/15 bg-white/[0.04] text-white/60 hover:border-white/30"
          }`}
        >
          <Mail size={18} />
          <span className="text-sm font-medium">Email</span>
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {method === "pin" ? (
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50">
              Minicode
            </span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              name="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={32}
              required
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-center font-[family-name:var(--font-syne)] text-2xl tracking-[0.35em] text-white outline-none transition focus:border-[#0054F0]/70 focus:ring-2 focus:ring-[#0054F0]/25"
              placeholder="••••••"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/50">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 font-[family-name:var(--font-syne)] text-white outline-none transition focus:border-[#0054F0]/70 focus:ring-2 focus:ring-[#0054F0]/25"
              placeholder="votre@email.com"
            />
          </label>
        )}

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || (method === "pin" ? !pin.trim() : !email.trim())}
          className="w-full rounded-full bg-[#0054F0] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

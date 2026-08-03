"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminPinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Connexion impossible");
        return;
      }
      router.replace(data.redirect ?? "/admin/dashboard");
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
        Accès réservé aux 4 membres de l&apos;équipe. Saisissez le minicode
        partagé pour ouvrir le tableau de bord fondateurs.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-5">
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

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !pin.trim()}
          className="w-full rounded-full bg-[#0054F0] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#2a6fff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Vérification…" : "Entrer"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBanner, AdminButton, AdminInput } from "@/components/admin/adminUi";

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
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0c] px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm border border-white/10 bg-[#111114] p-4">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center bg-[var(--proday-accent)] text-[10px] font-bold text-white">
            PD
          </span>
          <div>
            <p className="text-sm font-semibold text-white">ProDay</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
              Admin fondateurs
            </p>
          </div>
        </div>

        <h1 className="font-display text-lg font-medium tracking-[-0.02em] text-white">
          Connexion
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-white/45">
          Minicode partagé — accès console site (bêta, trafic, plateforme).
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
              Minicode
            </span>
            <AdminInput
              type="password"
              name="pin"
              autoComplete="current-password"
              inputMode="numeric"
              enterKeyHint="go"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <AdminBanner tone="error">{error}</AdminBanner> : null}

          <AdminButton type="submit" variant="primary" className="w-full min-h-11" disabled={loading}>
            {loading ? "Connexion…" : "Entrer"}
          </AdminButton>
        </form>
      </div>
    </main>
  );
}

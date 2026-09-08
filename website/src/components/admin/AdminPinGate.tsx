"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AccBanner, AccButton, AccInput } from "@/components/admin/cc/AccUi";
import { ACC_HOME } from "@/lib/adminCc/nav";
import { PRODAY_MARK } from "@/lib/brandingAssets";

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
      router.replace(data.redirect ?? ACC_HOME);
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="acc-shell flex min-h-[100dvh] items-center justify-center bg-[var(--acc-bg,#06080f)] px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm border border-[var(--acc-line,rgba(148,163,184,0.14))] bg-[var(--acc-surface,#0c1018)] p-5">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="acc-mark flex h-9 w-9 items-center justify-center overflow-hidden rounded-md p-1.5">
            <Image src={PRODAY_MARK} alt="" width={28} height={28} className="h-full w-full object-contain" priority />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">ProDay</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              Admin Control Center
            </p>
          </div>
        </div>

        <h1 className="font-display text-xl font-medium tracking-[-0.03em] text-white">
          Accès fondateurs
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-white/45">
          Minicode fondateurs — ops site (bêta, trafic, commercial, finances). Contrôle produit
          total = Espace Admin app.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
              Minicode
            </span>
            <AccInput
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

          {error ? <AccBanner tone="error">{error}</AccBanner> : null}

          <AccButton type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion…" : "Entrer dans le Control Center"}
          </AccButton>
        </form>
      </div>
    </main>
  );
}

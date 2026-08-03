"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminButton, AdminInput } from "@/components/admin/adminUi";

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
    <main className="admin-shell relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[#05070d]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,84,240,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(10,20,48,0.65),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.3] [background-image:linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.09] bg-[#080b14]/92 p-7 shadow-[0_32px_90px_-30px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0054F0] text-xs font-bold tracking-wide text-white shadow-[0_0_0_1px_rgba(76,139,255,0.35),0_10px_28px_-10px_rgba(0,84,240,0.75)]">
            PD
          </span>
          <div>
            <p className="font-display text-sm font-bold tracking-[0.14em] text-white">
              PRODAY
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7AA7FF]">
              Admin fondateurs
            </p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
          Espace admin bêta
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-white/50">
          Accès réservé aux 4 membres de l&apos;équipe. Saisissez le minicode
          partagé pour ouvrir le tableau de bord.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Minicode
            </span>
            <AdminInput
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              name="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={32}
              required
              className="py-3.5 text-center font-display text-2xl tracking-[0.35em]"
              placeholder="••••••"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <AdminButton
            type="submit"
            variant="primary"
            disabled={loading || !pin.trim()}
            className="w-full py-3.5"
          >
            {loading ? "Vérification…" : "Entrer"}
          </AdminButton>
        </form>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

const NAV = [
  { href: ROUTES.adminBeta, label: "Liste d’attente" },
  { href: ROUTES.adminVisites, label: "Visites" },
  { href: ROUTES.adminDashboard, label: "Dashboard" },
  { href: ROUTES.adminUsers, label: "Utilisateurs" },
  { href: ROUTES.adminContent, label: "Contenu" },
  { href: ROUTES.adminPoles, label: "Pôles" },
  { href: ROUTES.adminAnalytics, label: "Analytics" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav className="flex flex-wrap gap-1.5" aria-label="Admin">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                active
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-white/60 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => void logout()}
        className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50 transition hover:border-white/25 hover:text-white/80"
      >
        Quitter
      </button>
    </div>
  );
}

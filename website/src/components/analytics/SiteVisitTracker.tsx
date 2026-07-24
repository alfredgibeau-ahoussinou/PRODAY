"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "proday_site_visit_v1";

/**
 * Ping unique par onglet/session navigateur (hors /admin).
 * Fire-and-forget — n’impacte pas le rendu.
 */
export function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    try {
      if (typeof window === "undefined") return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* sessionStorage indisponible — on tente quand même une fois via module */
    }

    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "site" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

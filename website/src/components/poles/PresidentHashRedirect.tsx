"use client";

import { useEffect } from "react";
import { PRESIDENT_HUB_HREF } from "@/lib/routes";

/**
 * Legacy : /pro-club#president → /president#app.
 * Les hashes ne passent pas par les redirects Next ; on gère côté client.
 */
export function PresidentHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#president") {
      window.location.replace(PRESIDENT_HUB_HREF);
    }
  }, []);

  return null;
}

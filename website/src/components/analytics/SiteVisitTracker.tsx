"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "proday_site_visit_v1";

/**
 * Ping unique par onglet/session navigateur (hors /admin).
 * Fire-and-forget : n’impacte pas le rendu.
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
      /* sessionStorage indisponible : on tente quand même une fois via module */
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

const EVENT_QUEUE_KEY = "proday_analytics_queue";

interface AnalyticsEvent {
  type: "click" | "view" | "error" | "interaction";
  category: string;
  action: string;
  label?: string;
  timestamp: number;
}

/**
 * Hook pour tracker les événements utilisateur
 */
export function useAnalytics() {
  const trackEvent = (event: Omit<AnalyticsEvent, "timestamp">) => {
    if (typeof window === "undefined") return;
    
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
    };

    try {
      const queue = JSON.parse(sessionStorage.getItem(EVENT_QUEUE_KEY) || "[]");
      queue.push(fullEvent);
      sessionStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue));

      if (queue.length >= 5) {
        flushAnalyticsQueue(queue);
      }
    } catch {
      void sendEvent(fullEvent);
    }
  };

  const trackClick = (category: string, label: string) => {
    trackEvent({
      type: "click",
      category,
      action: "click",
      label,
    });
  };

  const trackView = (category: string, label: string) => {
    trackEvent({
      type: "view",
      category,
      action: "view",
      label,
    });
  };

  const trackError = (category: string, message: string) => {
    trackEvent({
      type: "error",
      category,
      action: "error",
      label: message,
    });
  };

  return { trackEvent, trackClick, trackView, trackError };
}

function flushAnalyticsQueue(queue: AnalyticsEvent[]) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: queue }),
    keepalive: true,
  }).then(() => {
    try {
      sessionStorage.setItem(EVENT_QUEUE_KEY, "[]");
    } catch {
      // Ignore
    }
  }).catch(() => {
    // Garder en queue pour réessayer plus tard
  });
}

function sendEvent(event: AnalyticsEvent) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
    keepalive: true,
  }).catch(() => undefined);
}

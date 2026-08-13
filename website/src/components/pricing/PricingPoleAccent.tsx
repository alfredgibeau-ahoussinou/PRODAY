"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { RoleVisualId } from "@/lib/roleVisuals";
import type { PoleId } from "@/lib/poles";
import { WebGlErrorBoundary } from "@/components/immersive/WebGlErrorBoundary";

const RoleAccentCanvas = dynamic(
  () => import("@/components/immersive/RoleAccentCanvas").then((m) => m.RoleAccentCanvas),
  { ssr: false, loading: () => <div className="h-full w-full bg-transparent" /> },
);

export function poleIdToVisualRole(poleId: PoleId): RoleVisualId {
  if (poleId === "amateur" || poleId === "pro_joueur") return "joueur";
  if (poleId === "coach" || poleId === "pro_staff") return "coach";
  if (poleId === "evenements") return "pro_club";
  if (
    poleId === "supporter" ||
    poleId === "sante" ||
    poleId === "pro_club" ||
    poleId === "sponsor" ||
    poleId === "parent"
  ) {
    return poleId;
  }
  return "joueur";
}

type PricingPoleAccentProps = {
  poleId: PoleId;
  className?: string;
};

/** Lazy WebGL accent for a pricing chapter : mounts only when near viewport. */
export function PricingPoleAccent({ poleId, className = "" }: PricingPoleAccentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const role = poleIdToVisualRole(poleId);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "80px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative h-[200px] w-full sm:h-[240px] lg:h-[280px] ${className}`}
      aria-hidden
    >
      {active ? (
        <WebGlErrorBoundary>
          <RoleAccentCanvas role={role} className="h-full w-full" />
        </WebGlErrorBoundary>
      ) : (
        <div
          className="h-full w-full"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, var(--pole-accent, #0054F0)22, transparent 62%)",
          }}
        />
      )}
    </div>
  );
}

"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { Suspense, lazy } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteVisitTracker } from "@/components/analytics/SiteVisitTracker";
import { BackToTop } from "@/components/BackToTop";
import { ReferralCapture } from "@/components/ReferralCapture";
import { PoleContextBar } from "./PoleContextBar";
import { PageTransition } from "./PageTransition";
import { ScrollToHash } from "./ScrollToHash";
import { showPoleContextBar } from "@/lib/siteArchitecture";
import { navBrandForPath } from "@/components/universe/universeTheme";

const SiteFooter = lazy(() => import("@/components/SiteFooter").then(mod => ({ default: mod.SiteFooter })));
const SiteHelpChatbot = lazy(() => import("@/components/SiteHelpChatbot").then(mod => ({ default: mod.SiteHelpChatbot })));

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const showPoleBar = showPoleContextBar(pathname);
  const brand = navBrandForPath(pathname);
  const accent = brand.theme?.brandAccent ?? "#0054F0";
  const deep = brand.theme?.brandDeep ?? "#001854";

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="page-dark relative min-h-screen bg-black text-white">
          <div
            className="pointer-events-none fixed inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 15% 0%, rgba(0,84,240,0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(0,24,84,0.35), transparent 50%), #000",
            }}
            aria-hidden
          />
          <div className="relative z-10">{children}</div>
        </div>
      </MotionConfig>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <SiteVisitTracker />
      <div
        className="page-dark relative min-h-screen bg-black text-white"
        style={
          {
            ["--proday-accent" as string]: isHome ? "#0054F0" : accent,
            ["--proday-accent-dim" as string]: isHome ? "#0038B0" : deep,
            ["--proday-accent-glow" as string]: isHome
              ? "rgba(0, 84, 240, 0.35)"
              : `${accent}59`,
            ["--proday-accent-muted" as string]: isHome
              ? "rgba(0, 84, 240, 0.14)"
              : `${accent}24`,
          } as React.CSSProperties
        }
      >
        {!isHome ? (
          <div
            className="pointer-events-none fixed inset-0 opacity-90"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 15% 0%, ${accent}28, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, ${deep}40, transparent 50%), #000`,
            }}
            aria-hidden
          />
        ) : (
          <>
            <div className="pointer-events-none fixed inset-0 gradient-mesh opacity-50" aria-hidden />
            <div className="pointer-events-none fixed inset-0 grid-lines opacity-[0.15]" aria-hidden />
          </>
        )}
        <div className="relative z-10">
          <ScrollToHash />
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          <SiteNav />
          <div className={`overflow-x-clip ${isHome ? "surface-dark" : ""}`}>
            {showPoleBar && <PoleContextBar />}
            <main id="main-content" tabIndex={-1}>
              <PageTransition pathname={pathname}>{children}</PageTransition>
            </main>
          </div>
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
          <Suspense fallback={null}>
            <SiteHelpChatbot />
          </Suspense>
          <BackToTop />
        </div>
      </div>
    </MotionConfig>
  );
}

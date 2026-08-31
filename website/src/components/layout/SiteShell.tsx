"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { Suspense, lazy } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteVisitTracker } from "@/components/analytics/SiteVisitTracker";
import { BackToTop } from "@/components/BackToTop";
import { ReferralCapture } from "@/components/ReferralCapture";
import { PageTransition } from "./PageTransition";
import { ScrollToHash } from "./ScrollToHash";
import { MASTER_ACCENT_CSS_VARS, poleAccentCssVars } from "@/lib/brandColors";

const SiteHelpChatbot = lazy(() =>
  import("@/components/SiteHelpChatbot").then((mod) => ({
    default: mod.SiteHelpChatbot,
  })),
);

const joueurShellVars = poleAccentCssVars("joueur");

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isJoueurWorld =
    pathname === "/joueur" || pathname.startsWith("/joueur/");

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <div
          className="page-terminal relative min-h-screen bg-black text-white"
          style={MASTER_ACCENT_CSS_VARS as React.CSSProperties}
        >
          <div className="relative z-10">{children}</div>
        </div>
      </MotionConfig>
    );
  }

  /** Monde Joueur 3D/4D : menu toujours au-dessus, contenu isolé en dessous. */
  if (isJoueurWorld) {
    return (
      <MotionConfig reducedMotion="user">
        <SiteVisitTracker />
        <div
          className="page-joueur-world relative min-h-screen overflow-x-clip bg-[#020617] text-white"
          style={joueurShellVars as React.CSSProperties}
        >
          <ScrollToHash />
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          <div className="relative z-[110]">
            <SiteNav />
          </div>
          <main
            id="main-content"
            tabIndex={-1}
            className="relative z-0 isolate overflow-x-clip"
          >
            <PageTransition pathname={pathname}>{children}</PageTransition>
          </main>
          <BackToTop />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <SiteVisitTracker />
      <div
        className="page-terminal relative min-h-screen text-[#f5f5f0]"
        style={MASTER_ACCENT_CSS_VARS as React.CSSProperties}
      >
        <div className="relative z-10">
          <ScrollToHash />
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          <SiteNav />
          <div className="overflow-x-clip">
            <main id="main-content" tabIndex={-1}>
              <PageTransition pathname={pathname}>{children}</PageTransition>
            </main>
          </div>
          <SiteFooter />
          <Suspense fallback={null}>
            <SiteHelpChatbot />
          </Suspense>
          <BackToTop />
        </div>
      </div>
    </MotionConfig>
  );
}

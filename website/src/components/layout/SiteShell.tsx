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

const SiteHelpChatbot = lazy(() =>
  import("@/components/SiteHelpChatbot").then((mod) => ({
    default: mod.SiteHelpChatbot,
  })),
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <MotionConfig reducedMotion="user">
        <div
          className="page-terminal relative min-h-screen bg-black text-white"
          style={
            {
              ["--proday-accent" as string]: "#0054F0",
              ["--proday-accent-bright" as string]: "#4C8BFF",
              ["--proday-accent-deep" as string]: "#001F6B",
              ["--proday-accent-dim" as string]: "#1A68FF",
              ["--proday-accent-glow" as string]: "rgba(0, 84, 240, 0.42)",
              ["--proday-accent-muted" as string]: "rgba(0, 84, 240, 0.16)",
              ["--proday-accent-gradient" as string]:
                "linear-gradient(135deg, #001F6B 0%, #0054F0 48%, #4C8BFF 100%)",
            } as React.CSSProperties
          }
        >
          <div className="relative z-10">{children}</div>
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <SiteVisitTracker />
      <div
        className="page-terminal relative min-h-screen text-[#f5f5f0]"
        style={
          {
            ["--proday-accent" as string]: "#0054F0",
            ["--proday-accent-bright" as string]: "#4C8BFF",
            ["--proday-accent-deep" as string]: "#001F6B",
            ["--proday-accent-dim" as string]: "#1A68FF",
            ["--proday-accent-glow" as string]: "rgba(0, 84, 240, 0.42)",
            ["--proday-accent-muted" as string]: "rgba(0, 84, 240, 0.16)",
            ["--proday-accent-gradient" as string]:
              "linear-gradient(135deg, #001F6B 0%, #0054F0 48%, #4C8BFF 100%)",
          } as React.CSSProperties
        }
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

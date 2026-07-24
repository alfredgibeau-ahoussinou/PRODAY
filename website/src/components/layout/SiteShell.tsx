"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHelpChatbot } from "@/components/SiteHelpChatbot";
import { SiteNav } from "@/components/SiteNav";
import { PoleContextBar } from "./PoleContextBar";
import { PageTransition } from "./PageTransition";
import { ScrollToHash } from "./ScrollToHash";
import { showPoleContextBar } from "@/lib/siteArchitecture";
import { navBrandForPath } from "@/components/universe/universeTheme";

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
    );
  }
  return (
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
        <SiteNav />
        <div className={`overflow-x-clip ${isHome ? "surface-dark" : ""}`}>
          {showPoleBar && <PoleContextBar />}
          <PageTransition>{children}</PageTransition>
        </div>
        <SiteFooter />
        <SiteHelpChatbot />
      </div>
    </div>
  );
}

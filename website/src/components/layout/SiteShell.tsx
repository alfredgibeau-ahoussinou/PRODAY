"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHelpChatbot } from "@/components/SiteHelpChatbot";
import { SiteNav } from "@/components/SiteNav";
import { PoleContextBar } from "./PoleContextBar";
import { PageTransition } from "./PageTransition";
import { ScrollToHash } from "./ScrollToHash";
import { showPoleContextBar } from "@/lib/siteArchitecture";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showPoleBar = showPoleContextBar(pathname);

  return (
    <div className="page-dark relative min-h-screen bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 gradient-mesh opacity-80"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 grid-lines opacity-[0.2]"
        aria-hidden
      />
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

"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { PoleContextBar } from "./PoleContextBar";
import { PageTransition } from "./PageTransition";
import { isPolePage } from "@/lib/siteArchitecture";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showPoleBar = isPolePage(pathname);

  return (
    <div className="page-dark min-h-screen bg-[#030303] text-white">
      <SiteNav />
      <div className={`overflow-x-clip ${isHome ? "surface-dark" : ""}`}>
        {showPoleBar && <PoleContextBar />}
        <PageTransition>{children}</PageTransition>
      </div>
      <SiteFooter />
    </div>
  );
}

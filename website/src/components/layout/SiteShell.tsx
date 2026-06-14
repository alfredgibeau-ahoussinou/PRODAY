"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { PageTransition } from "./PageTransition";

const IMMERSIVE_PATHS = new Set(["/", "/app"]);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = IMMERSIVE_PATHS.has(pathname);

  if (immersive) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteNav />
      <PageTransition>{children}</PageTransition>
      <SiteFooter />
    </>
  );
}

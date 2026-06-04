import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { PageTransition } from "./PageTransition";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <PageTransition>{children}</PageTransition>
      <SiteFooter />
    </>
  );
}

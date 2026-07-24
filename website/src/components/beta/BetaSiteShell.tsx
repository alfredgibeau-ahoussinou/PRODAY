import type { ReactNode } from "react";
import { BetaMiniSiteNav } from "@/components/beta/BetaMiniSiteNav";
import { BetaAccessDenied } from "@/components/beta/BetaAccessDenied";
import { PageHeader } from "@/components/layout/PageHeader";
import { getBetaSession } from "@/lib/getBetaSession";
import type { BetaAccessSession } from "@/lib/betaAccess";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
      {children}
    </p>
  );
}

export function BetaSessionBar({ session }: { session: BetaAccessSession }) {
  return (
    <div className="border-b border-white/10 bg-black">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-3 text-center sm:justify-between sm:text-left sm:px-6">
        <p className="text-sm text-white/70">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
            Bêta ProDay
          </span>
          <span className="mx-2 text-white/25">·</span>
          <span className="font-semibold text-white">{session.email}</span>
          <span className="text-white/40">. {session.roleLabel}</span>
        </p>
        <p className="text-xs text-white/35">Lien personnel. Ne pas partager</p>
      </div>
    </div>
  );
}

type BetaPageFrameProps = {
  pathname: string;
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function BetaPageFrame({
  pathname,
  kicker,
  title,
  description,
  children,
}: BetaPageFrameProps) {
  return (
    <>
      <PageHeader
        pathname={pathname}
        kicker={kicker}
        title={title}
        description={description}
        dark
      />
      <div className="bg-black py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <BetaMiniSiteNav />
            </aside>
            <main className="mt-8 min-w-0 lg:mt-0">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}

export async function BetaProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getBetaSession();
  if (!session) {
    return <BetaAccessDenied />;
  }
  return (
    <>
      <BetaSessionBar session={session} />
      {children}
    </>
  );
}

export function buildBetaFeedbackMailto(session: BetaAccessSession): string {
  return `mailto:support@proday.app?subject=${encodeURIComponent("Retour bêta ProDay")}&body=${encodeURIComponent(
    `Email bêta : ${session.email}\nProfil : ${session.roleLabel}\n\nDécrivez votre retour (bug, idée, UX…) :\n\n`,
  )}`;
}

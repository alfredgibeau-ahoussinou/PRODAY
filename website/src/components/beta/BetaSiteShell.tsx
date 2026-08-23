import type { ReactNode } from "react";
import { BetaMiniSiteNav } from "@/components/beta/BetaMiniSiteNav";
import { BetaAccessDenied } from "@/components/beta/BetaAccessDenied";
import { getBetaSession } from "@/lib/getBetaSession";
import type { BetaAccessSession } from "@/lib/betaAccess";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--pole-accent,var(--proday-accent-bright,#5B75FF))]">
      {children}
    </p>
  );
}

export function BetaSessionBar({ session }: { session: BetaAccessSession }) {
  return (
    <div className="border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-3 text-center sm:justify-between sm:px-6 sm:text-left">
        <p className="text-sm text-white/65">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--proday-accent-bright,#5B75FF)]">
            Bêta ProDay
          </span>
          <span className="mx-2 text-white/25">·</span>
          <span className="font-medium text-white">{session.email}</span>
          <span className="text-white/40"> · {session.roleLabel}</span>
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
          Lien personnel · ne pas partager
        </p>
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

/** Compact Terminal frame for post-registration beta pages (no 70vh cinema hero). */
export function BetaPageFrame({
  pathname,
  kicker,
  title,
  description,
  children,
}: BetaPageFrameProps) {
  void pathname;
  return (
    <div className="bg-black">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12">
          <SectionKicker>{kicker}</SectionKicker>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.035em] text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            {description}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BetaMiniSiteNav />
          </aside>
          <main className="mt-8 min-w-0 space-y-8 lg:mt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

export async function BetaProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
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
  return `mailto:proday.admin@gmail.com?subject=${encodeURIComponent("Retour bêta ProDay")}&body=${encodeURIComponent(
    `Email bêta : ${session.email}\nProfil : ${session.roleLabel}\n\nDécrivez votre retour (bug, idée, UX…) :\n\n`,
  )}`;
}

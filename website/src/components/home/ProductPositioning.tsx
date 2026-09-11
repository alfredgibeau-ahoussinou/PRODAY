import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Users,
  Trophy,
  CreditCard,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  Headphones,
  FileSpreadsheet,
} from "lucide-react";
import { PRODUCT_POSITIONING } from "@/lib/positioning";
import { ROUTES } from "@/lib/routes";

const PILLAR_ICONS = [
  <Trophy key="trophy" className="h-6 w-6 text-[#E8B923]" />,
  <ClipboardList key="tactics" className="h-6 w-6 text-[#10B981]" />,
  <CreditCard key="finance" className="h-6 w-6 text-[#3B82F6]" />,
  <MessageSquare key="comms" className="h-6 w-6 text-[#A855F7]" />,
];

const ONBOARDING_ICONS = [
  <FileSpreadsheet key="import" className="h-5 w-5 text-[#E8B923]" />,
  <Users key="config" className="h-5 w-5 text-[#10B981]" />,
  <Clock key="train" className="h-5 w-5 text-[#3B82F6]" />,
  <Headphones key="support" className="h-5 w-5 text-[#EC4899]" />,
];

export function ProductPositioning() {
  const {
    hero,
    avantVsAvec,
    pillars,
    onVousInstalle,
    vsTools,
    proof,
  } = PRODUCT_POSITIONING;

  return (
    <>
      {/* 1. HERO TAGLINE BANNER (Obsidian Minimalist) */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#050508] py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8B923]/30 bg-[#E8B923]/10 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#E8B923]" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8B923]">
              {hero.kicker}
            </span>
          </div>

          <h2 className="mt-8 font-display text-[clamp(2.2rem,5.5vw,3.8rem)] font-bold tracking-[-0.04em] text-white">
            {hero.tagline}
          </h2>
          <p className="mt-3 font-display text-[clamp(1.5rem,3.8vw,2.4rem)] font-medium tracking-[-0.03em] text-[#E8B923]">
            {hero.subtagline}
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {hero.body}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={ROUTES.proClub}
              className="inline-flex items-center gap-2 rounded-full bg-[#E8B923] px-7 py-3.5 text-[12px] font-bold uppercase tracking-[0.12em] text-black shadow-lg shadow-amber-500/20 transition hover:bg-[#d4a81c]"
            >
              Découvrir le Pôle Club
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#on-vous-installe"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md transition hover:bg-white/10"
            >
              Offre « On vous installe »
            </Link>
          </div>
        </div>
      </section>

      {/* 2. AVANT VS AVEC PRODAY (Obsidian Dual Comparison) */}
      <section className="relative border-t border-white/10 bg-[#08080C] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#E8B923]">
              {avantVsAvec.kicker}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {avantVsAvec.title}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
              {avantVsAvec.subtitle}
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* AVANT PRODAY */}
            <div className="relative overflow-hidden rounded-3xl border border-rose-950/40 bg-gradient-to-b from-[#14080A] to-[#0D0506] p-7 sm:p-9">
              <div className="flex items-center justify-between border-b border-rose-900/20 pb-5">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                    {avantVsAvec.columns.before.badge}
                  </span>
                  <h4 className="mt-1 font-display text-2xl font-bold text-white">
                    {avantVsAvec.columns.before.title}
                  </h4>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
                  <X className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {avantVsAvec.columns.before.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-2xl border border-rose-900/15 bg-black/25 p-4 transition"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                      <X className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-zinc-200">
                        {item.tool}
                      </h5>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {item.problem}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AVEC PRODAY */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#06170E] to-[#040C07] p-7 shadow-2xl shadow-emerald-950/40 sm:p-9">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-5">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                    {avantVsAvec.columns.after.badge}
                  </span>
                  <h4 className="mt-1 font-display text-2xl font-bold text-white">
                    {avantVsAvec.columns.after.title}
                  </h4>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                  <Check className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {avantVsAvec.columns.after.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-black/40 p-4 transition"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-white">
                        {item.feature}
                      </h5>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LES 4 PILIERS FONDAMENTAUX (Obsidian 4-Column Grid) */}
      <section className="relative border-t border-white/10 bg-[#050508] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#E8B923]">
              {pillars.kicker}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              {pillars.title}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
              {pillars.subtitle}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.items.map((pillar, idx) => (
              <div
                key={pillar.number}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0E0E14] p-6 transition-all duration-300 hover:border-white/20 hover:bg-[#12121A]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-zinc-500 group-hover:text-zinc-400">
                      {pillar.number}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-300">
                      {pillar.badge}
                    </span>
                  </div>

                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                    {PILLAR_ICONS[idx]}
                  </div>

                  <h4 className="mt-5 font-display text-lg font-bold text-white">
                    {pillar.title}
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {pillar.summary}
                  </p>
                </div>

                <div className="mt-6 border-t border-white/5 pt-5">
                  <ul className="space-y-2">
                    {pillar.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[11.5px] leading-snug text-zinc-300"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#E8B923]" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. OFFRE « ON VOUS INSTALLE » (Turnkey Onboarding Guarantee) */}
      <section
        id="on-vous-installe"
        className="relative scroll-mt-10 border-t border-white/10 bg-gradient-to-b from-[#090A10] to-[#040407] py-20 text-white sm:py-28"
      >
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#E8B923]/30 bg-gradient-to-br from-[#121118] via-[#0E0D14] to-[#09090E] p-8 sm:p-12 shadow-2xl">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8B923]/40 bg-[#E8B923]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B923]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {onVousInstalle.kicker}
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] sm:text-3xl text-white">
                  {onVousInstalle.title}
                </h3>
                <p className="mt-2 font-display text-base sm:text-lg font-medium text-[#E8B923]">
                  {onVousInstalle.tagline}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href={ROUTES.clubDevis}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E8B923] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-black shadow-lg shadow-amber-500/20 transition hover:bg-[#d4a81c]"
                >
                  Demander l&apos;installation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-zinc-300">
              {onVousInstalle.lead}
            </p>

            {/* 4-Step Process Cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {onVousInstalle.steps.map((s, idx) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-bold text-white">
                      {s.step}
                    </span>
                    {ONBOARDING_ICONS[idx]}
                  </div>
                  <h5 className="mt-4 text-xs font-bold text-white">
                    {s.title}
                  </h5>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-zinc-400">
              <span>✓ Aucune compétence technique requise</span>
              <span>✓ Intégration Footclubs FFF directe</span>
              <span>✓ Opérationnel en 24h à 48h</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIFFÉRENCIATION VS TOOLS (Notion / Discord / ProDay) */}
      <section className="border-t border-[#052424]/10 bg-[#f3f2ec] py-20 text-[#052424] sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#052424]/40">
            {vsTools.kicker}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.035em]">
            {vsTools.title}
          </h2>
          <ul className="mt-12 space-y-8">
            {vsTools.items.map((item) => (
              <li
                key={item.name}
                className={
                  "border-l-2 pl-5 " +
                  (item.highlight
                    ? "border-[#E8B923]"
                    : "border-[#052424]/20")
                }
              >
                <p className="font-display text-xl font-medium tracking-[-0.02em]">
                  {item.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#052424]/70">
                  {item.role}
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#052424]/55">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. PREUVE DE VALEUR & ECOSYSTÈME */}
      <section className="border-t border-white/10 bg-black py-20 text-white sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            {proof.kicker}
          </p>
          <h3 className="mt-4 font-display text-2xl font-medium tracking-[-0.03em]">
            {proof.title}
          </h3>
          <ul className="mt-6 space-y-3">
            {proof.items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-white/75"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8B923]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-xl text-xs leading-relaxed text-white/40">
            {proof.disclaimer}
          </p>
          <Link
            href={ROUTES.features}
            className="mt-8 inline-flex text-sm font-semibold text-[#E8B923] underline-offset-2 hover:underline"
          >
            Voir comment ça s&apos;articule →
          </Link>
        </div>
      </section>
    </>
  );
}

const fs = require('fs');

// Fix SiteFooter.tsx
let footer = fs.readFileSync('website/src/components/SiteFooter.tsx', 'utf8');
footer = footer.replace(
  /\{EXPLORE\.map\(\(l\) => \(\n\s*<li key=\{l\.href\}>\n\s*<Link\n\s*href=\{l\.href === ROUTES\.pricing \? pricingHref : l\.href\}\n\s*className="text-sm text-white\/60 transition hover:text-\[var\(--proday-accent-bright\)\]"\n\s*>\n\s*\{l\.label\}\n\s*<\/Link>\n\s*<\/li>\n\s*\)\)\}/,
  `{EXPLORE.map((l) => {
    const finalHref = l.href === ROUTES.pricing ? pricingHref : l.href;
    const isExternal = finalHref.startsWith('http') || finalHref.startsWith('mailto:');
    
    if (isExternal) {
      return (
        <li key={l.href}>
          <a
            href={finalHref}
            className="text-sm text-white/60 transition hover:text-[var(--proday-accent-bright)]"
          >
            {l.label}
          </a>
        </li>
      );
    }
    
    return (
      <li key={l.href}>
        <Link
          href={finalHref}
          className="text-sm text-white/60 transition hover:text-[var(--proday-accent-bright)]"
        >
          {l.label}
        </Link>
      </li>
    );
  })}`
);
fs.writeFileSync('website/src/components/SiteFooter.tsx', footer);

// Fix TerminalCta.tsx
let cta = fs.readFileSync('website/src/components/terminal/TerminalCta.tsx', 'utf8');
cta = cta.replace(
  /<Link\n\s*href=\{primaryHref\}\n\s*className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3\.5 font-mono text-\[11px\] font-semibold uppercase tracking-\[0\.18em\] text-white transition hover:brightness-110"\n\s*>\n\s*\{primaryLabel\}\n\s*<\/Link>/,
  `{primaryHref.startsWith('mailto:') || primaryHref.startsWith('http') ? (
              <a
                href={primaryHref}
                className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110"
              >
                {primaryLabel}
              </a>
            ) : (
              <Link
                href={primaryHref}
                className="bg-accent-gradient inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110"
              >
                {primaryLabel}
              </Link>
            )}`
);

cta = cta.replace(
  /<Link\n\s*href=\{secondaryHref\}\n\s*className="inline-flex min-h-12 items-center justify-center rounded-full border border-white\/20 px-7 py-3\.5 font-mono text-\[11px\] uppercase tracking-\[0\.18em\] text-white\/70 transition hover:border-white\/45 hover:text-\[var\(--pole-accent,#F5D04A\)\]"\n\s*>\n\s*\{secondaryLabel\}\n\s*<\/Link>/,
  `{secondaryHref.startsWith('mailto:') || secondaryHref.startsWith('http') ? (
              <a
                href={secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/45 hover:text-[var(--pole-accent,#F5D04A)]"
              >
                {secondaryLabel}
              </a>
            ) : (
              <Link
                href={secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:border-white/45 hover:text-[var(--pole-accent,#F5D04A)]"
              >
                {secondaryLabel}
              </Link>
            )}`
);

fs.writeFileSync('website/src/components/terminal/TerminalCta.tsx', cta);

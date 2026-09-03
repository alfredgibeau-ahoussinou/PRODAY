const fs = require('fs');

let cta = fs.readFileSync('website/src/components/terminal/TerminalCta.tsx', 'utf8');
cta = cta.replace(
  /<a\n\s*href=\{primaryHref\}\n\s*className="bg-accent-gradient inline-flex/g,
  '<a\n                href={primaryHref}\n                target="_blank"\n                rel="noopener noreferrer"\n                className="bg-accent-gradient inline-flex'
);
fs.writeFileSync('website/src/components/terminal/TerminalCta.tsx', cta);

let footer = fs.readFileSync('website/src/components/SiteFooter.tsx', 'utf8');
footer = footer.replace(
  /<a\n\s*href=\{finalHref\}\n\s*className="text-sm text-white\/60 transition/g,
  '<a\n            href={finalHref}\n            target="_blank"\n            rel="noopener noreferrer"\n            className="text-sm text-white/60 transition'
);
fs.writeFileSync('website/src/components/SiteFooter.tsx', footer);

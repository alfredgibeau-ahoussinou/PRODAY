const fs = require('fs');
let cta = fs.readFileSync('website/src/components/terminal/TerminalCta.tsx', 'utf8');

cta = cta.replace(
  /\{\s*secondaryHref\.startsWith\('mailto:'\)/g,
  "secondaryHref.startsWith('mailto:')"
);

// also check if the closing bracket was there
cta = cta.replace(
  /<\/a>\n\s*\)\s*:\s*\(\n\s*<Link/g,
  "</a>\n            ) : (\n              <Link"
);

fs.writeFileSync('website/src/components/terminal/TerminalCta.tsx', cta);

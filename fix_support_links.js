const fs = require('fs');

let cta = fs.readFileSync('website/src/components/terminal/TerminalCta.tsx', 'utf8');
cta = cta.replace(/primaryHref="mailto:proday\.admin@gmail\.com"/, 'primaryHref="#support"');
// Note: actually TerminalCta takes props. I need to replace it in page.tsx!
fs.writeFileSync('website/src/components/terminal/TerminalCta.tsx', cta);

let page = fs.readFileSync('website/src/app/beta/inscription/page.tsx', 'utf8');
page = page.replace(/primaryHref="mailto:proday\.admin@gmail\.com"/, 'primaryHref="#support"');
fs.writeFileSync('website/src/app/beta/inscription/page.tsx', page);

let footer = fs.readFileSync('website/src/components/SiteFooter.tsx', 'utf8');
footer = footer.replace(/mailto:proday\.admin@gmail\.com/, '#support');
fs.writeFileSync('website/src/components/SiteFooter.tsx', footer);

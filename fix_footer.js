const fs = require('fs');
let file = fs.readFileSync('website/src/components/SiteFooter.tsx', 'utf8');

file = file.replace(
  /\{ href: ROUTES\.betaWaitlist, label: "Liste d'attente" \},/,
  `{ href: ROUTES.betaWaitlist, label: "Installer (Bêta)" },\n  { href: "mailto:proday.admin@gmail.com", label: "Signaler un problème (Admin)" },`
);

file = file.replace(
  /Rejoindre la bêta/g,
  "Installer (Bêta)"
);

fs.writeFileSync('website/src/components/SiteFooter.tsx', file);

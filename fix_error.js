const fs = require('fs');
let file = fs.readFileSync('website/src/app/api/support/route.ts', 'utf8');

file = file.replace(
  /error\.message/g,
  'error instanceof Error ? error.message : "Erreur inconnue"'
);

fs.writeFileSync('website/src/app/api/support/route.ts', file);

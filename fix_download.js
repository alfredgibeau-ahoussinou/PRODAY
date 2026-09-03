const fs = require('fs');
let file = fs.readFileSync('website/src/components/home/DownloadSection.tsx', 'utf8');

file = file.replace(
  /Bientôt sur iOS & Android/,
  "Disponible sur iOS & Android"
);

file = file.replace(
  /\{BETA_PITCH\.summary\}/g,
  "La version bêta est désormais ouverte à tous."
);

file = file.replace(
  /<p className="mt-2 text-sm leading-relaxed text-white\/45">\{BETA_PITCH\.delayNotice\}<\/p>/,
  ""
);

file = file.replace(
  /<p className="mt-2 text-sm text-white\/35">\{BETA_PITCH\.dailyUpdates\}<\/p>/,
  ""
);

fs.writeFileSync('website/src/components/home/DownloadSection.tsx', file);

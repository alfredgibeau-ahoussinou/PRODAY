const fs = require('fs');
let file = fs.readFileSync('website/src/components/beta/BetaWaitlistHero.tsx', 'utf8');

// Replace {BETA_PITCH.summary} with a new sentence
file = file.replace(
  /\{BETA_PITCH\.summary\}/,
  "Installe l'application directement. Gratuit pour la phase bêta."
);

// Remove delayNotice block entirely
file = file.replace(
  /<\s*motion\.p[^>]*>\s*\{BETA_PITCH\.delayNotice\}\s*<\/\s*motion\.p>/s,
  ""
);

// Replace "S'inscrire" with "Télécharger"
file = file.replace(
  /S&apos;inscrire/,
  "Télécharger l'app"
);

fs.writeFileSync('website/src/components/beta/BetaWaitlistHero.tsx', file);

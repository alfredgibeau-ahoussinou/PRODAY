const fs = require('fs');
let file = fs.readFileSync('website/src/lib/content.ts', 'utf8');

file = file.replace(
  /export const BETA_PITCH = \{[\s\S]*?\} as const;/m,
  `export const BETA_PITCH = {
  summary: "Rejoignez la version bêta de ProDay sur iOS et Android.",
  dailyUpdates: "",
  launch: "",
  iosLaunchLabel: "",
  delayNotice: ""
} as const;`
);

fs.writeFileSync('website/src/lib/content.ts', file);

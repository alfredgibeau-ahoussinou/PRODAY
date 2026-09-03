const { readFileSync } = require('fs');
const content = readFileSync('website/src/lib/prodayCards.ts', 'utf8');
const demoCardsMatch = content.match(/export const DEMO_CARDS: ProDayCardData\[\] = \[([^\]]+)\];/s);
if (demoCardsMatch) {
  console.log(demoCardsMatch[1].trim());
} else {
  console.log("Not found");
}

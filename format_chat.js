const fs = require('fs');

let file = fs.readFileSync('src/components/coach/ai/CoachAiFreeChat.tsx', 'utf8');

file = file.replace(/{m\.content}/g, '{m.content.replace(/(^|\\n)\\s*[-*]\\s/g, "$1• ")}');

fs.writeFileSync('src/components/coach/ai/CoachAiFreeChat.tsx', file);

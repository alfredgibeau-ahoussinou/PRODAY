const fs = require('fs');

let file = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');

// fix import
if (!file.includes('useCoachShellNav')) {
  file = file.replace(/import \{ useTabNavigation \} from '\.\.\/\.\.\/context\/TabNavigationContext';/, "import { useTabNavigation } from '../../context/TabNavigationContext';\nimport { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';");
}

// fix kind
file = file.replace(/nextEvent\.kind === 'match'/g, '(nextEvent.title || "").toLowerCase().includes("match")');

fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file);

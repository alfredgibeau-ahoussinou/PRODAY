const fs = require('fs');

// CoachCockpitChapter
let file1 = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');
file1 = file1.replace(/profile\?\.name\?\.split\(' '\)\[0\]/g, 'profile?.firstName');
file1 = file1.replace(/nextEvent\.kind === 'match'/g, '(nextEvent.title || "").toLowerCase().includes("match")');
// Add missing import
if (!file1.includes('useCoachShellNav')) {
  file1 = file1.replace(/import \{ useTabNavigation \} from '\.\.\/\.\.\/context\/TabNavigationContext';/, "import { useTabNavigation } from '../../context/TabNavigationContext';\nimport { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';");
}
fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file1);

// ClubHomeScreen
let file2 = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');
file2 = file2.replace(/greetingForHour\(new Date\(\)\)/g, 'greetingForHour(new Date().getHours())');
file2 = file2.replace(/profile\?\.name\?\.split\(" "\)\[0\]/g, 'profile?.firstName');
fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', file2);

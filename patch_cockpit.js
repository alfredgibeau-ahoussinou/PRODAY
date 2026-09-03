const fs = require('fs');
let file = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');

// 1. unreadMessages -> count
file = file.replace(/const { unreadMessages } = useUnreadMessageCount\(\);/g, 'const { count: unreadMessages } = useUnreadMessageCount();');

// 2. tabNav.openCoachNav -> openNav (but wait, what is the right method? It's openHub or just use navigation)
// Looking at original CoachCockpitChapter: it used `const { requestNav: openNav } = useCoachShellNav() || {};`
// Let's add useCoachShellNav
file = file.replace(/const tabNav = useTabNavigation\(\);/g, 'const tabNav = useTabNavigation();\n  const shellNav = useCoachShellNav();');
file = file.replace(/tabNav\.openCoachNav/g, 'shellNav?.requestNav');

// 3. profile?.lastName -> profile?.name
file = file.replace(/Bonjour Coach \{profile\?\.lastName\}/g, 'Bonjour Coach {profile?.name?.split(\' \')[0]}');

// 4. TeamEvent kind -> we just assume match if title contains 'Match', or we just don't conditionally style.
file = file.replace(/nextEvent\.kind === 'match'/g, '(nextEvent.title || "").toLowerCase().includes("match")');

fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file);

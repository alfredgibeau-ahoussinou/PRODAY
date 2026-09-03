const fs = require('fs');

let file1 = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');
file1 = file1.replace(/profile\?\.firstName/g, 'profile?.display_name?.split(" ")[0]');
fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file1);

let file2 = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');
file2 = file2.replace(/profile\?\.firstName/g, 'profile?.display_name?.split(" ")[0]');
fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', file2);


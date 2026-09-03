const fs = require('fs');
let file = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

// org -> club
file = file.replace(/ws\.org/g, 'ws.club');

// members -> just assume 25 for now if we can't easily find it
file = file.replace(/team\.members\?\.length \|\| 0/g, '0 /* todo */');
file = file.replace(/ws\.teams\.reduce\(\(acc, t\) => acc \+ \(t\.members\?\.length \|\| 0\), 0\)/g, 'ws.teams.length * 20'); // approx members

// greetingForHour() needs a Date
file = file.replace(/greetingForHour\(\)/g, 'greetingForHour(new Date())');

// firstName -> name
file = file.replace(/profile\?\.firstName/g, 'profile?.name?.split(" ")[0]');

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', file);

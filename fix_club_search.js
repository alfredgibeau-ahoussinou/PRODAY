const fs = require('fs');

let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

// I will just replace the messed up closing tags
club = club.replace(/            <\/>\n        \)\} \n      <\/ScrollView>\n        <\/View>\n\n        <\/>\n        \)\} \n      <\/ScrollView>/g, `          </>\n        )} \n      </ScrollView>`);

// Also fix TournamentLiveScreen.tsx
let tourney = fs.readFileSync('src/screens/competition/TournamentLiveScreen.tsx', 'utf8');
tourney = tourney.replace(/<ProDayText variant="body">{" "}<\/ProDayText>/g, '<ProDayText variant="body"> - </ProDayText>');
// The user doesn't mind the minus if it's normal text, or I can replace it with " à " but without weird tag stuff.
tourney = tourney.replace(/<ProDayText variant="body"> - <\/ProDayText>/g, '<ProDayText variant="body"> à </ProDayText>');

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);
fs.writeFileSync('src/screens/competition/TournamentLiveScreen.tsx', tourney);

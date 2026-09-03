const fs = require('fs');
let tourney = fs.readFileSync('src/screens/competition/TournamentLiveScreen.tsx', 'utf8');
tourney = tourney.replace(/<ProDayText variant="body">> <\/ProDayText>/g, '<ProDayText variant="body"> à </ProDayText>');
fs.writeFileSync('src/screens/competition/TournamentLiveScreen.tsx', tourney);

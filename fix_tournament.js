const fs = require('fs');
let file = fs.readFileSync('src/screens/competition/TournamentLiveScreen.tsx', 'utf8');
file = file.replace(/<ProDayText variant="body">> <\/ProDayText>/g, '<ProDayText variant="body"> </ProDayText>');
fs.writeFileSync('src/screens/competition/TournamentLiveScreen.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

const target = `  const showCategories =
    eventType !== 'meeting' &&
    (eventType === 'detection' || Boolean(profile?.profile.club_id));`;

const replacement = `  const showCategories = eventType === 'detection';`;

file = file.replace(target, replacement);
fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/components/coach/ai/CoachAiTrainingGen.tsx', 'utf8');

file = file.replace(/profile\.club_id/g, 'profile.profile.club_id');
file = file.replace(/profile\.firstName/g, 'profile.display_name');
file = file.replace(/profile\.lastName/g, '""');

fs.writeFileSync('src/components/coach/ai/CoachAiTrainingGen.tsx', file);

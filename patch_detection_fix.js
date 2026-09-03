const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

const targetConvocCard = `<CoachSectionCard
            kicker="PARTICIPANTS"
            title={eventType === 'training' ? "Groupes convoqués" : "Joueurs convoqués"}
          >
            {convocationSection}
          </CoachSectionCard>`;

const newConvocCard = `{eventType !== 'detection' ? (
          <CoachSectionCard
            kicker="PARTICIPANTS"
            title={eventType === 'training' ? "Groupes convoqués" : "Joueurs convoqués"}
          >
            {convocationSection}
          </CoachSectionCard>
          ) : null}`;
file = file.replace(targetConvocCard, newConvocCard);
fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);

const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');

// 1. Fix showCategories to ONLY be true for detection
file = file.replace(/const showCategories =\s*eventType !== 'meeting' &&\s*\(eventType === 'detection' || Boolean\(profile\?\.profile\.club_id\)\);/, `const showCategories = eventType === 'detection';`);

// 2. Remove the duplicated maxParticipants from the categorySection
const targetDup = `{eventType === 'detection' ? (
                <CoachFormField
                  placeholder={t('coach.event.create.maxPlacesPlaceholder')}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  tokens={tokens}
                  keyboardType="number-pad"
                />
              ) : null}`;
file = file.replace(targetDup, ``);

// 3. Hide convocationSection for detection
const targetConvocCard = `<CoachSectionCard
            kicker={t('coach.event.create.convocKicker')}
            title={t('coach.event.create.convocTitle')}
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

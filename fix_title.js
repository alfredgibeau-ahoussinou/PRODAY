const fs = require('fs');
let file = fs.readFileSync('src/screens/CreateTeamEventScreen.tsx', 'utf8');
const target = `              title={
                eventType === 'detection'
                  ? t('coach.event.create.categoriesDetectionTitle')
                  : t('coach.event.create.categoriesConvocTitle')
              }`;
file = file.replace(target, `title="Catégories ciblées (Optionnel)"`);
fs.writeFileSync('src/screens/CreateTeamEventScreen.tsx', file);

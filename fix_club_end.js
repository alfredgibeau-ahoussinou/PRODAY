const fs = require('fs');
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

club = club.replace(/            \)\}\)\}\n            <\/>\n        \)\} \n      <\/ScrollView>\n        <\/View>\n\n      <\/ScrollView>/g, `            ))}\n          </ScrollView>\n        </View>\n\n        </>\n        )}\n      </ScrollView>`);

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);

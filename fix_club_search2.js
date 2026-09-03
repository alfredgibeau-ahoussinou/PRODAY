const fs = require('fs');
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

club = club.replace(/            \)\}\)\}\n          <\/>\n        \)\} \n      <\/ScrollView>\n    <\/View>/g, `            ))}\n          </ScrollView>\n        </View>\n        </>\n      )} \n      </ScrollView>\n    </View>`);

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);

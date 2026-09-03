const fs = require('fs');
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

// Fix duplicate useMemo and missing useState
club = club.replace(/import React, { useMemo,  { useMemo, /g, "import React, { useMemo, useState, ");
club = club.replace(/import React, { useMemo,  /g, "import React, { useMemo, useState, ");

// Fix icon names
club = club.replace(/name="close-circle"/g, 'name="close"');
club = club.replace(/name="shield-half"/g, 'name="shield"');

// Fix ProDayText -> ClubText
club = club.replace(/<ProDayText/g, '<ClubText');
club = club.replace(/<\/ProDayText>/g, '</ClubText>');

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);

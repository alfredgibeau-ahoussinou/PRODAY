const fs = require('fs');
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

club = club.replace(/import React, \{ useMemo, useMemo \} from 'react';/, "import React, { useMemo, useState } from 'react';");

const searchLogic = `
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const foundTeams = ws.teams.filter(t => t.name?.toLowerCase().includes(q));
    return { teams: foundTeams };
  }, [searchQuery, ws.teams]);
`;

club = club.replace(/const totalMembers = ws\.teams\.length \* 20;/, searchLogic + '\n  const totalMembers = ws.teams.length * 20;');

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);

const fs = require('fs');

let file = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');

// Add state for search
file = file.replace(/const ws = useClubWorkspace\(\);/g, `const ws = useClubWorkspace();\n  const [searchQuery, setSearchQuery] = useState('');`);

if (!file.includes('useState')) {
  file = file.replace(/import React from 'react';/, "import React, { useState, useMemo } from 'react';");
} else {
  file = file.replace(/import React, \{ /, "import React, { useMemo, ");
}

// Update TextInput to bind to state
const oldSearchInput = `<TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher (joueurs, entraîneurs, équipes)..."
            placeholderTextColor={tokens.muted}
          />`;

const newSearchInput = `<TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher (joueurs, entraîneurs, équipes)..."
            placeholderTextColor={tokens.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <PressableSpring onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={tokens.muted} />
            </PressableSpring>
          )}`;

file = file.replace(oldSearchInput, newSearchInput);

// Compute search results
const searchLogic = `
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const foundTeams = ws.teams.filter(t => t.name?.toLowerCase().includes(q));
    // Since we don't have members list easily in club home right now, just filter teams
    return { teams: foundTeams };
  }, [searchQuery, ws.teams]);
`;

file = file.replace(/const totalPlayers =/g, searchLogic + '\n  const totalPlayers =');

// Conditional render of results
const oldScrollViewContent = `{/* Header Hero */}`;

const newScrollViewContent = `{searchResults ? (
          <View style={styles.searchResults}>
            {searchResults.teams.length === 0 ? (
              <ProDayText style={{ color: tokens.muted, textAlign: 'center', marginTop: spacing.xl }}>Aucun résultat trouvé.</ProDayText>
            ) : null}
            
            {searchResults.teams.length > 0 && (
              <View style={styles.resultSection}>
                <ProDayText style={[styles.sectionTitle, { color: tokens.foreground }]}>Équipes</ProDayText>
                {searchResults.teams.map(t => (
                  <PressableSpring 
                    key={t.id} 
                    style={[styles.resultItem, { borderColor: tokens.border }]} 
                    onPress={() => nav.navigate('ClubTeamDashboard', { teamId: t.id })}
                  >
                    <Icon name="shield-half" size={20} color={tokens.accent} />
                    <ProDayText style={{ color: tokens.foreground, marginLeft: spacing.sm }}>{t.name}</ProDayText>
                  </PressableSpring>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Header Hero */}`;

file = file.replace(oldScrollViewContent, newScrollViewContent);

// Close the fragment at the end of the scrollview
file = file.replace(/<\/ScrollView>/g, `  </>\n        )} \n      </ScrollView>`);

// Add styles
file = file.replace(/searchBar: \{/g, `resultSection: { marginTop: spacing.lg },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  searchResults: { flex: 1, paddingBottom: 40 },
  searchBar: {`);

fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', file);

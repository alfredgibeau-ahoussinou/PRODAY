const fs = require('fs');

let file = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');

// Add state for search
file = file.replace(/const { unreadMessages } = useUnreadMessageCount\(\);/g, `const { count: unreadMessages } = useUnreadMessageCount();
  const [searchQuery, setSearchQuery] = useState('');`);

file = file.replace(/import React, { useMemo } from 'react';/, "import React, { useMemo, useState } from 'react';");

// Update TextInput to bind to state
const oldSearchInput = `<TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher un joueur, un match..."
            placeholderTextColor={tokens.muted}
          />`;

const newSearchInput = `<TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher un joueur, un match..."
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
    const foundMembers = members.filter(m => m.display_name?.toLowerCase().includes(q));
    const foundEvents = events.filter(e => e.title?.toLowerCase().includes(q));
    return { members: foundMembers, events: foundEvents };
  }, [searchQuery, members, events]);
`;

file = file.replace(/const nextEvent = events\.find/g, searchLogic + '\n  const nextEvent = events.find');

// Conditional render of results
const oldScrollViewContent = `{/* Welcome Section */}`;

const newScrollViewContent = `{searchResults ? (
          <View style={styles.searchResults}>
            {searchResults.members.length === 0 && searchResults.events.length === 0 ? (
              <CoachText style={{ color: tokens.muted, textAlign: 'center', marginTop: spacing.xl }}>Aucun résultat trouvé.</CoachText>
            ) : null}
            
            {searchResults.members.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Joueurs & Staff</CoachText>
                {searchResults.members.map(m => (
                  <PressableSpring key={m.uid} style={[styles.resultItem, { borderColor: tokens.border }]} onPress={() => {}}>
                    <Icon name="person" size={20} color={tokens.accent} />
                    <CoachText style={{ color: tokens.foreground, marginLeft: spacing.sm }}>{m.display_name}</CoachText>
                  </PressableSpring>
                ))}
              </View>
            )}

            {searchResults.events.length > 0 && (
              <View style={styles.resultSection}>
                <CoachText style={[styles.sectionTitle, { color: tokens.foreground }]}>Événements</CoachText>
                {searchResults.events.map(e => (
                  <PressableSpring 
                    key={e.id} 
                    style={[styles.resultItem, { borderColor: tokens.border }]} 
                    onPress={() => tabNav.openMatchs({ eventId: e.id })}
                  >
                    <Icon name="calendar" size={20} color={tokens.accent} />
                    <CoachText style={{ color: tokens.foreground, marginLeft: spacing.sm }}>{e.title} - {formatCalendarDate(e.starts_at)}</CoachText>
                  </PressableSpring>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Welcome Section */}`;

file = file.replace(oldScrollViewContent, newScrollViewContent);

// Close the fragment at the end of the scrollview
file = file.replace(/<\/ScrollView>/g, `  </>\n        )} \n      </ScrollView>`);

// Add styles
file = file.replace(/searchBar: \{/g, `resultSection: { marginTop: spacing.lg },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  searchResults: { flex: 1 },
  searchBar: {`);

fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', file);

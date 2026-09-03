const fs = require('fs');

// 1. Add Search Bar to CoachCockpitChapter
let coach = fs.readFileSync('src/components/coach/CoachCockpitChapter.tsx', 'utf8');
if (!coach.includes('placeholder="Rechercher un joueur, un match..."')) {
  const searchBarUi = `
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Icon name="search" size={20} color={tokens.muted} />
          <TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher un joueur, un match..."
            placeholderTextColor={tokens.muted}
          />
        </View>
  `;
  coach = coach.replace('{/* Welcome Section */}', searchBarUi + '\n        {/* Welcome Section */}');
  coach = coach.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({\n  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, height: 48, borderRadius: radius.pill, borderWidth: 1, marginBottom: spacing.md },\n  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15 },');
  fs.writeFileSync('src/components/coach/CoachCockpitChapter.tsx', coach);
}

// 2. Add Search Bar to ClubHomeScreen
let club = fs.readFileSync('src/screens/club/ClubHomeScreen.tsx', 'utf8');
if (!club.includes('placeholder="Rechercher (joueurs, entraîneurs, équipes)..."')) {
  const searchBarUi = `
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Icon name="search" size={20} color={tokens.muted} />
          <TextInput
            style={[styles.searchInput, { color: tokens.foreground }]}
            placeholder="Rechercher (joueurs, entraîneurs, équipes)..."
            placeholderTextColor={tokens.muted}
          />
        </View>
  `;
  club = club.replace('{/* Header Hero */}', searchBarUi + '\n        {/* Header Hero */}');
  
  if (!club.includes('import { TextInput } from')) {
     club = club.replace('import { StyleSheet, View, ScrollView } from \'react-native\';', 'import { StyleSheet, View, ScrollView, TextInput } from \'react-native\';');
  }

  club = club.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({\n  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, height: 48, borderRadius: radius.pill, borderWidth: 1, marginTop: spacing.md },\n  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15 },');
  fs.writeFileSync('src/screens/club/ClubHomeScreen.tsx', club);
}

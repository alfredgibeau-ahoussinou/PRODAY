const fs = require('fs');

let file = fs.readFileSync('src/components/carpool/CarpoolHomeScreen.tsx', 'utf8');

const anchor = `<ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {...scrollProps}>`;

const replacement = `<ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {...scrollProps}>
      {/* UBER STYLE SEARCH BANNER */}
      <View style={[styles.uberSearchBlock, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.uberSearchTitle, { color: palette.foreground }]}>Où allez-vous ?</Text>
        <View style={[styles.uberInputRow, { backgroundColor: palette.bg }]}>
          <Icon name="search" size={20} color={palette.foreground} />
          <TextInput 
            style={[styles.uberInput, { color: palette.foreground }]} 
            placeholder="Stade, club, match..." 
            placeholderTextColor={palette.foreground + '88'} 
          />
        </View>
        <View style={styles.uberQuickChips}>
          {["Prochain match", "Entraînement", "Domicile"].map((chip) => (
            <View key={chip} style={[styles.uberChip, { backgroundColor: palette.bg, borderColor: palette.border }]}>
              <Text style={[styles.uberChipText, { color: palette.foreground }]}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>
`;

file = file.replace(anchor, replacement);

const stylesAnchor = `modeTitle: {`;
const stylesReplacement = `  uberSearchBlock: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  uberSearchTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  uberInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  uberInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  uberQuickChips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  uberChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  uberChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modeTitle: {`;

file = file.replace(stylesAnchor, stylesReplacement);

fs.writeFileSync('src/components/carpool/CarpoolHomeScreen.tsx', file);

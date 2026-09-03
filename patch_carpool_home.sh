#!/bin/bash

# Add the Uber-style search bar in renderRide()
sed -i '' '/const renderRide = () => (/a\
  <ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {...scrollProps}>\
    {/* UBER STYLE SEARCH BANNER */}\
    <View style={[styles.uberSearchBlock, { backgroundColor: palette.surface, borderColor: palette.border }]}>\
      <Text style={[styles.uberSearchTitle, { color: palette.foreground }]}>Où allez-vous ?</Text>\
      <View style={[styles.uberInputRow, { backgroundColor: palette.bg }]}>\
        <Icon name="search" size={20} color={palette.foreground} />\
        <TextInput \
          style={[styles.uberInput, { color: palette.foreground }]} \
          placeholder="Rechercher un stade, un club, un match..." \
          placeholderTextColor={palette.foregroundMuted || "gray"} \
        />\
      </View>\
      <View style={styles.uberQuickChips}>\
        {["Prochain match", "Entraînement", "Domicile"].map((chip) => (\
          <View key={chip} style={[styles.uberChip, { backgroundColor: palette.bg, borderColor: palette.border }]}>\
            <Text style={[styles.uberChipText, { color: palette.foreground }]}>{chip}</Text>\
          </View>\
        ))}\
      </View>\
    </View>\
' src/components/carpool/CarpoolHomeScreen.tsx

# Remove the original <ScrollView> tag that we duplicated
sed -i '' 's/<ScrollView contentContainerStyle={pagePad} refreshControl={refreshControl} {\.\.\.scrollProps}>//' src/components/carpool/CarpoolHomeScreen.tsx

# Add styles for Uber block
sed -i '' '/modeTitle: {/i\
  uberSearchBlock: {\
    padding: spacing.md,\
    borderRadius: radius.lg,\
    borderWidth: 1,\
    marginBottom: spacing.md,\
  },\
  uberSearchTitle: {\
    fontSize: 22,\
    fontWeight: "800",\
    marginBottom: spacing.md,\
  },\
  uberInputRow: {\
    flexDirection: "row",\
    alignItems: "center",\
    paddingHorizontal: spacing.md,\
    height: 48,\
    borderRadius: radius.md,\
    marginBottom: spacing.md,\
  },\
  uberInput: {\
    flex: 1,\
    marginLeft: spacing.sm,\
    fontSize: 16,\
  },\
  uberQuickChips: {\
    flexDirection: "row",\
    gap: spacing.sm,\
  },\
  uberChip: {\
    paddingHorizontal: spacing.sm,\
    paddingVertical: 6,\
    borderRadius: radius.pill,\
    borderWidth: 1,\
  },\
  uberChipText: {\
    fontSize: 12,\
    fontWeight: "600",\
  },\
' src/components/carpool/CarpoolHomeScreen.tsx


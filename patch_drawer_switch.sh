#!/bin/bash

# Add Switch import
sed -i '' 's/KeyboardAvoidingView,/KeyboardAvoidingView,\
  Switch,/g' src/components/coach/FederationSyncDrawer.tsx

# Add autoSync state
sed -i '' '/const \[selectedTeam, setSelectedTeam\] = useState<FederationTeam | null>(null);/a\
  const [autoSync, setAutoSync] = useState(true);
' src/components/coach/FederationSyncDrawer.tsx

# Add the Switch UI before the footer
sed -i '' '/<View style={\[styles.footer/i\
          {selectedTeam && (\
            <View style={styles.autoSyncContainer}>\
              <View style={styles.autoSyncText}>\
                <CoachText style={[styles.autoSyncTitle, { color: tokens.foreground }]}>\
                  Synchronisation automatique\
                </CoachText>\
                <CoachText style={[styles.autoSyncDesc, { color: tokens.muted }]}>\
                  Actualiser les scores et reports de matchs chaque semaine.\
                </CoachText>\
              </View>\
              <Switch\
                value={autoSync}\
                onValueChange={setAutoSync}\
                trackColor={{ false: tokens.border, true: tokens.accent }}\
              />\
            </View>\
          )}\
' src/components/coach/FederationSyncDrawer.tsx

# Add styles for autoSync
sed -i '' '/footer: {/i\
  autoSyncContainer: {\
    flexDirection: "row",\
    alignItems: "center",\
    justifyContent: "space-between",\
    paddingVertical: spacing.md,\
    marginTop: spacing.sm,\
    borderTopWidth: 1,\
    borderTopColor: "rgba(255,255,255,0.05)",\
  },\
  autoSyncText: {\
    flex: 1,\
    paddingRight: spacing.md,\
  },\
  autoSyncTitle: {\
    fontSize: 14,\
    fontWeight: "700",\
    marginBottom: 4,\
  },\
  autoSyncDesc: {\
    fontSize: 12,\
  },\
' src/components/coach/FederationSyncDrawer.tsx


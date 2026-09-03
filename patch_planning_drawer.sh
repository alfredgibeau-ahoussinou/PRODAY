#!/bin/bash

# Insert Drawer at the end of return
sed -i '' '/<\/CoachChapterScroll>/i\
\
      <FederationSyncDrawer\
        visible={syncDrawerVisible}\
        onClose={() => setSyncDrawerVisible(false)}\
        localTeamId={activeTeamId || ""}\
        onSyncStarted={async () => {\
          setIsSyncing(true);\
          await federationService.triggerSync("fed-123", activeTeamId || "");\
          setIsSyncing(false);\
          Alert.alert("Succès", "Vos événements ont été importés avec succès !");\
        }}\
      />\
' src/components/coach/CoachPlanningChapter.tsx

# Insert style
sed -i '' '/bulkReminderBanner: {/i\
    syncBtnBanner: {\
      flexDirection: "row",\
      alignItems: "center",\
      justifyContent: "space-between",\
      marginHorizontal: spacing.md,\
      marginBottom: spacing.sm,\
      padding: spacing.sm,\
      borderRadius: 14,\
      borderWidth: 1,\
      borderColor: tokens.border,\
      gap: spacing.sm,\
    },\
' src/components/coach/CoachPlanningChapter.tsx


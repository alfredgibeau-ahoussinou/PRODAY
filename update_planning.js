const fs = require('fs');

let file = fs.readFileSync('src/components/coach/CoachPlanningChapter.tsx', 'utf8');

// The Drawer usage was previously:
/*
      <FederationSyncDrawer
        visible={syncDrawerVisible}
        onClose={() => setSyncDrawerVisible(false)}
        localTeamId={activeTeamId || ""}
        onSyncStarted={async (teamName?: string) => {
          setIsSyncing(true);
          await federationService.triggerSync("fed-123", activeTeamId || "");
          if (teamName) setSyncedTeamName(teamName);
          setHasSynced(true);
          setIsSyncing(false);
          Alert.alert("Succès", "Vos événements ont été importés avec succès !");
        }}
      />
*/

// I need to change it to use onSyncComplete: (clubName: string) => void
const oldDrawerMatch = /<FederationSyncDrawer[^>]*\/>/g;
const newDrawer = `<FederationSyncDrawer
        visible={syncDrawerVisible}
        onClose={() => setSyncDrawerVisible(false)}
        onSyncComplete={(clubName) => {
          setSyncedTeamName(clubName);
          setHasSynced(true);
        }}
      />`;

// Wait, the regex might not match multiline perfectly if I just do /.../g.
// Let's do a replace manually or with string replace.

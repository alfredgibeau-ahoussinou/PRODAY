const fs = require('fs');

let file = fs.readFileSync('src/components/coach/CoachPlanningChapter.tsx', 'utf8');

const oldLogic = `{isSyncing ? (
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.accent }]}>
            <View style={styles.bulkReminderInfo}>
              <ActivityIndicator size="small" color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchronisation en cours...
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupération des matchs officiels
                </CoachText>
              </View>
            </View>
          </View>
        ) : (
          <PressableSpring
            onPress={() => setSyncDrawerVisible(true)}
            scaleTo={0.96}
            haptic
            style={styles.syncBtnBanner}
          >
            <View style={styles.bulkReminderInfo}>
              <Icon name="calendar" size={18} color={tokens.foreground} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchroniser les rencontres
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupérez vos matchs officiels (FFF, etc.)
                </CoachText>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.muted} />
          </PressableSpring>
        )}`;

const newLogic = `{isSyncing ? (
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.accent }]}>
            <View style={styles.bulkReminderInfo}>
              <ActivityIndicator size="small" color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchronisation en cours...
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupération des données officielles
                </CoachText>
              </View>
            </View>
          </View>
        ) : hasSynced ? (
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
            <View style={styles.bulkReminderInfo}>
              <Icon name="checkmark-circle" size={18} color={tokens.accent} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  {syncedTeamName || "Championnat lié"}
                </CoachText>
                <CoachText variant="caption" muted>
                  Mise à jour auto. activée
                </CoachText>
              </View>
            </View>
            <PressableSpring
              onPress={async () => {
                setIsSyncing(true);
                await federationService.triggerSync("fed-123", activeTeamId || "");
                setIsSyncing(false);
              }}
              scaleTo={0.96}
              haptic
              style={[styles.bulkReminderBtn, { backgroundColor: tokens.border }]}
            >
              <CoachText variant="caption" style={{ color: tokens.foreground, fontWeight: "600" }}>
                Actualiser
              </CoachText>
            </PressableSpring>
          </View>
        ) : (
          <PressableSpring
            onPress={() => setSyncDrawerVisible(true)}
            scaleTo={0.96}
            haptic
            style={styles.syncBtnBanner}
          >
            <View style={styles.bulkReminderInfo}>
              <Icon name="calendar" size={18} color={tokens.foreground} />
              <View style={{ flex: 1 }}>
                <CoachText variant="section" style={styles.bulkReminderTitle}>
                  Synchroniser les rencontres
                </CoachText>
                <CoachText variant="caption" muted>
                  Récupérez vos matchs officiels (FFF, etc.)
                </CoachText>
              </View>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.muted} />
          </PressableSpring>
        )}`;

file = file.replace(oldLogic, newLogic);

// Modify onSyncStarted in drawer to set hasSynced
const oldDrawer = `onSyncStarted={async () => {
          setIsSyncing(true);
          await federationService.triggerSync("fed-123", activeTeamId || "");
          setIsSyncing(false);
          Alert.alert("Succès", "Vos événements ont été importés avec succès !");
        }}`;

const newDrawer = `onSyncStarted={async (teamName?: string) => {
          setIsSyncing(true);
          await federationService.triggerSync("fed-123", activeTeamId || "");
          if (teamName) setSyncedTeamName(teamName);
          setHasSynced(true);
          setIsSyncing(false);
          Alert.alert("Succès", "Vos événements ont été importés avec succès !");
        }}`;

file = file.replace(oldDrawer, newDrawer);

fs.writeFileSync('src/components/coach/CoachPlanningChapter.tsx', file);

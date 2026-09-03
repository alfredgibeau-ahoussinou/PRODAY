#!/bin/bash

sed -i '' '/<CoachTeamSwitcher \/>/a\
\
        {isSyncing ? (\
          <View style={[styles.bulkReminderBanner, { borderColor: tokens.accent }]}>\
            <View style={styles.bulkReminderInfo}>\
              <ActivityIndicator size="small" color={tokens.accent} />\
              <View style={{ flex: 1 }}>\
                <CoachText variant="section" style={styles.bulkReminderTitle}>\
                  Synchronisation en cours...\
                </CoachText>\
                <CoachText variant="caption" muted>\
                  Récupération des matchs officiels\
                </CoachText>\
              </View>\
            </View>\
          </View>\
        ) : (\
          <PressableSpring\
            onPress={() => setSyncDrawerVisible(true)}\
            scaleTo={0.96}\
            haptic\
            style={styles.syncBtnBanner}\
          >\
            <View style={styles.bulkReminderInfo}>\
              <Icon name="calendar" size={18} color={tokens.foreground} />\
              <View style={{ flex: 1 }}>\
                <CoachText variant="section" style={styles.bulkReminderTitle}>\
                  Synchroniser les rencontres\
                </CoachText>\
                <CoachText variant="caption" muted>\
                  Récupérez vos matchs officiels (FFF, etc.)\
                </CoachText>\
              </View>\
            </View>\
            <Icon name="chevron-right" size={16} color={tokens.foregroundMuted} />\
          </PressableSpring>\
        )}\
' src/components/coach/CoachPlanningChapter.tsx


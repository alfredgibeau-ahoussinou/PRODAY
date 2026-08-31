import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CoachChapterScroll, CoachSettingsGroup, CoachSettingsRow } from '../../../components/coach/coachPortalUi';
import { CoachPane } from '../../../components/coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../../content/coachPageIdentity';
import { useCoachTheme } from './CoachThemeContext';
import type { CoachNavResolvedItem } from '../navigation/resolveCoachNavAccess';
import { useCoachShellNav } from './CoachShellNavContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { coachingSessionsService } from '../../../services/homeTraining.service';
import type { CoachSessionBooking } from '../../../models/HomeTraining';
import { spacing } from '../../../theme/designTokens';

type Props = {
  items: CoachNavResolvedItem[];
};

/** @deprecated Remplacé par CoachMenuPane — conserve un raccourci Coaching perso. */
export function CoachMorePane({ items }: Props) {
  const shellNav = useCoachShellNav();
  const profile = useSessionProfile();
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [sessionRequests, setSessionRequests] = useState<CoachSessionBooking[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;
    void coachingSessionsService.listForCoach(profile.uid).then((rows) => {
      setSessionRequests(rows.filter((b) => b.status === 'requested').slice(0, 8));
    });
  }, [profile?.uid]);

  const tools = items.filter((item) => item.id !== 'profil');
  const account = items.filter((item) => item.id === 'profil');

  return (
    <CoachPane title={getCoachPageIdentity('plus').title}>
      <CoachChapterScroll>
        <View style={styles.stack}>
          {tools.length > 0 ? (
            <CoachSettingsGroup>
              {tools.map((item, index) => (
                <CoachSettingsRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  locked={item.locked}
                  badge={item.aiBadge ? 'IA' : undefined}
                  last={index === tools.length - 1}
                  onPress={() => shellNav?.requestNav(item.id)}
                />
              ))}
            </CoachSettingsGroup>
          ) : null}

          {account.length > 0 ? (
            <CoachSettingsGroup>
              {account.map((item, index) => (
                <CoachSettingsRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  last={index === account.length - 1}
                  onPress={() => shellNav?.requestNav(item.id)}
                />
              ))}
            </CoachSettingsGroup>
          ) : null}

          {profile ? (
            <CoachSettingsGroup>
              <CoachSettingsRow
                icon="time"
                label={
                  sessionRequests.length > 0
                    ? `Coaching perso (${sessionRequests.length} demande${sessionRequests.length > 1 ? 's' : ''})`
                    : 'Coaching perso'
                }
                last
                onPress={() => shellNav?.requestNav('coaching_perso')}
              />
            </CoachSettingsGroup>
          ) : null}

          <CoachSettingsGroup>
            <CoachSettingsRow
              icon="help"
              label="Aide"
              onPress={() => shellNav?.openHelp?.()}
            />
            <CoachSettingsRow
              icon="person"
              label="Profil"
              onPress={() => shellNav?.requestNav('profil')}
            />
            <CoachSettingsRow
              icon="log-out"
              label="Se déconnecter"
              destructive
              last
              onPress={() => shellNav?.signOut?.()}
            />
          </CoachSettingsGroup>
        </View>
      </CoachChapterScroll>
    </CoachPane>
  );
}

function createStyles(tokens: { bg: string }) {
  return StyleSheet.create({
    stack: { gap: spacing.lg, paddingBottom: spacing.xl, backgroundColor: tokens.bg },
  });
}

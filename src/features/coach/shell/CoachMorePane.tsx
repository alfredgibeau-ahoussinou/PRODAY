import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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

  const openHourlySlots = async () => {
    if (!profile) return;
    try {
      await coachingSessionsService.upsertHourlyProfile({
        coach_uid: profile.uid,
        display_name: profile.display_name,
        bio: profile.profile.bio,
        specialties: profile.profile.specialties ?? [],
        age_categories: profile.profile.category ? [profile.profile.category] : [],
        positions_coached: [],
        city: profile.city ?? 'France',
        hourly_rate_eur: 30,
        club_id: profile.profile.club_id,
        available: true,
      });
      Alert.alert(
        'Créneaux ouverts',
        'Tu es visible dans Train Hub à 30 €/h. Modifie ton tarif plus tard dans ton profil.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    }
  };

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
                label="Coaching à l’heure"
                last={sessionRequests.length === 0}
                onPress={() => void openHourlySlots()}
              />
              {sessionRequests.map((b, index) => (
                <CoachSettingsRow
                  key={b.id}
                  icon="person"
                  label={`${b.player_name} · ${b.duration_min} min`}
                  last={index === sessionRequests.length - 1}
                  onPress={() => {
                    void coachingSessionsService.setStatus(b.id, 'accepted').then(() => {
                      setSessionRequests((prev) => prev.filter((x) => x.id !== b.id));
                      Alert.alert(
                        'Séance acceptée',
                        'Le joueur est notifié et peut payer la séance par carte.',
                      );
                    });
                  }}
                />
              ))}
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

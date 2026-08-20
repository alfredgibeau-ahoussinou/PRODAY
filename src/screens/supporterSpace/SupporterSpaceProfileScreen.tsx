import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import type { Follow } from '../../models/Follow';
import {
  DEFAULT_SUPPORTER_NOTIF_PREFS,
  loadSupporterNotificationPrefs,
  saveSupporterNotificationPrefs,
  type SupporterNotificationPreferences,
} from '../../services/supporterPreferences.service';
import { SpaceScreen, SpaceSection } from '../../features/supporterSpace/components';
import { SUPPORTER_SPACE } from '../../features/supporterSpace/theme/supporterSpaceTheme';

export const SupporterSpaceProfileScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifs, setNotifs] = useState<SupporterNotificationPreferences>(
    DEFAULT_SUPPORTER_NOTIF_PREFS,
  );

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService.listByFollower(profile.uid).then((list) => setFollows(list ?? []));
    void loadSupporterNotificationPrefs(profile.uid).then(setNotifs);
  }, [profile?.uid]);

  const updateNotif = useCallback(
    async (key: keyof SupporterNotificationPreferences, value: boolean) => {
      if (!profile?.uid) return;
      const next = { ...notifs, [key]: value };
      setNotifs(next);
      await saveSupporterNotificationPrefs(profile.uid, next);
    },
    [notifs, profile?.uid],
  );

  return (
    <SpaceScreen>
      <ProDayText variant="title" style={styles.title}>
        Profil
      </ProDayText>
      <ProDayText variant="body" style={styles.muted}>
        {profile?.display_name || profile?.email || 'Supporter'}
      </ProDayText>

      <SpaceSection title="Favoris / clubs suivis" actionLabel="Clubs" onAction={() => nav.setActiveTab('plus')}>
        {follows.length ? (
          follows.slice(0, 10).map((f) => (
            <View key={f.id} style={styles.row}>
              <ProDayText variant="body" style={styles.name}>
                {f.target_label || f.target_id}
              </ProDayText>
              <ProDayText variant="caption" style={styles.muted}>
                {f.target_type}
              </ProDayText>
            </View>
          ))
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            Aucun favori pour l’instant.
          </ProDayText>
        )}
      </SpaceSection>

      <SpaceSection title="Préférences notifications">
        {(
          [
            ['goalAlerts', 'Alertes buts'],
            ['kickoffAlerts', 'Coup d’envoi'],
            ['matchReminders', 'Rappels match'],
            ['communityDigest', 'Digest tribune'],
            ['summaryAlerts', 'Résumés'],
          ] as Array<[keyof SupporterNotificationPreferences, string]>
        ).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <ProDayText variant="body" style={styles.name}>
              {label}
            </ProDayText>
            <Switch
              value={notifs[key]}
              onValueChange={(v) => void updateNotif(key, v)}
              trackColor={{ true: SUPPORTER_SPACE.accent, false: SUPPORTER_SPACE.band }}
            />
          </View>
        ))}
      </SpaceSection>

      <Pressable onPress={() => nav.setActiveTab('messages')} style={styles.link}>
        <ProDayText variant="body" style={styles.linkText}>
          Ouvrir la tribune →
        </ProDayText>
      </Pressable>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 22, marginBottom: 6 },
  muted: { color: SUPPORTER_SPACE.muted, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SPACE.border,
  },
  name: { color: SUPPORTER_SPACE.foreground },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  link: { marginTop: 8, paddingVertical: 12 },
  linkText: { color: SUPPORTER_SPACE.bright },
});

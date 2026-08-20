import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { HubScreen, HubSection } from '../../features/footballHub/components';
import { FOOTBALL_HUB } from '../../features/footballHub/theme/footballHubTheme';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { followsService } from '../../services/follows.service';
import {
  loadSupporterNotificationPrefs,
  type SupporterNotificationPreferences,
} from '../../services/supporterPreferences.service';
import type { Follow } from '../../models/Follow';

export const FootballHubProfileScreen: React.FC = () => {
  const { profile, signOut } = useAuth();
  const nav = useTabNavigationActions();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [prefs, setPrefs] = useState<SupporterNotificationPreferences | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService.listByFollower(profile.uid).then((list) => {
      setFollows(Array.isArray(list) ? list : []);
    }).catch(() => setFollows([]));
    void loadSupporterNotificationPrefs(profile.uid).then(setPrefs).catch(() => setPrefs(null));
  }, [profile?.uid]);

  const displayName =
    profile?.display_name ||
    profile?.email ||
    'Supporter ProDay';

  return (
    <HubScreen>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <ProDayText variant="title" style={styles.avatarText}>
            {(displayName.trim()[0] ?? 'P').toUpperCase()}
          </ProDayText>
        </View>
        <ProDayText variant="hero" style={styles.name}>
          {displayName}
        </ProDayText>
        <ProDayText variant="caption" style={styles.role}>
          Football Hub · Profil
        </ProDayText>
      </View>

      <HubSection title="Favoris">
        <ProDayText variant="body" style={styles.line}>
          {follows.length} suivi{follows.length > 1 ? 's' : ''}
        </ProDayText>
        <Pressable onPress={() => nav.setActiveTab?.('plus')}>
          <ProDayText variant="caption" style={styles.link}>
            Voir Favoris →
          </ProDayText>
        </Pressable>
      </HubSection>

      <HubSection title="Notifications">
        <ProDayText variant="body" style={styles.line}>
          Live : {prefs?.kickoffAlerts ? 'activé' : '—'}
        </ProDayText>
        <ProDayText variant="body" style={styles.line}>
          Scores : {prefs?.goalAlerts ? 'activé' : '—'}
        </ProDayText>
      </HubSection>

      <HubSection title="Réglages">
        <Pressable style={styles.btn} onPress={() => nav.setActiveTab?.('home')}>
          <ProDayText variant="body" style={styles.btnText}>
            Retour Accueil
          </ProDayText>
        </Pressable>
        {signOut ? (
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => void signOut()}>
            <ProDayText variant="body" style={styles.btnGhostText}>
              Se déconnecter
            </ProDayText>
          </Pressable>
        ) : null}
      </HubSection>
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: FOOTBALL_HUB.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FOOTBALL_HUB.accent,
  },
  avatarText: { color: FOOTBALL_HUB.foreground },
  name: { color: FOOTBALL_HUB.foreground, fontSize: 24 },
  role: { color: FOOTBALL_HUB.muted },
  line: { color: FOOTBALL_HUB.foreground },
  link: { color: FOOTBALL_HUB.bright, marginTop: 6 },
  btn: {
    backgroundColor: FOOTBALL_HUB.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  btnGhostText: { color: FOOTBALL_HUB.muted },
});

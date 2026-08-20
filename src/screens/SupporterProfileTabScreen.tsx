import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SupporterPageFrame } from '../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity } from '../content/supporterPageIdentity';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useTranslation } from '../context/LocaleContext';
import { useAppTheme } from '../context/ProductLineContext';
import { followsService } from '../services/follows.service';
import { supporterWatchHistoryService } from '../services/supporterWatchHistory.service';
import {
  loadSupporterNotificationPrefs,
  saveSupporterNotificationPrefs,
  type SupporterNotificationPreferences,
} from '../services/supporterPreferences.service';
import { spacing, radius } from '../theme/designTokens';
import { EditProfileScreen } from './EditProfileScreen';
import { SupporterSuivisScreen } from './SupporterSuivisScreen';

export const SupporterProfileTabScreen: React.FC = () => {
  const { signOut, refreshProfile } = useAuth();
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const [clubCount, setClubCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [tournamentCount, setTournamentCount] = useState(0);
  const [notifPrefs, setNotifPrefs] = useState<SupporterNotificationPreferences | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSuivis, setShowSuivis] = useState(false);
  const [watchStats, setWatchStats] = useState({ watched: 0, saved: 0, followed: 0 });

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const follows = await followsService.listByFollower(profile.uid);
      const list = Array.isArray(follows) ? follows : [];
      setClubCount(list.filter((f) => f.target_type === 'club').length);
      setPlayerCount(list.filter((f) => f.target_type === 'player').length);
      setTournamentCount(list.filter((f) => f.target_type === 'tournament').length);
    } catch {
      setClubCount(0);
      setPlayerCount(0);
      setTournamentCount(0);
    }
  }, [profile?.uid]);

  const loadNotifPrefs = useCallback(async () => {
    if (!profile?.uid) return;
    const prefs = await loadSupporterNotificationPrefs(profile.uid);
    setNotifPrefs(prefs);
  }, [profile?.uid]);

  const loadWatchStats = useCallback(async () => {
    if (!profile?.uid) return;
    try {
      const stats = await supporterWatchHistoryService.getStats(
        profile.uid,
        clubCount + tournamentCount,
      );
      setWatchStats(stats ?? { watched: 0, saved: 0, followed: 0 });
    } catch {
      setWatchStats({ watched: 0, saved: 0, followed: clubCount + tournamentCount });
    }
  }, [profile?.uid, clubCount, tournamentCount]);

  useEffect(() => {
    void loadFollows();
    void loadNotifPrefs();
  }, [loadFollows, loadNotifPrefs]);

  useEffect(() => {
    void loadWatchStats();
  }, [loadWatchStats]);

  const updateNotifPref = useCallback(
    async (key: keyof SupporterNotificationPreferences, value: boolean) => {
      if (!profile?.uid || !notifPrefs) return;
      const next = { ...notifPrefs, [key]: value };
      setNotifPrefs(next);
      await saveSupporterNotificationPrefs(profile.uid, next);
    },
    [profile?.uid, notifPrefs]
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(t('supporter.profile.logoutTitle'), t('supporter.profile.logoutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('supporter.profile.logoutConfirm'),
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }, [signOut, t]);

  const summary = useMemo(
    () =>
      t('supporter.profile.followSummary', {
        clubs: String(clubCount),
        players: String(playerCount),
        tournaments: String(tournamentCount),
      }),
    [clubCount, playerCount, tournamentCount, t]
  );

  const renderNotifRow = (
    key: keyof SupporterNotificationPreferences,
    labelKey: string,
    hintKey: string
  ) => {
    if (!notifPrefs) return null;
    return (
      <View style={[styles.notifRow, { borderColor: colors.border }]}>
        <View style={styles.notifCopy}>
          <ProDayText variant="body">{t(labelKey)}</ProDayText>
          <ProDayText variant="caption" muted>
            {t(hintKey)}
          </ProDayText>
        </View>
        <Switch
          value={notifPrefs[key]}
          onValueChange={(value) => void updateNotifPref(key, value)}
          trackColor={{ false: colors.border, true: colors.accentSoft }}
          thumbColor={notifPrefs[key] ? colors.accent : colors.surfaceMuted}
        />
      </View>
    );
  };

  if (!profile) {
    return (
      <SupporterPageFrame identity={getSupporterPageIdentity('compte')} badge="Gratuit">
        <View style={styles.guest}>
          <ProDayText variant="body" muted>
            {t('supporter.profile.guestHint')}
          </ProDayText>
          <ProDayText variant="caption" accent style={styles.freeBadge}>
            {t('supporter.profile.freeForever')}
          </ProDayText>
        </View>
      </SupporterPageFrame>
    );
  }

  if (showSuivis) {
    return (
      <View style={{ flex: 1 }}>
        <PressableSpring
          style={[styles.backLink, { borderColor: colors.border }]}
          onPress={() => setShowSuivis(false)}
          haptic
        >
          <ProDayText variant="caption" accent>
            ← Profil
          </ProDayText>
        </PressableSpring>
        <SupporterSuivisScreen />
      </View>
    );
  }

  return (
    <>
      <SupporterPageFrame identity={getSupporterPageIdentity('compte')} badge="100 % gratuit">
        <ScrollView contentContainerStyle={styles.content}>
          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.accent }]}>
            <ProDayText variant="eyebrow" accent>
              {t('supporter.profile.freeForever')}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {t('supporter.profile.freeForeverHint')}
            </ProDayText>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              {t('supporter.profile.account')}
            </ProDayText>
            <ProDayText
              variant="section"
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {profile.display_name}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {profile.email}
            </ProDayText>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              Mon histoire football
            </ProDayText>
            <ProDayText variant="body">
              {watchStats.watched} regardé{watchStats.watched !== 1 ? 's' : ''} · {watchStats.followed} suivi{watchStats.followed !== 1 ? 's' : ''} · {watchStats.saved} enregistré{watchStats.saved !== 1 ? 's' : ''}
            </ProDayText>
            <ProDayText variant="caption" muted>
              Mes matchs — historique synchronisé
            </ProDayText>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              {t('supporter.profile.follows')}
            </ProDayText>
            <ProDayText variant="body">{summary}</ProDayText>
            <PressableSpring
              style={[styles.linkBtn, { borderColor: colors.border }]}
              onPress={() => setShowSuivis(true)}
              haptic
            >
              <Icon name="heart" size={16} color={colors.accent} />
              <ProDayText variant="caption">Mes clubs et suivis</ProDayText>
            </PressableSpring>
            <PressableSpring
              style={[styles.linkBtn, { borderColor: colors.border, marginTop: spacing.sm }]}
              onPress={() => nav.setActiveTab('messages')}
              haptic
            >
              <Icon name="chat" size={16} color={colors.accent} />
              <ProDayText variant="caption">Fil communauté</ProDayText>
            </PressableSpring>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              {t('supporter.profile.notifications')}
            </ProDayText>
            {renderNotifRow(
              'goalAlerts',
              'supporter.profile.notif.goals',
              'supporter.profile.notif.goalsHint'
            )}
            {renderNotifRow(
              'kickoffAlerts',
              'supporter.profile.notif.kickoff',
              'supporter.profile.notif.kickoffHint'
            )}
            {renderNotifRow(
              'matchReminders',
              'supporter.profile.notif.reminders',
              'supporter.profile.notif.remindersHint'
            )}
            {renderNotifRow(
              'summaryAlerts',
              'supporter.profile.notif.summary',
              'supporter.profile.notif.summaryHint'
            )}
            {renderNotifRow(
              'communityDigest',
              'supporter.profile.notif.digest',
              'supporter.profile.notif.digestHint'
            )}
          </ProDaySurface>

          <PressableSpring
            style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowEdit(true)}
            haptic
          >
            <Icon name="person" size={18} color={colors.accent} />
            <ProDayText variant="body">{t('supporter.profile.editProfile')}</ProDayText>
          </PressableSpring>

          <PressableSpring
            style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => nav.setActiveTab('reels')}
            haptic
          >
            <Icon name="videocam" size={18} color={colors.accent} />
            <ProDayText variant="body">Vidéos</ProDayText>
          </PressableSpring>

          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.error ?? '#EF4444' }]}
            onPress={handleSignOut}
            activeOpacity={0.85}
          >
            <ProDayText variant="body" style={{ color: colors.error ?? '#EF4444' }}>
              {t('supporter.profile.logoutConfirm')}
            </ProDayText>
          </TouchableOpacity>
        </ScrollView>
      </SupporterPageFrame>

      <PushScreenTransition active={showEdit}>
        {showEdit ? (
          <EditProfileScreen
            user={profile}
            onBack={() => setShowEdit(false)}
            onSaved={async () => {
              setShowEdit(false);
              await refreshProfile();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  backLink: {
    margin: spacing.lg,
    marginBottom: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  guest: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  freeBadge: {
    marginTop: spacing.sm,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  linkBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notifCopy: {
    flex: 1,
    gap: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  logoutBtn: {
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

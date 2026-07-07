import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
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
import {
  loadSupporterNotificationPrefs,
  saveSupporterNotificationPrefs,
  type SupporterNotificationPreferences,
} from '../services/supporterPreferences.service';
import { spacing, radius } from '../theme/designTokens';
import { EditProfileScreen } from './EditProfileScreen';

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

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const follows = await followsService.listByFollower(profile.uid);
    setClubCount(follows.filter((f) => f.target_type === 'club').length);
    setPlayerCount(follows.filter((f) => f.target_type === 'player').length);
    setTournamentCount(follows.filter((f) => f.target_type === 'tournament').length);
  }, [profile?.uid]);

  const loadNotifPrefs = useCallback(async () => {
    if (!profile?.uid) return;
    const prefs = await loadSupporterNotificationPrefs(profile.uid);
    setNotifPrefs(prefs);
  }, [profile?.uid]);

  useEffect(() => {
    void loadFollows();
    void loadNotifPrefs();
  }, [loadFollows, loadNotifPrefs]);

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
      <TabScreenShell
        caption={t('supporter.shell.caption')}
        title={t('supporter.profile.title')}
        subtitle={t('supporter.profile.guestSub')}
        flat
      >
        <View style={styles.guest}>
          <ProDayText variant="body" muted>
            {t('supporter.profile.guestHint')}
          </ProDayText>
          <ProDayText variant="caption" accent style={styles.freeBadge}>
            {t('supporter.profile.freeForever')}
          </ProDayText>
        </View>
      </TabScreenShell>
    );
  }

  return (
    <>
      <TabScreenShell
        caption={t('supporter.shell.caption')}
        title={t('supporter.profile.title')}
        subtitle={profile.display_name}
        flat
      >
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
            <ProDayText variant="section">{profile.display_name}</ProDayText>
            <ProDayText variant="caption" muted>
              {profile.email}
            </ProDayText>
          </ProDaySurface>

          <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
            <ProDayText variant="eyebrow" muted>
              {t('supporter.profile.follows')}
            </ProDayText>
            <ProDayText variant="body">{summary}</ProDayText>
            <PressableSpring
              style={[styles.linkBtn, { borderColor: colors.border }]}
              onPress={() => nav.setActiveTab('feed')}
              haptic
            >
              <Icon name="star-four-points" size={16} color={colors.accent} />
              <ProDayText variant="caption">{t('supporter.profile.manageFollows')}</ProDayText>
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
            onPress={() => nav.setActiveTab('shop')}
            haptic
          >
            <Icon name="bag" size={18} color={colors.accent} />
            <ProDayText variant="body">{t('supporter.profile.shop')}</ProDayText>
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
      </TabScreenShell>

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

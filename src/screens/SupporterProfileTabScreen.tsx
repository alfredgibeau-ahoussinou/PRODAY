import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { spacing, radius } from '../theme/designTokens';
import { EditProfileScreen } from './EditProfileScreen';

const FREE_CLUB_LIMIT = 5;
const FREE_PLAYER_LIMIT = 10;

export const SupporterProfileTabScreen: React.FC = () => {
  const { signOut, refreshProfile } = useAuth();
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const [clubCount, setClubCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const follows = await followsService.listByFollower(profile.uid);
    setClubCount(follows.filter((f) => f.target_type === 'club').length);
    setPlayerCount(follows.filter((f) => f.target_type === 'player').length);
  }, [profile?.uid]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

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
        clubLimit: String(FREE_CLUB_LIMIT),
        players: String(playerCount),
        playerLimit: String(FREE_PLAYER_LIMIT),
      }),
    [clubCount, playerCount, t],
  );

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

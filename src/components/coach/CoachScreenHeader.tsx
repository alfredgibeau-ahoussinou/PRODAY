import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import { CoachText } from './coachPortalUi';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { useTranslation } from '../../context/LocaleContext';
import { coachCalendarInitials } from '../../utils/coachCalendarHome';
import { spacing } from '../../theme/designTokens';

export type CoachHeaderAction = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
};

type Props = {
  title: string;
  actions?: CoachHeaderAction[];
  /** Rangée club + messages / profil — à garder sur les onglets primaires. */
  showTeamRow?: boolean;
  /** Badge messagerie (header Accueil). */
  unreadMessages?: number;
};

export function CoachCircleIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleBtn,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { opacity: 0.65 },
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <Icon name={icon} size={size > 36 ? 22 : 18} color={COACH_SITE.foreground} />
    </Pressable>
  );
}

/** Chrome SportEasy — rangée équipe + grand titre Inter + actions circulaires. */
export function CoachScreenHeader({
  title,
  actions,
  showTeamRow = true,
  unreadMessages = 0,
}: Props) {
  const { t } = useTranslation();
  const { teamName, profile, openNav, displayName } = useCoachTeamChrome();

  return (
    <View style={styles.headerPad}>
      {showTeamRow ? (
        <View style={styles.teamRow}>
          <View style={styles.teamLeft}>
            <View style={styles.avatar}>
              <CoachText variant="caption" style={styles.avatarText}>
                {coachCalendarInitials(teamName)}
              </CoachText>
            </View>
            <CoachText variant="section" numberOfLines={1} style={styles.teamName}>
              {teamName}
            </CoachText>
          </View>
          <View style={styles.teamActions}>
            <Pressable
              onPress={() => openNav('messages')}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.65 }]}
              accessibilityLabel={t('messages.title')}
            >
              <Icon name="chat" size={22} color={COACH_SITE.foreground} />
              {unreadMessages > 0 ? (
                <View style={styles.badge}>
                  <CoachText variant="caption" style={styles.badgeText}>
                    {unreadMessages > 9 ? '9+' : String(unreadMessages)}
                  </CoachText>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => openNav('profil')}
              style={({ pressed }) => [pressed && { opacity: 0.65 }]}
              accessibilityLabel={t('coach.calendar.profile')}
            >
              <View style={styles.avatar}>
                <CoachText variant="caption" style={styles.avatarText}>
                  {coachCalendarInitials(profile?.display_name ?? displayName, 'CO')}
                </CoachText>
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.titleRow}>
        <CoachText variant="title" style={styles.pageTitle}>
          {title}
        </CoachText>
        {actions && actions.length > 0 ? (
          <View style={styles.titleActions}>
            {actions.map((action) => (
              <CoachCircleIconButton
                key={`${action.icon}-${action.accessibilityLabel}`}
                icon={action.icon}
                onPress={action.onPress}
                accessibilityLabel={action.accessibilityLabel}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function CoachPane({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: CoachHeaderAction[];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.pane}>
      <CoachScreenHeader title={title} actions={actions} />
      <View style={styles.paneBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
  paneBody: { flex: 1, minHeight: 0 },
  headerPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  teamLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    flex: 1,
    color: COACH_SITE.foreground,
    fontWeight: '700',
    fontSize: 17,
  },
  teamActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.elevated,
  },
  avatarText: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', lineHeight: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  pageTitle: {
    flex: 1,
    color: COACH_SITE.foreground,
    fontWeight: '800',
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  circleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.surface,
  },
});
